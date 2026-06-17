import type { SherlockArtifactEnvelope, SherlockEvidenceReliability } from "@/lib/sherlock/types"

export type SherlockAuditEntry = {
  id: string
  time: string
  actor: "system" | "user" | "model" | "collector"
  event: string
  source: string
  collector?: string
  modelPromptVersion?: string
  evidenceIds: string[]
  humanNotes?: string
  details: Record<string, unknown>
}

export type SherlockSourcePolicyItem = {
  source: string
  status: "allowed" | "restricted" | "not_allowed"
  copy: string
}

export const SHERLOCK_RETENTION_DAYS = Number.parseInt(process.env.SHERLOCK_RETENTION_DAYS || "30", 10)

export const candidateDisclosureTemplate = `Sherlock evidence review notice

We use Sherlock to organize candidate-provided materials and permitted public artifacts into claim-level evidence states. The system can mark individual claims as verified, contradicted, unverified, or needing an alternative proof route.

Sherlock does not make an employment decision, does not create a candidate score, and does not rank candidates. A person must review the evidence, context, and any candidate-provided clarification before any decision is made.

Sources used may include uploaded documents, pasted profile exports, public GitHub and portfolio pages, package registry records, search API results, and other approved public or user-provided artifacts. LinkedIn or similar platforms are used only through user-provided exports, pasted text, or approved APIs.

You may request a copy of the report, ask for correction of inaccurate source material, or ask for deletion under the retention policy.`

export const sourcePolicyCopy: SherlockSourcePolicyItem[] = [
  {
    source: "User-provided documents and pasted exports",
    status: "allowed",
    copy: "Allowed as self-reported claim sources. They do not verify themselves without separate artifacts.",
  },
  {
    source: "GitHub public API and public repositories",
    status: "allowed",
    copy: "Allowed for public profile, repository, commit, release, and language-context artifacts. Forks and repo-level language data are labeled separately.",
  },
  {
    source: "Portfolio pages and package registries",
    status: "allowed",
    copy: "Allowed when publicly reachable and normalized with source URL, retrieval time, and reliability label.",
  },
  {
    source: "Search and enrichment APIs",
    status: "restricted",
    copy: "Allowed only through configured APIs with clear terms. Snippets are untrusted until fetched and normalized.",
  },
  {
    source: "LinkedIn, Glassdoor, Crunchbase, and login-gated services",
    status: "not_allowed",
    copy: "No unauthorized scraping, login-wall bypass, rate-limit circumvention, or use outside approved API, export, or pasted-content paths.",
  },
  {
    source: "Protected attributes and sensitive traits",
    status: "not_allowed",
    copy: "Do not infer protected attributes, private traits, health, family status, religion, political views, or similar sensitive categories.",
  },
]

const SENSITIVE_KEY_PATTERN =
  /(email|e-mail|phone|mobile|address|street|zip|postal|ssn|socialSecurity|dob|birth|token|secret|password|apiKey|api_key|authorization|cookie)/i
const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi
const PHONE_PATTERN = /(?:\+?\d[\d\s().-]{7,}\d)/g
const SSN_PATTERN = /\b\d{3}-\d{2}-\d{4}\b/g
const SECRET_PATTERN = /\b(?:bearer|token|key|secret)\s+[A-Za-z0-9._~+/=-]{8,}\b/gi

export function redactSensitiveFields<T>(value: T): T {
  return redactValue(value, []) as T
}

export function buildSherlockAuditTrail(
  artifact: SherlockArtifactEnvelope,
  humanNotesById: Record<string, string> = {},
): SherlockAuditEntry[] {
  const entries: SherlockAuditEntry[] = []

  entries.push({
    id: `${artifact.sessionId}-report-generated`,
    time: artifact.generatedAt,
    actor: "system",
    event: "report_generated",
    source: "Sherlock artifact envelope",
    modelPromptVersion: artifact.synthesis ? "sherlock-report-writer-v1" : undefined,
    evidenceIds: artifact.evidence.map((evidence) => evidence.id),
    humanNotes: humanNotesById[`${artifact.sessionId}-report-generated`],
    details: {
      candidate: artifact.candidate.displayName ?? "Candidate",
      targetRole: artifact.targetRole ?? "Role-scoped verification",
      evidenceOnly: true,
      humanDecisionRequired: artifact.summary.humanReviewRequired,
    },
  })

  artifact.evidence.forEach((evidence) => {
    entries.push({
      id: `${artifact.sessionId}-${evidence.id}`,
      time: evidence.retrievedAt,
      actor: evidence.sourceType === "model_inferred" ? "model" : collectorActorFor(evidence.sourceType),
      event: "source_normalized",
      source: evidence.sourceName,
      collector: collectorNameFor(evidence.sourceType),
      modelPromptVersion: evidence.sourceType === "model_inferred" ? "sherlock-extractor-v1" : undefined,
      evidenceIds: [evidence.id],
      humanNotes: humanNotesById[`${artifact.sessionId}-${evidence.id}`],
      details: {
        sourceUrl: evidence.sourceUrl,
        reliability: evidence.reliability,
        rawSnapshotRef: evidence.rawSnapshotRef,
        artifactDate: evidence.artifactDate,
      },
    })
  })

  artifact.auditRefs.forEach((ref, index) => {
    entries.push({
      id: `${artifact.sessionId}-audit-ref-${index}`,
      time: timestampFromAuditRef(ref) ?? artifact.generatedAt,
      actor: actorFromAuditRef(ref),
      event: eventFromAuditRef(ref),
      source: ref,
      collector: ref.includes("source-collection") ? "source planner" : undefined,
      modelPromptVersion: ref.includes("synthesis") ? "sherlock-report-writer-v1" : undefined,
      evidenceIds: [],
      humanNotes: humanNotesById[`${artifact.sessionId}-audit-ref-${index}`],
      details: { auditRef: ref },
    })
  })

  return entries.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
}

