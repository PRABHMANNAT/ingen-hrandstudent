import "server-only"
import type { FullProfile } from "@/lib/supabase/types"

// Aristotle turns a natural-language message (+ optional image attachments)
// into a plan of profile edits. The model returns structured JSON which the
// API route applies against Supabase under the user's RLS context.

export type AttachmentInput = { url: string; name: string; type: string }

export type AristotleAction =
  | {
      kind: "update_header"
      full_name?: string
      headline?: string
      about?: string
      tags?: string[]
      target_role?: string
    }
  | { kind: "create_section"; type: string; title: string }
  | {
      kind: "add_item"
      section_type: string
      section_title?: string
      title?: string
      body?: string
      images?: string[]
      proofs?: { kind: string; url: string }[]
    }

export type AristotlePlan = { reply: string; actions: AristotleAction[] }

const OPENAI_TIMEOUT_MS = 45000

function isImage(att: AttachmentInput) {
  return att.type.startsWith("image/") || /\.(png|jpe?g|gif|webp)$/i.test(att.url)
}

function isPdf(att: AttachmentInput) {
  return att.type === "application/pdf" || /\.pdf($|\?)/i.test(att.url) || /\.pdf$/i.test(att.name)
}

function isDocx(att: AttachmentInput) {
  return (
    att.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    /\.docx($|\?)/i.test(att.url) ||
    /\.docx$/i.test(att.name)
  )
}

function isPlainText(att: AttachmentInput) {
  if (att.type.startsWith("text/")) return true
  return /\.(md|markdown|txt|csv|rtf)($|\?)/i.test(att.url) || /\.(md|markdown|txt|csv|rtf)$/i.test(att.name)
}

const MAX_EXTRACT_CHARS_PER_FILE = 12000

export type ExtractedDoc = { name: string; type: string; url: string; text: string; truncated: boolean }

// Fetch each non-image attachment and extract plain text so the LLM can read it.
// Errors don't fail the whole turn — they get logged and the file is skipped.
export async function extractAttachmentTexts(attachments: AttachmentInput[]): Promise<ExtractedDoc[]> {
  const targets = attachments.filter((a) => !isImage(a) && (isPdf(a) || isDocx(a) || isPlainText(a)))
  if (targets.length === 0) return []

  const results = await Promise.all(
    targets.map(async (att): Promise<ExtractedDoc | null> => {
      try {
        const res = await fetch(att.url)
        if (!res.ok) return null
        let text = ""
        if (isPdf(att)) {
          const buf = Buffer.from(await res.arrayBuffer())
          // @ts-expect-error pdf-parse has no shipped types
          const pdfParse = (await import("pdf-parse")).default as (b: Buffer) => Promise<{ text: string }>
          const parsed = await pdfParse(buf)
          text = parsed.text ?? ""
        } else if (isDocx(att)) {
          const buf = Buffer.from(await res.arrayBuffer())
          const mammoth = await import("mammoth")
          const parsed = await mammoth.extractRawText({ buffer: buf })
          text = parsed.value ?? ""
        } else if (isPlainText(att)) {
          text = await res.text()
        }
        text = text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim()
        const truncated = text.length > MAX_EXTRACT_CHARS_PER_FILE
        if (truncated) text = text.slice(0, MAX_EXTRACT_CHARS_PER_FILE)
        return { name: att.name, type: att.type, url: att.url, text, truncated }
      } catch (err) {
        console.error("[aristotle] extract failed for", att.name, err)
        return null
      }
    }),
  )
  return results.filter((r): r is ExtractedDoc => Boolean(r && r.text))
}

