import { NextResponse } from "next/server"
import { z } from "zod"
import { getSherlockPersistenceContext, writeSherlockAudit } from "@/lib/sherlock/server-store"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const humanNoteSchema = z.object({
  sessionId: z.string().uuid(),
  auditEntryId: z.string().min(1),
  note: z.string().trim().max(2000),
})

export async function GET(request: Request) {
  const url = new URL(request.url)
  const sessionId = url.searchParams.get("sessionId")

  if (!sessionId || !isUuid(sessionId)) {
    return NextResponse.json({ ok: false, error: "A UUID sessionId is required" }, { status: 400 })
  }

  const persistence = await getSherlockPersistenceContext()
  if (!persistence.available) {
    return NextResponse.json({
      ok: true,
      persisted: false,
      reason: persistence.reason,
      auditLog: [],
    })
  }

  const { data, error } = await persistence.supabase
    .from("sherlock_audit_log")
    .select("id,session_id,actor_type,event_type,event_json,created_at")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: false })
    .limit(200)

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    persisted: true,
    auditLog: (data ?? []).map((entry) => ({
      id: entry.id,
      time: entry.created_at,
      actor: entry.actor_type,
      event: entry.event_type,
      source: "Supabase audit log",
      evidenceIds: extractEvidenceIds(entry.event_json),
      details: entry.event_json ?? {},
    })),
  })
}

export async function POST(request: Request) {
  const parsed = humanNoteSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid human note payload" }, { status: 400 })
  }

  const persistence = await getSherlockPersistenceContext()
  if (!persistence.available) {
    return NextResponse.json({
      ok: true,
      persisted: false,
      reason: persistence.reason,
      localStorageKey: "sherlock-audit-notes-v1",
    })
  }

  await writeSherlockAudit(persistence.supabase, {
    sessionId: parsed.data.sessionId,
    actorType: "user",
    eventType: "human_note_added",
    eventJson: {
      auditEntryId: parsed.data.auditEntryId,
      note: parsed.data.note,
    },
  })

  return NextResponse.json({ ok: true, persisted: true })
}

function extractEvidenceIds(value: unknown) {
  if (!value || typeof value !== "object") return []
  const record = value as Record<string, unknown>
  const candidates = [record.evidenceIds, record.evidence_ids, record.evidenceId, record.evidence_id]
  return candidates.flatMap((candidate) => {
    if (Array.isArray(candidate)) return candidate.filter((entry): entry is string => typeof entry === "string")
    return typeof candidate === "string" ? [candidate] : []
  })
}

function isUuid(value: string | undefined) {
  return Boolean(value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i.test(value))
}
