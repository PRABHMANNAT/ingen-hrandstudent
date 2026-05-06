import { NextRequest } from "next/server"

type PathwayTone = "start" | "skill" | "proof" | "apply" | "interview" | "offer"

type GeneratedMeta = {
  targetCompany: string
  targetRole: string
  title: string
  description: string
  duration: string
  output: string
}

type GeneratedStage = {
  eyebrow: string
  title: string
  summary: string
  metric: string
  tone: PathwayTone
  tasks: string[]
}

const STAGE_LAYOUT = [
  { x: 42, y: 150 },
  { x: 350, y: 150 },
  { x: 658, y: 150 },
  { x: 658, y: 390 },
  { x: 350, y: 390 },
  { x: 42, y: 390 },
  { x: 42, y: 645 },
  { x: 350, y: 645 },
  { x: 658, y: 645 },
]

const TONES: PathwayTone[] = ["start", "skill", "skill", "proof", "proof", "apply", "interview", "offer"]

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { prompt?: string } | null
  const prompt = body?.prompt?.trim()

  if (!prompt) {
    return Response.json({ error: "Prompt is required" }, { status: 400 })
  }

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: unknown) => controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`))

      try {
        send({ type: "status", message: "Reading the target role and company..." })
        const pathway = await streamPathwayFromProviders(prompt, send)
        send({ type: "final", pathway })
      } catch (error) {
        console.error("[student-pathway] generation_failed", error)
        send({
          type: "error",
          message: "The live pathway generator could not complete. Check the server environment keys and try again.",
        })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store, no-transform",
      "X-Accel-Buffering": "no",
    },
  })
}

async function streamPathwayFromProviders(prompt: string, send: (event: unknown) => void) {
  const providers = [
    {
      label: "OpenAI primary",
      endpoint: "https://api.openai.com/v1/chat/completions",
      apiKey: process.env.OPENAI_API_KEY_PRIMARY || process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    },
    {
      label: "OpenAI fallback",
      endpoint: "https://api.openai.com/v1/chat/completions",
      apiKey: process.env.OPENAI_API_KEY_FALLBACK || process.env.OPENAI_API_KEY_SECONDARY,
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    },
    {
      label: "Groq fallback",
      endpoint: "https://api.groq.com/openai/v1/chat/completions",
      apiKey: process.env.GROQ_API_KEY || process.env.GROQ_API_KEY_1 || process.env.GROQ_API_KEY_2,
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
    },
  ]

  let lastError: unknown

  for (const provider of providers) {
    if (!provider.apiKey || provider.apiKey.trim().length < 8) continue

    try {
      send({ type: "status", message: `Generating with ${provider.label}...` })
      return await streamProviderPathway(provider, prompt, send)
    } catch (error) {
      lastError = error
      console.warn(`[student-pathway] provider_failed=${provider.label}`, error)
      send({ type: "status", message: `${provider.label} failed. Trying fallback provider...` })
    }
  }

  throw lastError instanceof Error ? lastError : new Error("No configured pathway provider")
}

async function streamProviderPathway(
  provider: { endpoint: string; apiKey?: string; model: string },
  prompt: string,
  send: (event: unknown) => void
) {
  const response = await fetch(provider.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${provider.apiKey}`,
    },
    body: JSON.stringify({
      model: provider.model,
      temperature: 0.35,
      stream: true,
      messages: [
        {
          role: "system",
          content:
            "You create practical job pathway diagrams for students. Output newline-delimited JSON only. " +
            "First output exactly one meta object. Then output 7 or 8 stage objects, one object per line. " +
            "No markdown, no commentary, no arrays. Each line must be valid compact JSON.",
        },
        {
          role: "user",
          content: buildPrompt(prompt),
        },
      ],
    }),
  })

  if (!response.ok || !response.body) {
    const text = await response.text().catch(() => "")
    throw new Error(`Provider failed ${response.status}: ${text.slice(0, 180)}`)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let sseBuffer = ""
  let lineBuffer = ""
  let fullText = ""
  let meta: GeneratedMeta | null = null
  const stages: GeneratedStage[] = []

  const consumeModelText = (delta: string) => {
    fullText += delta
    lineBuffer += delta

    let newlineIndex = lineBuffer.indexOf("\n")
    while (newlineIndex >= 0) {
      const line = lineBuffer.slice(0, newlineIndex).trim()
      lineBuffer = lineBuffer.slice(newlineIndex + 1)
      try {
        processModelLine(line, (event) => {
          if (event.type === "meta") {
            meta = event.meta
            send({ type: "meta", meta })
          }
          if (event.type === "stage") {
            const stage = normalizeStage(event.stage, stages.length)
            stages.push(stage)
            send({ type: "stage", stage: layoutStage(stage, stages.length - 1) })
          }
        })
      } catch {
        // The model is streaming line-oriented JSON; ignore malformed partial lines and recover at the end.
      }
      newlineIndex = lineBuffer.indexOf("\n")
    }
  }

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    sseBuffer += decoder.decode(value, { stream: true })
    const packets = sseBuffer.split("\n\n")
    sseBuffer = packets.pop() || ""

    for (const packet of packets) {
      const dataLines = packet
        .split("\n")
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.replace(/^data:\s?/, ""))

      for (const data of dataLines) {
        if (data === "[DONE]") continue
        const parsed = JSON.parse(data)
        const delta = parsed?.choices?.[0]?.delta?.content
        if (typeof delta === "string") consumeModelText(delta)
      }
    }
  }

  try {
    processModelLine(lineBuffer.trim(), (event) => {
      if (event.type === "meta") meta = event.meta
      if (event.type === "stage") stages.push(normalizeStage(event.stage, stages.length))
    })
  } catch {
    // Final recovery below will retry against the complete streamed text.
  }

  if (!meta || stages.length < 4) {
    const recovered = recoverPathway(fullText)
    if (recovered) {
      meta = recovered.meta
      stages.splice(0, stages.length, ...recovered.stages.map(normalizeStage))
    }
  }

  if (!meta || stages.length < 4) {
    throw new Error("Provider returned incomplete pathway JSON")
  }

  return buildPathway(meta, stages)
}

