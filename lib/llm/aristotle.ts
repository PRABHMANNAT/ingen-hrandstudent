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

function systemPrompt(profile: FullProfile, attachments: AttachmentInput[]): string {
  const sections = profile.sections.map((s) => ({ type: s.type, title: s.title, items: s.items.length }))
  return [
    "You are Aristotle, an assistant that edits a student's proof-backed candidate profile.",
    "You translate the user's request into a JSON plan of concrete profile edits. Be decisive and helpful.",
    "",
    "Return ONLY a JSON object with this exact shape:",
    `{
  "reply": "a short, friendly 1-2 sentence summary of what you did or asked",
  "actions": [
    { "kind": "update_header", "full_name"?, "headline"?, "about"?, "tags"?: string[], "target_role"? },
    { "kind": "create_section", "type": "education|experience|projects|research|hackathons|social-work|certifications|skills|custom", "title": "Human Title" },
    { "kind": "add_item", "section_type": "<one of the section types>", "section_title"?: "Human Title", "title"?, "body"?, "images"?: string[], "proofs"?: [{ "kind": "github|doi|image|link|file", "url": "..." }] }
  ]
}`,
    "",
    "Rules:",
    "- Only emit actions the user actually asked for. If they only chat, return an empty actions array and just reply.",
    "- Reuse an existing section (match by type) when adding items; only create_section if none of that type exists.",
    "- For showcase/event photos the user attached, put their URLs in add_item.images.",
    "- For verification documents (certificates, trophies, award screenshots) use proofs with kind 'image' and the attached URL.",
    "- For GitHub repos use proofs kind 'github'; research papers/DOIs use 'doi'; other links use 'link'.",
    "- Extract concrete details (dates, titles, roles, descriptions) from the user's text and any attached images you can read.",
    "- Keep item.body concise (one or two lines).",
    "",
    `Current profile header: name="${profile.full_name}", headline="${profile.headline}", target_role="${profile.target_role}", tags=${JSON.stringify(profile.tags)}.`,
    `Existing sections: ${JSON.stringify(sections)}.`,
    attachments.length
      ? `The user attached these files (use their URLs in actions when relevant): ${JSON.stringify(attachments.map((a) => ({ url: a.url, name: a.name, isImage: isImage(a) })))}.`
      : "No attachments.",
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
        max_tokens: 1800,
        messages: [
          { role: "system", content: systemPrompt(profile, attachments) },
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
