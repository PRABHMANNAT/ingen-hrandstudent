import type { SherlockClaim, SherlockEvidence } from "../types"
import { planSherlockSources, type SherlockSourcePlan, type SherlockSourcePlanItem } from "../source-planner"
import { collectCrate, collectNpmPackage, collectPyPiPackage } from "./packages"
import { collectPortfolio } from "./portfolio"
import { collectSearch, isSearchConfigured } from "./search"
import { collectWayback } from "./wayback"
import { createSourceCollectionJob, type SherlockBackgroundJob } from "../background-jobs"
import { logCollectorEvent } from "../collector-utils"

export type SherlockCollectionStatus = {
  planItemId: string
  collector: SherlockSourcePlanItem["collector"]
  status: "completed" | "skipped" | "failed"
  reason?: string
  evidenceIds: string[]
}

export type SherlockCollectionResult = {
  plan: SherlockSourcePlan
  evidence: SherlockEvidence[]
  statuses: SherlockCollectionStatus[]
  warnings: string[]
  backgroundJob?: Pick<SherlockBackgroundJob, "id" | "status" | "createdAt" | "type">
}

const MAX_PLANNED_COLLECTORS = 12
const DEFAULT_SYNC_COLLECTORS = 6

export async function collectSherlockSources(input: {
  sessionId?: string
  claims: SherlockClaim[]
  urls?: string[]
  enableSearch?: boolean
  async?: boolean
  maxSyncCollectors?: number
}): Promise<SherlockCollectionResult> {
  const plan = planSherlockSources({
    claims: input.claims,
    urls: input.urls,
    enableSearch: input.enableSearch ?? isSearchConfigured(),
  })
  const evidence: SherlockEvidence[] = []
  const statuses: SherlockCollectionStatus[] = []
  const warnings = [...plan.warnings]

  const plannedItems = plan.items.slice(0, MAX_PLANNED_COLLECTORS)
  const maxSyncCollectors = Math.max(0, Math.min(input.maxSyncCollectors ?? DEFAULT_SYNC_COLLECTORS, MAX_PLANNED_COLLECTORS))
  const syncItems = input.async ? [] : plannedItems.slice(0, maxSyncCollectors)
  const deferredItems = input.async ? plannedItems : plannedItems.slice(maxSyncCollectors)

  const syncResult = await collectPlanItems(syncItems)
  evidence.push(...syncResult.evidence)
  statuses.push(...syncResult.statuses)
  warnings.push(...syncResult.warnings)

  let backgroundJob: SherlockCollectionResult["backgroundJob"]
  if (deferredItems.some((item) => item.status === "planned")) {
    const job = createSourceCollectionJob({
      sessionId: input.sessionId,
      claims: input.claims,
      urls: input.urls,
      enableSearch: input.enableSearch,
      runner: () => collectPlanItems(deferredItems),
    })
    backgroundJob = {
      id: job.id,
      status: job.status,
      createdAt: job.createdAt,
      type: job.type,
    }
    warnings.push(`Slow source collection queued as background job ${job.id}.`)
    for (const item of deferredItems) {
      statuses.push({
        planItemId: item.id,
        collector: item.collector,
        status: item.status === "skipped" ? "skipped" : "skipped",
        reason: item.status === "skipped" ? item.reason : `Queued in background job ${job.id}`,
        evidenceIds: [],
      })
    }
  }

  if (plan.items.length > MAX_PLANNED_COLLECTORS) {
    warnings.push(`Collector plan capped at ${MAX_PLANNED_COLLECTORS} of ${plan.items.length} planned items.`)
  }

  logCollectorEvent("info", "source_collection_result", {
    planned: plan.items.length,
    synchronous: syncItems.length,
    deferred: deferredItems.length,
    evidenceCount: evidence.length,
    warningCount: warnings.length,
    backgroundJobId: backgroundJob?.id,
  })

  return { plan, evidence: dedupeEvidence(evidence), statuses, warnings, backgroundJob }
}

async function collectPlanItems(items: SherlockSourcePlanItem[]) {
  const evidence: SherlockEvidence[] = []
  const statuses: SherlockCollectionStatus[] = []
  const warnings: string[] = []

  for (const item of items) {
    if (item.status === "skipped") {
      statuses.push({
        planItemId: item.id,
        collector: item.collector,
        status: "skipped",
        reason: item.reason,
        evidenceIds: [],
      })
      continue
    }

    try {
      const collected = await runCollector(item)
      evidence.push(...collected)
      statuses.push({
        planItemId: item.id,
        collector: item.collector,
        status: "completed",
        reason: item.reason,
        evidenceIds: collected.map((entry) => entry.id),
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown collector error"
      warnings.push(`${item.collector} failed: ${message}`)
      statuses.push({
        planItemId: item.id,
        collector: item.collector,
        status: "failed",
        reason: message,
        evidenceIds: [],
      })
    }
  }

  return { evidence: dedupeEvidence(evidence), statuses, warnings }
}

async function runCollector(item: SherlockSourcePlanItem): Promise<SherlockEvidence[]> {
  if (item.collector === "npm" && item.packageName) return collectNpmPackage(item.packageName)
  if (item.collector === "pypi" && item.packageName) return collectPyPiPackage(item.packageName)
  if (item.collector === "crates" && item.packageName) return collectCrate(item.packageName)
  if (item.collector === "wayback" && item.url) return collectWayback(item.url)
  if (item.collector === "portfolio" && item.url) return collectPortfolio(item.url)
  if (item.collector === "search" && item.query) return collectSearch(item.query)
  return []
}

function dedupeEvidence(evidence: SherlockEvidence[]) {
  const seen = new Set<string>()
  return evidence.filter((entry) => {
    const key = `${entry.id}:${entry.sourceUrl ?? ""}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
