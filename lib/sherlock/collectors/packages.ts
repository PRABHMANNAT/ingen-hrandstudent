import type { SherlockEvidence } from "../types"
import { fetchJsonWithTimeout } from "../collector-utils"

type NpmPackage = {
  name?: string
  description?: string
  homepage?: string
  repository?: { url?: string } | string
  time?: Record<string, string>
  versions?: Record<string, unknown>
  maintainers?: Array<{ name?: string; email?: string }>
  "dist-tags"?: Record<string, string>
}

type PyPiPackage = {
  info?: {
    name?: string
    summary?: string
    home_page?: string
    project_urls?: Record<string, string>
    author?: string
    version?: string
  }
  releases?: Record<string, Array<{ upload_time_iso_8601?: string }>>
}

type CratesPackage = {
  crate?: {
    id?: string
    name?: string
    description?: string
    homepage?: string
    repository?: string
    downloads?: number
    recent_downloads?: number
    updated_at?: string
    created_at?: string
    max_version?: string
  }
}

export async function collectNpmPackage(packageName: string): Promise<SherlockEvidence[]> {
  const url = `https://registry.npmjs.org/${encodeURIComponent(packageName)}`
  const result = await fetchJsonWithTimeout<NpmPackage>(url, {
    rateLimitKey: "npm",
    rateLimit: 20,
    allowedHostnames: ["registry.npmjs.org"],
  })
  if (!result.ok) return [packageErrorEvidence("npm", packageName, url, result.error, result.retrievedAt)]

  const versions = Object.keys(result.data.versions ?? {})
  const createdAt = result.data.time?.created
  const modifiedAt = result.data.time?.modified
  return [
    {
      id: `ev-npm-${slug(packageName)}`,
      sourceType: "primary_artifact",
      sourceName: "npm registry",
      sourceUrl: result.sourceUrl,
      retrievedAt: result.retrievedAt,
      artifactDate: modifiedAt ?? createdAt,
      rawSnapshotRef: result.rawSnapshotRef,
      summary: `npm package metadata found for ${result.data.name ?? packageName}.`,
      details: [
        result.data.description || "No package description provided",
        `${versions.length} published version${versions.length === 1 ? "" : "s"}`,
        `Latest tag: ${result.data["dist-tags"]?.latest ?? "unknown"}`,
      ],
      reliability: "primary_artifact",
      normalizedJson: {
        packageName: result.data.name ?? packageName,
        registry: "npm",
        versionCount: versions.length,
        latest: result.data["dist-tags"]?.latest,
        maintainers: result.data.maintainers?.map((entry) => entry.name).filter(Boolean).slice(0, 8),
        createdAt,
        modifiedAt,
        repository: typeof result.data.repository === "string" ? result.data.repository : result.data.repository?.url,
        homepage: result.data.homepage,
      },
    },
  ]
}

export async function collectPyPiPackage(packageName: string): Promise<SherlockEvidence[]> {
  const url = `https://pypi.org/pypi/${encodeURIComponent(packageName)}/json`
  const result = await fetchJsonWithTimeout<PyPiPackage>(url, {
    rateLimitKey: "pypi",
    rateLimit: 20,
    allowedHostnames: ["pypi.org"],
  })
  if (!result.ok) return [packageErrorEvidence("PyPI", packageName, url, result.error, result.retrievedAt)]

  const releases = Object.entries(result.data.releases ?? {})
  const latestUploads = releases.flatMap(([, files]) => files.map((file) => file.upload_time_iso_8601).filter(Boolean))
  return [
    {
      id: `ev-pypi-${slug(packageName)}`,
      sourceType: "primary_artifact",
      sourceName: "PyPI",
      sourceUrl: result.sourceUrl,
      retrievedAt: result.retrievedAt,
      artifactDate: latestUploads.sort().at(-1),
      rawSnapshotRef: result.rawSnapshotRef,
      summary: `PyPI package metadata found for ${result.data.info?.name ?? packageName}.`,
      details: [
        result.data.info?.summary || "No package summary provided",
        `${releases.length} release version${releases.length === 1 ? "" : "s"}`,
        `Latest version: ${result.data.info?.version ?? "unknown"}`,
      ],
      reliability: "primary_artifact",
      normalizedJson: {
        packageName: result.data.info?.name ?? packageName,
        registry: "pypi",
        versionCount: releases.length,
        latest: result.data.info?.version,
        author: result.data.info?.author,
        projectUrls: result.data.info?.project_urls,
        homePage: result.data.info?.home_page,
      },
    },
  ]
}

export async function collectCrate(packageName: string): Promise<SherlockEvidence[]> {
  const url = `https://crates.io/api/v1/crates/${encodeURIComponent(packageName)}`
  const result = await fetchJsonWithTimeout<CratesPackage>(url, {
    rateLimitKey: "crates",
    rateLimit: 20,
    allowedHostnames: ["crates.io"],
  })
  if (!result.ok) return [packageErrorEvidence("crates.io", packageName, url, result.error, result.retrievedAt)]

  const crate = result.data.crate
  return [
    {
      id: `ev-crates-${slug(packageName)}`,
      sourceType: "primary_artifact",
      sourceName: "crates.io",
      sourceUrl: result.sourceUrl,
      retrievedAt: result.retrievedAt,
      artifactDate: crate?.updated_at ?? crate?.created_at,
      rawSnapshotRef: result.rawSnapshotRef,
      summary: `crates.io metadata found for ${crate?.name ?? packageName}.`,
      details: [
        crate?.description || "No crate description provided",
        `Latest version: ${crate?.max_version ?? "unknown"}`,
        `Downloads: ${crate?.downloads ?? 0}`,
      ],
      reliability: "primary_artifact",
      normalizedJson: {
        packageName: crate?.name ?? packageName,
        registry: "crates",
        latest: crate?.max_version,
        downloads: crate?.downloads,
        recentDownloads: crate?.recent_downloads,
        repository: crate?.repository,
        homepage: crate?.homepage,
        createdAt: crate?.created_at,
        updatedAt: crate?.updated_at,
      },
    },
  ]
}

function packageErrorEvidence(registry: string, packageName: string, sourceUrl: string, error: string, retrievedAt: string): SherlockEvidence {
  return {
    id: `ev-${slug(registry)}-${slug(packageName)}-unavailable`,
    sourceType: "third_party_context",
    sourceName: registry,
    sourceUrl,
    retrievedAt,
    summary: `${registry} metadata could not be collected for ${packageName}.`,
    details: [error],
    reliability: "third_party_context",
    normalizedJson: { packageName, registry, error },
  }
}

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "package"
}
