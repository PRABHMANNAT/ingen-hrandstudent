import { extractPortfolio } from "@/lib/portfolio-extract"
import type { SherlockEvidence } from "../types"
import { snapshotRef, validateSourceUrl } from "../collector-utils"

export async function collectPortfolio(url: string): Promise<SherlockEvidence[]> {
  const validation = await validateSourceUrl(url)
  if (!validation.ok) {
    const retrievedAt = new Date().toISOString()
    return [
      {
        id: `ev-portfolio-blocked-${Buffer.from(url).toString("base64url").slice(0, 16).toLowerCase()}`,
        sourceType: "third_party_context",
        sourceName: "Portfolio URL",
        sourceUrl: url,
        retrievedAt,
        summary: "Portfolio collection was blocked by source safety policy.",
        details: [validation.error],
        reliability: "third_party_context",
        normalizedJson: { url, blocked: true, error: validation.error },
      },
    ]
  }

  const extraction = await extractPortfolio(validation.normalizedUrl)
  return [
    {
      id: `ev-portfolio-${Buffer.from(validation.normalizedUrl).toString("base64url").slice(0, 16).toLowerCase()}`,
      sourceType: "primary_artifact",
      sourceName: "Portfolio URL",
      sourceUrl: validation.normalizedUrl,
      retrievedAt: extraction.fetchedAt,
      rawSnapshotRef: snapshotRef(extraction),
      summary: extraction.title ? `Portfolio fetched: ${extraction.title}.` : "Portfolio URL fetched and normalized.",
      details: [
        `${extraction.projectCount} project${extraction.projectCount === 1 ? "" : "s"} detected`,
        `${extraction.skills.length} skill mention${extraction.skills.length === 1 ? "" : "s"} detected`,
        `Quality: ${extraction.overallQuality}`,
        ...extraction.warnings.slice(0, 3),
      ],
      reliability: "primary_artifact",
      normalizedJson: {
        url: validation.normalizedUrl,
        title: extraction.title,
        projects: extraction.projects.slice(0, 8),
        skills: extraction.skills.slice(0, 12),
        socialLinks: extraction.socialLinks,
        projectCount: extraction.projectCount,
        testimonialCount: extraction.testimonialCount,
        quality: extraction.overallQuality,
        warnings: extraction.warnings,
      },
    },
  ]
}
