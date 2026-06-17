import { randomUUID } from "node:crypto"
import type { SherlockClaim, SherlockEvidence } from "@/lib/sherlock/types"
import type { SherlockCollectionStatus } from "@/lib/sherlock/collectors"
import { logCollectorEvent } from "@/lib/sherlock/collector-utils"

export type SherlockBackgroundJobStatus = "queued" | "running" | "completed" | "failed"

export type SherlockBackgroundJob = {
  id: string
  type: "source_collection"
  status: SherlockBackgroundJobStatus
  createdAt: string
  updatedAt: string
  sessionId?: string
  result?: {
    evidence: SherlockEvidence[]
    statuses: SherlockCollectionStatus[]
    warnings: string[]
  }
  error?: string
}

const jobs = new Map<string, SherlockBackgroundJob>()

export function createSourceCollectionJob(input: {
  sessionId?: string
  claims: SherlockClaim[]
  urls?: string[]
  enableSearch?: boolean
  runner: () => Promise<{
    evidence: SherlockEvidence[]
    statuses: SherlockCollectionStatus[]
    warnings: string[]
  }>
}) {
  const now = new Date().toISOString()
  const job: SherlockBackgroundJob = {
    id: randomUUID(),
    type: "source_collection",
    status: "queued",
    createdAt: now,
    updatedAt: now,
    sessionId: input.sessionId,
  }
  jobs.set(job.id, job)
  logCollectorEvent("info", "background_job_queued", {
    jobId: job.id,
    type: job.type,
    sessionId: input.sessionId,
    claimCount: input.claims.length,
    urlCount: input.urls?.length ?? 0,
  })

  setTimeout(() => {
    void runSourceCollectionJob(job.id, input.runner)
  }, 0)

  return job
}

export function getBackgroundJob(id: string) {
  return jobs.get(id) ?? null
}

async function runSourceCollectionJob(
  jobId: string,
  runner: () => Promise<{
    evidence: SherlockEvidence[]
    statuses: SherlockCollectionStatus[]
    warnings: string[]
  }>,
) {
  const job = jobs.get(jobId)
  if (!job) return

  updateJob(jobId, { status: "running" })
  logCollectorEvent("info", "background_job_started", { jobId, type: job.type })

  try {
    const result = await runner()
    updateJob(jobId, { status: "completed", result })
    logCollectorEvent("info", "background_job_completed", {
      jobId,
      type: job.type,
      evidenceCount: result.evidence.length,
      warningCount: result.warnings.length,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown background job error"
    updateJob(jobId, { status: "failed", error: message })
    logCollectorEvent("error", "background_job_failed", { jobId, type: job.type, error: message })
  }
}

function updateJob(id: string, patch: Partial<SherlockBackgroundJob>) {
  const existing = jobs.get(id)
  if (!existing) return
  jobs.set(id, { ...existing, ...patch, updatedAt: new Date().toISOString() })
}
