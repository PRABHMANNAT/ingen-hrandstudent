import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getCurrentProfile } from "@/lib/profile/queries"
import { planProfileEdits, type AristotleAction, type AttachmentInput } from "@/lib/llm/aristotle"

export const dynamic = "force-dynamic"

type Body = { message?: string; attachments?: AttachmentInput[] }

const PROOF_KINDS = new Set(["github", "doi", "image", "link", "file"])
const prettify = (type: string) =>
  type.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const body = (await request.json()) as Body
  const message = (body.message ?? "").trim()
  const attachments = Array.isArray(body.attachments) ? body.attachments.slice(0, 8) : []
  if (!message && attachments.length === 0) {
    return NextResponse.json({ error: "Empty message" }, { status: 400 })
  }

  const profile = await getCurrentProfile()
  if (!profile) return NextResponse.json({ error: "No profile" }, { status: 404 })

  const result = await planProfileEdits(message, profile, attachments)

  if (!result.ok) {
    // Still record the user's message so the chat history is consistent.
    await supabase.from("chat_messages").insert({
      profile_id: user.id,
      role: "user",
      content: message,
      attachments,
    })
    const reply = result.error.includes("not configured")
      ? "AI editing isn't configured yet — add an OPENAI_API_KEY to enable Aristotle."
      : `I hit an error talking to the model: ${result.error}`
    await supabase.from("chat_messages").insert({ profile_id: user.id, role: "assistant", content: reply })
    return NextResponse.json({ reply, applied: 0 }, { status: 200 })
  }

  const applied = await applyActions(supabase, user.id, result.plan.actions)

  // Persist the conversation turn.
  await supabase.from("chat_messages").insert([
    { profile_id: user.id, role: "user", content: message, attachments },
    { profile_id: user.id, role: "assistant", content: result.plan.reply },
  ])

  return NextResponse.json({ reply: result.plan.reply, applied })
}

async function applyActions(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  actions: AristotleAction[],
): Promise<number> {
  let applied = 0

  // Cache of sections by type so add_item can resolve/create lazily.
  const sectionByType = new Map<string, { id: string; position: number }>()
  const { data: existing } = await supabase
    .from("sections")
    .select("id, type, position")
    .eq("profile_id", userId)
  let maxSectionPos = -1
  for (const s of existing ?? []) {
    if (!sectionByType.has(s.type)) sectionByType.set(s.type, { id: s.id, position: s.position })
    if (s.position > maxSectionPos) maxSectionPos = s.position
  }

  async function ensureSection(type: string, title?: string): Promise<string | null> {
    const key = type.toLowerCase()
    const found = sectionByType.get(key)
    if (found) return found.id
    maxSectionPos += 1
    const { data, error } = await supabase
      .from("sections")
      .insert({ profile_id: userId, type: key, title: title?.trim() || prettify(key), position: maxSectionPos })
      .select("id")
      .single()
    if (error || !data) return null
    sectionByType.set(key, { id: data.id, position: maxSectionPos })
    return data.id
  }

  for (const action of actions) {
    try {
      if (action.kind === "update_header") {
        const patch: Record<string, unknown> = {}
        if (typeof action.full_name === "string") patch.full_name = action.full_name.trim()
        if (typeof action.headline === "string") patch.headline = action.headline.trim()
        if (typeof action.about === "string") patch.about = action.about.trim()
        if (typeof action.target_role === "string") patch.target_role = action.target_role.trim()
        if (Array.isArray(action.tags)) patch.tags = action.tags.map((t) => String(t).trim()).filter(Boolean).slice(0, 12)
        if (Object.keys(patch).length) {
          const { error } = await supabase.from("profiles").update(patch).eq("id", userId)
          if (!error) applied += 1
        }
      } else if (action.kind === "create_section") {
        const id = await ensureSection(action.type, action.title)
        if (id) applied += 1
      } else if (action.kind === "add_item") {
        const sectionId = await ensureSection(action.section_type, action.section_title)
        if (!sectionId) continue
        const { count } = await supabase
          .from("items")
          .select("id", { count: "exact", head: true })
          .eq("section_id", sectionId)
        const images = Array.isArray(action.images) ? action.images.filter((u) => typeof u === "string") : []
        const { data: item, error } = await supabase
          .from("items")
          .insert({
            section_id: sectionId,
            title: (action.title ?? "").trim(),
            body: (action.body ?? "").trim(),
            meta: images.length ? { images } : {},
            position: count ?? 0,
          })
          .select("id")
          .single()
        if (error || !item) continue
        applied += 1

        const proofs = (action.proofs ?? [])
          .filter((p) => p && typeof p.url === "string" && PROOF_KINDS.has(p.kind))
          .map((p) => ({ item_id: item.id, kind: p.kind, url: p.url, status: "unverified" as const }))
        if (proofs.length) await supabase.from("proofs").insert(proofs)
      }
    } catch {
      // Skip a bad action rather than failing the whole turn.
    }
  }

  return applied
}