function systemPrompt(profile: FullProfile, attachments: AttachmentInput[], extracted: ExtractedDoc[]): string {
  const sections = profile.sections.map((s) => ({ type: s.type, title: s.title, items: s.items.length }))
  const extractedBlock = extracted.length
    ? [
        "",
        "The user attached these documents — TREAT THIS TEXT AS GROUND TRUTH and extract concrete profile content from it (name, headline, education, experience with dates+companies+roles+locations, projects with stack, skills, awards, etc.). Use this even if the user's text message is brief or empty:",
        ...extracted.map(
          (d, i) =>
            `\n--- Document ${i + 1}: ${d.name} (${d.type || "unknown"})${d.truncated ? " [truncated]" : ""} ---\n${d.text}\n--- end document ${i + 1} ---`,
        ),
      ].join("\n")
    : ""

  return [
    "You are Aristotle, an assistant that edits a student's proof-backed candidate profile.",
    "You translate the user's request into a JSON plan of concrete profile edits. Be decisive and helpful.",
    "",
    "Return ONLY a JSON object with this exact shape:",
    `{
  "reply": "a short, friendly 1-2 sentence summary of what you did or asked",
  "actions": [
    { "kind": "update_header", "full_name"?, "headline"?, "about"?, "tags"?: string[], "target_role"? },
    { "kind": "create_section", "type": "education|experience|projects|research|hackathons|social-work|certifications|skills|custom|gallery", "title": "Human Title" },
    { "kind": "add_item", "section_type": "<one of the section types>", "section_title"?: "Human Title", "title"?, "body"?, "images"?: string[], "proofs"?: [{ "kind": "github|doi|image|link|file", "url": "..." }] }
  ]
}`,
    "",
    "Rules:",
    "- If a document is attached (resume/CV/markdown notes), READ IT and emit a comprehensive plan: update_header for name/headline/about/target_role/tags, plus add_item per education entry, experience role, project, award, etc. Don't be conservative — build out the full profile from the document.",
    "- Reuse an existing section (match by type) when adding items; only create_section if none of that type exists.",
    "- For showcase/event photos the user attached, put their URLs in add_item.images.",
    "- For verification documents (certificates, trophies, award screenshots) use proofs with kind 'image' and the attached URL.",
    "- For GitHub repos use proofs kind 'github'; research papers/DOIs use 'doi'; other links use 'link'; attached PDFs/DOCX use 'file'.",
    "- Keep item.body concise (one or two lines summarizing impact + tech).",
    "",
    `Current profile header: name="${profile.full_name}", headline="${profile.headline}", target_role="${profile.target_role}", tags=${JSON.stringify(profile.tags)}.`,
    `Existing sections: ${JSON.stringify(sections)}.`,
    attachments.length
      ? `Attachment list: ${JSON.stringify(attachments.map((a) => ({ url: a.url, name: a.name, isImage: isImage(a) })))}.`
      : "No attachments.",
    extractedBlock,
  ].join("\n")
}

export async function planProfileEdits(
  message: string,
  profile: FullProfile,
  attachments: AttachmentInput[],
): Promise<{ ok: true; plan: AristotlePlan } | { ok: false; error: string }> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return { ok: false, error: "OPENAI_API_KEY not configured" }

  const model = process.env.OPENAI_MODEL || "gpt-4o-mini"

  // Extract plain text from PDF/DOCX/MD/TXT attachments before calling the model.
  const extracted = await extractAttachmentTexts(attachments)

  // Build a multimodal user message: text + any image attachments for vision.
  const userContent: Array<Record<string, unknown>> = [{ type: "text", text: message || "(no text — act on the attachments)" }]
  for (const att of attachments.filter(isImage)) {
    userContent.push({ type: "image_url", image_url: { url: att.url } })
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS)

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        response_format: { type: "json_object" },
        temperature: 0.2,
        max_completion_tokens: 3500,
        messages: [
          { role: "system", content: systemPrompt(profile, attachments, extracted) },
          { role: "user", content: userContent },
        ],
      }),
    })
    clearTimeout(timeout)

    if (!response.ok) {
      const errorText = await response.text()
      return { ok: false, error: `OpenAI error ${response.status}: ${errorText.slice(0, 300)}` }
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content
    if (!content) return { ok: false, error: "Empty response from OpenAI" }

    const parsed = JSON.parse(content) as Partial<AristotlePlan>
    return {
      ok: true,
      plan: {
        reply: typeof parsed.reply === "string" ? parsed.reply : "Done.",
        actions: Array.isArray(parsed.actions) ? (parsed.actions as AristotleAction[]) : [],
      },
    }
  } catch (error) {
    if (error instanceof Error) {
      return { ok: false, error: error.name === "AbortError" ? "OpenAI request timed out" : error.message }
    }
    return { ok: false, error: "Unknown OpenAI error" }
  }
}
