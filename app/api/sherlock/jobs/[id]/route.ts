import { NextResponse } from "next/server"
import { getBackgroundJob } from "@/lib/sherlock/background-jobs"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params
  const job = getBackgroundJob(id)

  if (!job) {
    return NextResponse.json({ ok: false, error: "Background job not found" }, { status: 404 })
  }

  return NextResponse.json({ ok: true, job })
}
