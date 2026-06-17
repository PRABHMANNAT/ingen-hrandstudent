import { NextResponse } from "next/server"
import { getSherlockPersistenceContext, toSavedReportLocalStorageItem, writeSherlockAudit } from "@/lib/sherlock/server-store"
import { sherlockArtifactEnvelopeSchema } from "@/lib/sherlock/schemas"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params
  if (!isUuid(id)) {
    return NextResponse.json({ ok: false, error: "Invalid report id" }, { status: 400 })
  }

  const persistence = await getSherlockPersistenceContext()
  if (!persistence.available) {
    return NextResponse.json({
      ok: true,
      persisted: false,
      fallback: "localStorage",
      reason: persistence.reason,
      localStorageKey: "sherlock-saved-reports-v1",
    })
  }

  const { data, error } = await persistence.supabase
    .from("sherlock_saved_reports")
    .select("id,title,summary,tags,saved_at,report_id,sherlock_reports(id,session_id,artifact_envelope)")
    .eq("id", id)
    .eq("owner_user_id", persistence.userId)
    .single()

  if (error || !data) {
    return NextResponse.json({ ok: false, error: error?.message ?? "Saved report not found" }, { status: 404 })
  }

  const reportRows = data.sherlock_reports
  const report = Array.isArray(reportRows) ? reportRows[0] : reportRows
  const parsed = sherlockArtifactEnvelopeSchema.safeParse(report?.artifact_envelope)
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Saved report artifact is invalid" }, { status: 422 })
  }

  return NextResponse.json({
    ok: true,
    persisted: true,
    reportId: report?.id,
    savedReportId: data.id,
    localStorageItem: {
      ...toSavedReportLocalStorageItem(parsed.data, data.id),
      title: data.title,
      summary: data.summary,
      tags: data.tags ?? [],
      savedAt: data.saved_at,
    },
  })
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params
  if (!isUuid(id)) {
    return NextResponse.json({ ok: false, error: "Invalid report id" }, { status: 400 })
  }

  const persistence = await getSherlockPersistenceContext()
  if (!persistence.available) {
    return NextResponse.json({
      ok: true,
      persisted: false,
      fallback: "localStorage",
      reason: persistence.reason,
      localStorageKey: "sherlock-saved-reports-v1",
    })
  }

  const { supabase, userId } = persistence
  const { data: savedReport, error: savedError } = await supabase
    .from("sherlock_saved_reports")
    .select("id,report_id,title")
    .eq("id", id)
    .eq("owner_user_id", userId)
    .single()

  if (savedError || !savedReport) {
    return NextResponse.json({ ok: false, error: savedError?.message ?? "Saved report not found" }, { status: 404 })
  }

  const { data: report } = await supabase
    .from("sherlock_reports")
    .select("id,session_id")
    .eq("id", savedReport.report_id)
    .single()

  if (report?.session_id) {
    await writeSherlockAudit(supabase, {
      sessionId: report.session_id,
      actorType: "user",
      eventType: "report_deleted",
      eventJson: {
        reportId: savedReport.report_id,
        savedReportId: savedReport.id,
        title: savedReport.title,
      },
    })
  }

  const { error: deleteSavedError } = await supabase.from("sherlock_saved_reports").delete().eq("id", savedReport.id)
  if (deleteSavedError) {
    return NextResponse.json({ ok: false, error: deleteSavedError.message }, { status: 500 })
  }

  await supabase.from("sherlock_reports").delete().eq("id", savedReport.report_id)

  return NextResponse.json({ ok: true, persisted: true, deletedId: savedReport.id })
}

function isUuid(value: string | undefined) {
  return Boolean(value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i.test(value))
}
