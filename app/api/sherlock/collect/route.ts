import { NextResponse } from "next/server"
import { z } from "zod"
import { collectSherlockSources } from "@/lib/sherlock/collectors"
import { sherlockClaimSchema } from "@/lib/sherlock/schemas"
import { getSherlockPersistenceContext, writeSherlockAudit } from "@/lib/sherlock/server-store"
import { checkCollectorRateLimit, logCollectorEvent } from "@/lib/sherlock/collector-utils"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const collectRequestSchema = z.object({
  sessionId: z.string().uuid().optional(),
  claims: z.array(sherlockClaimSchema).default([]),
  urls: z.array(z.string()).default([]),
  enableSearch: z.boolean().optional(),
  async: z.boolean().optional(),
  maxSyncCollectors: z.number().int().min(0).max(12).optional(),
})

export async function POST(request: Request) {
  const parsed = collectRequestSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid Sherlock collection payload" }, { status: 400 })
  }

  const persistence = await getSherlockPersistenceContext()
  const rateLimitKey = buildRateLimitKey(request, parsed.data.sessionId, persistence.available ? persistence.userId : undefined)
  const rateLimit = checkCollectorRateLimit(rateLimitKey, 8)
  if (!rateLimit.ok) {
    logCollectorEvent("warn", "api_collect_rate_limited", {
      rateLimitKey,
      retryAfterMs: rateLimit.retryAfterMs,
      sessionId: parsed.data.sessionId,
    })
    return NextResponse.json(
      {
        ok: false,
        error: `Collection rate limit reached. Retry after ${Math.ceil(rateLimit.retryAfterMs / 1000)}s.`,
        retryAfterMs: rateLimit.retryAfterMs,
      },
      { status: 429 },
    )
  }

  const result = await collectSherlockSources({
    ...parsed.data,
    sessionId: parsed.data.sessionId,
  })

  if (persistence.available && parsed.data.sessionId) {
    await writeSherlockAudit(persistence.supabase, {
      sessionId: parsed.data.sessionId,
      actorType: "collector",
      eventType: "source_collection_completed",
      eventJson: {
        planned: result.plan.items.length,
        evidenceCount: result.evidence.length,
        statuses: result.statuses,
        warnings: result.warnings,
        backgroundJob: result.backgroundJob,
      },
    })
  }

  return NextResponse.json({
    ok: true,
    ...result,
    persistedAudit: persistence.available && Boolean(parsed.data.sessionId),
    fallback: persistence.available ? null : "localOnly",
  })
}

function buildRateLimitKey(request: Request, sessionId?: string, userId?: string) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
  const ip = forwarded || request.headers.get("x-real-ip") || "unknown"
  return `sherlock-collect:${userId ?? sessionId ?? ip}`
}