export function buildCandidateDisclosure(artifact: SherlockArtifactEnvelope) {
  return {
    title: `${artifact.candidate.displayName ?? "Candidate"} disclosure notice`,
    generatedAt: new Date().toISOString(),
    candidateName: artifact.candidate.displayName,
    targetRole: artifact.targetRole,
    text: candidateDisclosureTemplate,
  }
}

export function buildSherlockExportPackage(
  artifact: SherlockArtifactEnvelope,
  humanNotesById: Record<string, string> = {},
) {
  const auditTrail = buildSherlockAuditTrail(artifact, humanNotesById)

  return redactSensitiveFields({
    artifactType: "sherlock_report_export",
    version: "1.0",
    exportedAt: new Date().toISOString(),
    retentionDays: Number.isFinite(SHERLOCK_RETENTION_DAYS) ? SHERLOCK_RETENTION_DAYS : 30,
    report: artifact,
    candidateDisclosure: buildCandidateDisclosure(artifact),
    sourcePolicy: sourcePolicyCopy,
    auditTrail,
    controls: {
      evidenceOnlyOutput: true,
      humanDecisionRequired: true,
      noScore: artifact.prohibitedOutputsAbsent.noScore,
      noRanking: artifact.prohibitedOutputsAbsent.noRanking,
      noAutomatedDecision: artifact.prohibitedOutputsAbsent.noAutoReject,
    },
  })
}

function redactValue(value: unknown, path: string[]): unknown {
  const key = path[path.length - 1] ?? ""

  if (SENSITIVE_KEY_PATTERN.test(key)) {
    return "[REDACTED]"
  }

  if (typeof value === "string") {
    return value
      .replace(EMAIL_PATTERN, "[REDACTED_EMAIL]")
      .replace(SSN_PATTERN, "[REDACTED_ID]")
      .replace(SECRET_PATTERN, "[REDACTED_SECRET]")
      .replace(PHONE_PATTERN, (match) => (digitCount(match) >= 9 ? "[REDACTED_PHONE]" : match))
  }

  if (!value || typeof value !== "object") return value

  if (Array.isArray(value)) {
    return value.map((entry, index) => redactValue(entry, [...path, String(index)]))
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([entryKey, entryValue]) => [
      entryKey,
      redactValue(entryValue, [...path, entryKey]),
    ]),
  )
}

function digitCount(value: string) {
  return (value.match(/\d/g) ?? []).length
}

function collectorActorFor(sourceType: SherlockEvidenceReliability): SherlockAuditEntry["actor"] {
  return sourceType === "self_reported" ? "user" : "collector"
}

function collectorNameFor(sourceType: SherlockEvidenceReliability) {
  if (sourceType === "self_reported") return "user-provided evidence"
  if (sourceType === "primary_artifact") return "primary artifact collector"
  if (sourceType === "third_party_context") return "context collector"
  if (sourceType === "untrusted_search_hit") return "search API collector"
  return "model extraction"
}

function timestampFromAuditRef(ref: string) {
  const match = ref.match(/\d{4}-\d{2}-\d{2}T[0-9:.]+Z/)
  return match?.[0]
}

function actorFromAuditRef(ref: string): SherlockAuditEntry["actor"] {
  if (ref.includes("synthesis")) return "model"
  if (ref.includes("source-collection")) return "collector"
  if (ref.includes("verification")) return "system"
  return "system"
}

function eventFromAuditRef(ref: string) {
  if (ref.includes("synthesis")) return "synthesis_completed"
  if (ref.includes("source-collection")) return "source_collection_completed"
  if (ref.includes("verification")) return "verification_completed"
  return "audit_reference"
}
