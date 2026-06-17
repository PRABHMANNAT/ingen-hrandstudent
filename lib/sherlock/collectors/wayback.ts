import type { SherlockEvidence } from "../types"
import { fetchJsonWithTimeout, validateSourceUrl } from "../collector-utils"

type CdxRow = [string, string, string, string, string]

export async function collectWayback(url: string): Promise<SherlockEvidence[]> {
  const targetValidation = await validateSourceUrl(url)
  if (!targetValidation.ok) {
    const retrievedAt = new Date().toISOString()
    return [
      {
        id: `ev-wayback-blocked-${hashUrl(url)}`,
        sourceType: "third_party_context",
        sourceName: "Wayback Machine",
        sourceUrl: url,
        retrievedAt,
        summary: "Wayback lookup was blocked by source safety policy.",
        details: [targetValidation.error],
        reliability: "third_party_context",
        normalizedJson: { url, blocked: true, error: targetValidation.error },
      },
    ]
  }

  const sourceUrl = `https://web.archive.org/cdx?url=${encodeURIComponent(url)}&output=json&limit=3&fl=timestamp,original,statuscode,mimetype,digest&filter=statuscode:200&collapse=digest`
  const result = await fetchJsonWithTimeout<Array<string[]>>(sourceUrl, {
    rateLimitKey: "wayback",
    rateLimit: 12,
    allowedHostnames: ["web.archive.org"],
  })
  if (!result.ok) {
    return [
      {
        id: `ev-wayback-unavailable-${hashUrl(url)}`,
        sourceType: "third_party_context",
        sourceName: "Wayback Machine",
        sourceUrl,
        retrievedAt: result.retrievedAt,
        summary: "Wayback lookup failed.",
        details: [result.error],
        reliability: "third_party_context",
        normalizedJson: { url, error: result.error },
      },
    ]
  }

  const rows = result.data.slice(1) as CdxRow[]
  const first = rows[0]
  return [
    {
      id: `ev-wayback-${hashUrl(url)}`,
      sourceType: "third_party_context",
      sourceName: "Wayback Machine",
      sourceUrl,
      retrievedAt: result.retrievedAt,
      artifactDate: first?.[0] ? waybackTimestampToIso(first[0]) : undefined,
      rawSnapshotRef: result.rawSnapshotRef,
      summary: rows.length ? `Wayback has ${rows.length} snapshot reference${rows.length === 1 ? "" : "s"} for this URL.` : "No Wayback snapshot found for this URL.",
      details: rows.length
        ? rows.map((row) => `${waybackTimestampToIso(row[0])}: ${row[2]} ${row[3]}`)
        : ["No historical 200-status snapshot returned."],
      reliability: "third_party_context",
      normalizedJson: {
        url,
        snapshotCount: rows.length,
        snapshots: rows.map((row) => ({
          timestamp: row[0],
          isoDate: waybackTimestampToIso(row[0]),
          original: row[1],
          statusCode: row[2],
          mimeType: row[3],
          digest: row[4],
        })),
      },
    },
  ]
}

function waybackTimestampToIso(value: string) {
  if (!/^\d{14}$/.test(value)) return value
  return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}T${value.slice(8, 10)}:${value.slice(10, 12)}:${value.slice(12, 14)}.000Z`
}

function hashUrl(value: string) {
  return Buffer.from(value).toString("base64url").slice(0, 16).toLowerCase()
}