function buildPrompt(prompt: string) {
  return `User request: ${prompt}

Return the pathway for the requested target job. If the company or role is vague, infer the most likely target and make it explicit.

Required line 1:
{"type":"meta","targetCompany":"Company","targetRole":"Role","title":"Role at Company - Pathway","description":"One concise sentence.","duration":"6-10 weeks","output":"Final tangible outcome"}

Required following lines:
{"type":"stage","eyebrow":"Target","title":"Stage title","summary":"Concrete student action.","metric":"Short metric","tone":"start","tasks":["Task one","Task two","Task three"]}

Allowed tones: start, skill, proof, apply, interview, offer.
Keep stage titles under 34 characters. Keep summaries under 95 characters. Each stage needs exactly 3 tasks.`
}

function processModelLine(
  line: string,
  onEvent: (event: { type: "meta"; meta: GeneratedMeta } | { type: "stage"; stage: GeneratedStage }) => void
) {
  const cleaned = line.replace(/^```json/i, "").replace(/^```/, "").replace(/```$/, "").trim()
  if (!cleaned || !cleaned.startsWith("{")) return

  const parsed = JSON.parse(cleaned) as ({ type?: string } & Partial<GeneratedMeta> & Partial<GeneratedStage>)
  if (parsed.type === "meta") {
    onEvent({
      type: "meta",
      meta: {
        targetCompany: cleanText(parsed.targetCompany, "Target Company"),
        targetRole: cleanText(parsed.targetRole, "Target Role"),
        title: cleanText(parsed.title, "Generated Job Pathway"),
        description: cleanText(parsed.description, "A focused pathway from current proof to interview readiness."),
        duration: cleanText(parsed.duration, "6-10 weeks"),
        output: cleanText(parsed.output, "Referral-ready packet + interview plan + role-specific project proof"),
      },
    })
  }

  if (parsed.type === "stage") {
    onEvent({
      type: "stage",
      stage: {
        eyebrow: cleanText(parsed.eyebrow, "Step"),
        title: cleanText(parsed.title, "Pathway Stage"),
        summary: cleanText(parsed.summary, "Complete the next concrete step in the pathway."),
        metric: cleanText(parsed.metric, "Milestone"),
        tone: isTone(parsed.tone) ? parsed.tone : "skill",
        tasks: Array.isArray(parsed.tasks) ? parsed.tasks.map((task) => cleanText(task, "Action")).slice(0, 3) : ["Research", "Build proof", "Practice"],
      },
    })
  }
}

function recoverPathway(text: string): { meta: GeneratedMeta; stages: GeneratedStage[] } | null {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)

  let meta: GeneratedMeta | null = null
  const stages: GeneratedStage[] = []

  for (const line of lines) {
    try {
      processModelLine(line, (event) => {
        if (event.type === "meta") meta = event.meta
        if (event.type === "stage") stages.push(event.stage)
      })
    } catch {
      continue
    }
  }

  return meta && stages.length >= 4 ? { meta, stages } : null
}

function buildPathway(meta: GeneratedMeta, stages: GeneratedStage[]) {
  const laidOutStages = stages.slice(0, STAGE_LAYOUT.length).map(layoutStage)
  const maxStageBottom = laidOutStages.reduce((max, stage) => Math.max(max, stage.y + stage.h), 0)

  return {
    id: `generated-${slugify(meta.targetCompany)}-${slugify(meta.targetRole)}-pathway`,
    title: meta.title,
    targetCompany: meta.targetCompany,
    targetRole: meta.targetRole,
    description: meta.description,
    duration: meta.duration,
    output: meta.output,
    canvasWidth: 960,
    canvasHeight: Math.max(920, maxStageBottom + 145),
    stages: laidOutStages,
  }
}

function layoutStage(stage: GeneratedStage, index: number) {
  const position = STAGE_LAYOUT[index] || STAGE_LAYOUT[STAGE_LAYOUT.length - 1]
  return {
    id: `${slugify(stage.title)}-${index + 1}`,
    ...stage,
    tone: isTone(stage.tone) ? stage.tone : TONES[index] || "skill",
    x: position.x,
    y: position.y,
    w: 260,
    h: index >= 6 ? 196 : 202,
  }
}

function normalizeStage(stage: GeneratedStage, index: number) {
  return {
    eyebrow: cleanText(stage.eyebrow, "Step").slice(0, 22),
    title: cleanText(stage.title, `Stage ${index + 1}`).slice(0, 44),
    summary: cleanText(stage.summary, "Complete this step to move closer to the role.").slice(0, 130),
    metric: cleanText(stage.metric, "Milestone").slice(0, 24),
    tone: isTone(stage.tone) ? stage.tone : TONES[index] || "skill",
    tasks: normalizeTasks(stage.tasks),
  }
}

function normalizeTasks(tasks: string[]) {
  const next = Array.isArray(tasks) ? tasks.map((task) => cleanText(task, "Action").slice(0, 34)).filter(Boolean).slice(0, 3) : []
  while (next.length < 3) next.push(["Research target", "Build proof", "Practice loop"][next.length])
  return next
}

function cleanText(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback
}

function isTone(value: unknown): value is PathwayTone {
  return typeof value === "string" && ["start", "skill", "proof", "apply", "interview", "offer"].includes(value)
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40)
}
