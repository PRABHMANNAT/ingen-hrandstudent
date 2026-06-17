"use client"

import { useEffect, useMemo, useState } from "react"
import type { ElementType, ReactNode } from "react"
import { motion } from "framer-motion"
import {
  AlertTriangle,
  Archive,
  BookOpenCheck,
  CheckCircle2,
  ClipboardList,
  Copy,
  Clock3,
  Database,
  Download,
  FileText,
  GitBranch,
  Layers3,
  MessageSquareText,
  Radar,
  Route,
  Save,
  Share2,
  ShieldCheck,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  buildCandidateDisclosure,
  buildSherlockAuditTrail,
  buildSherlockExportPackage,
  candidateDisclosureTemplate,
  SHERLOCK_RETENTION_DAYS,
  sourcePolicyCopy,
  type SherlockAuditEntry,
} from "@/lib/sherlock/compliance"
import type {
  SherlockArtifactEnvelope,
  SherlockClaim,
  SherlockEvidence,
  SherlockSavedReport,
  SherlockVerification,
  SherlockVerificationState,
} from "@/lib/sherlock/types"

type ArtifactTab = "overview" | "claims" | "github" | "timeline" | "contradictions" | "interview" | "dossier" | "report" | "trust"
export type SherlockSourceStatus = {
  collector: string
  status: "completed" | "skipped" | "failed"
  reason?: string
  evidenceIds: string[]
}

const tabs: Array<{ id: ArtifactTab; label: string; icon: ElementType }> = [
  { id: "overview", label: "Overview", icon: ShieldCheck },
  { id: "claims", label: "Claim Matrix", icon: Layers3 },
  { id: "github", label: "GitHub Depth", icon: GitBranch },
  { id: "timeline", label: "Timeline", icon: Clock3 },
  { id: "contradictions", label: "Contradictions", icon: AlertTriangle },
  { id: "interview", label: "Interview Pack", icon: MessageSquareText },
  { id: "dossier", label: "Evidence Dossier", icon: Archive },
  { id: "report", label: "Share Report", icon: Share2 },
  { id: "trust", label: "Trust Controls", icon: ClipboardList },
]

const stateLabels: Record<SherlockVerificationState, string> = {
  verified: "Verified",
  contradicted: "Contradicted",
  unverified: "Unverified",
  needs_alternative_proof: "Needs proof route",
}

const stateClasses: Record<SherlockVerificationState, string> = {
  verified: "border-[#A8E8C8] bg-[#E7F8EF] text-[#12633D] dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200",
  contradicted: "border-[#FFC7C3] bg-[#FFF0EF] text-[#A5342E] dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-200",
  unverified: "border-[#D9D1C7] bg-[#F3EEE6] text-[#61584E] dark:border-white/10 dark:bg-white/[0.06] dark:text-white/60",
  needs_alternative_proof:
    "border-[#FFD8A8] bg-[#FFF5E7] text-[#8A520C] dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200",
}

export function SherlockEvidenceCanvas({
  artifact,
  onRunSourceCollection,
  onRunVerification,
  onRunSynthesis,
  isCollectingSources = false,
  isVerifying = false,
  isSynthesizing = false,
  sourceStatuses = [],
}: {
  artifact: SherlockArtifactEnvelope
  onRunSourceCollection?: () => void
  onRunVerification?: () => void
  onRunSynthesis?: () => void
  isCollectingSources?: boolean
  isVerifying?: boolean
  isSynthesizing?: boolean
  sourceStatuses?: SherlockSourceStatus[]
}) {
  const [activeTab, setActiveTab] = useState<ArtifactTab>("overview")
  const [saved, setSaved] = useState(false)
  const [humanNotes, setHumanNotes] = useState<Record<string, string>>({})
  const [persistedAudit, setPersistedAudit] = useState<SherlockAuditEntry[]>([])
  const [copiedDisclosure, setCopiedDisclosure] = useState(false)

  const verificationByClaim = useMemo(() => {
    return new Map(artifact.verifications.map((verification) => [verification.claimId, verification]))
  }, [artifact.verifications])

  useEffect(() => {
    try {
      const stored = JSON.parse(window.localStorage.getItem("sherlock-audit-notes-v1") || "{}") as Record<string, Record<string, string>>
      setHumanNotes(stored[artifact.sessionId] ?? {})
    } catch {
      setHumanNotes({})
    }
  }, [artifact.sessionId])

  useEffect(() => {
    if (!isUuid(artifact.sessionId)) {
      setPersistedAudit([])
      return
    }

    let cancelled = false
    fetch(`/api/sherlock/audit?sessionId=${encodeURIComponent(artifact.sessionId)}`)
      .then((response) => response.json())
      .then((result: { ok?: boolean; auditLog?: SherlockAuditEntry[] }) => {
        if (!cancelled && result.ok && result.auditLog?.length) setPersistedAudit(result.auditLog)
      })
      .catch(() => {
        if (!cancelled) setPersistedAudit([])
      })

    return () => {
      cancelled = true
    }
  }, [artifact.sessionId, artifact.auditRefs.length])

  const auditTrail = useMemo(() => {
    return mergeAuditEntries(persistedAudit, buildSherlockAuditTrail(artifact, humanNotes))
  }, [artifact, humanNotes, persistedAudit])

  async function handleSave() {
    const fallbackItem = buildLocalStorageItem(artifact)

    try {
      const response = await fetch("/api/sherlock/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artifact }),
      })
      const result = (await response.json()) as {
        ok?: boolean
        localStorageItem?: SherlockSavedReport
      }

      if (response.ok && result.ok && result.localStorageItem) {
        writeSavedReport(result.localStorageItem)
      } else {
        writeSavedReport(fallbackItem)
      }
    } catch {
      writeSavedReport(fallbackItem)
    }

    setSaved(true)
    window.setTimeout(() => setSaved(false), 1800)
  }

  function buildLocalStorageItem(report: SherlockArtifactEnvelope): SherlockSavedReport {
    const savedAt = new Date().toISOString()
    return {
      id: `sherlock-${report.sessionId}-${Date.now()}`,
      kind: "sherlock_report",
      title: `${report.candidate.displayName ?? "Candidate"} Evidence Report`,
      savedAt,
      summary: `${report.summary.verified} verified, ${report.summary.contradicted} contradicted, ${report.summary.needsAlternativeProof} proof route.`,
      description: `Evidence-only report for ${report.targetRole ?? "role-scoped verification"}. Human decision required.`,
      tags: ["Evidence", "Human review", report.targetRole ?? "Sherlock"].slice(0, 3),
      href: `/analyse-profile?reportId=${encodeURIComponent(report.sessionId)}`,
      artifact: report,
    }
  }

  function writeSavedReport(item: SherlockSavedReport) {
    const key = "sherlock-saved-reports-v1"
    const previous = JSON.parse(window.localStorage.getItem(key) || "[]") as Array<{ id?: string }>
    const next = [item, ...previous.filter((entry) => entry.id !== item.id)].slice(0, 50)
    window.localStorage.setItem(key, JSON.stringify(next))
  }

  function handleExport() {
    downloadJson(buildSherlockExportPackage(artifact, humanNotes), `${artifact.sessionId}-sherlock-redacted-export.json`)
  }

  async function handleCopyDisclosure() {
    const disclosure = buildCandidateDisclosure(artifact)
    await navigator.clipboard.writeText(`${disclosure.title}\n\n${disclosure.text}`)
    setCopiedDisclosure(true)
    window.setTimeout(() => setCopiedDisclosure(false), 1600)
  }

  function handleNoteChange(entryId: string, note: string) {
    setHumanNotes((previous) => ({ ...previous, [entryId]: note }))
  }

  async function handleSaveHumanNote(entryId: string) {
    const note = humanNotes[entryId] ?? ""
    try {
      const stored = JSON.parse(window.localStorage.getItem("sherlock-audit-notes-v1") || "{}") as Record<string, Record<string, string>>
      window.localStorage.setItem(
        "sherlock-audit-notes-v1",
        JSON.stringify({
          ...stored,
          [artifact.sessionId]: {
            ...(stored[artifact.sessionId] ?? {}),
            [entryId]: note,
          },
        }),
      )
    } catch {
      // Local audit notes are a convenience control; ignore storage failures.
    }

    if (!isUuid(artifact.sessionId)) return
    await fetch("/api/sherlock/audit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: artifact.sessionId, auditEntryId: entryId, note }),
    }).catch(() => undefined)
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="relative h-screen overflow-hidden bg-[#F7F2EA] text-[#2A2520] dark:bg-[#0A0A0A] dark:text-white"
    >
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#DED4C733_1px,transparent_1px),linear-gradient(to_bottom,#DED4C733_1px,transparent_1px)] bg-[size:32px_32px] opacity-35 dark:opacity-10" />
      <div className="relative flex h-full flex-col">
        <header className="border-b border-[#DED4C7]/70 bg-[#F7F2EA]/90 px-8 py-5 backdrop-blur-xl dark:border-white/[0.07] dark:bg-[#0A0A0A]/90">
          <div className="flex items-start justify-between gap-6">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.32em] text-[#8A8177] dark:text-white/35">Sherlock evidence report</p>
              <h1 className="mt-2 truncate text-[36px] font-black leading-none tracking-[-0.07em] text-[#211D18] dark:text-white">
                {artifact.candidate.displayName ?? "Candidate"}
              </h1>
              <p className="mt-2 text-[13px] font-bold text-[#6F675F] dark:text-white/55">
                {artifact.targetRole ?? "Role-scoped verification"} - evidence-only output - human decision required
              </p>
            </div>

            <button
              type="button"
              onClick={handleSave}
              className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-[#2A2520] px-5 text-[11px] font-black uppercase tracking-[0.18em] text-[#FFFDF8] transition hover:bg-[#FF6A00] dark:bg-white dark:text-[#0A0A0A] dark:hover:bg-[#FF6A00] dark:hover:text-white"
            >
              <Save size={15} />
              {saved ? "Saved" : "Save"}
            </button>
            <button
              type="button"
              onClick={handleExport}
              className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full border border-[#DED4C7] bg-[#FFFDF8]/80 px-5 text-[11px] font-black uppercase tracking-[0.18em] text-[#4F4842] transition hover:border-[#FF6A00]/40 hover:text-[#FF6A00] dark:border-white/10 dark:bg-white/[0.04] dark:text-white/55"
            >
              <Download size={15} />
              Export
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            {onRunSourceCollection ? (
              <button
                type="button"
                onClick={onRunSourceCollection}
                disabled={isCollectingSources}
                className="inline-flex h-10 items-center gap-2 rounded-full border border-[#DED4C7] bg-[#FFFDF8]/80 px-4 text-[11px] font-black uppercase tracking-[0.14em] text-[#4F4842] transition hover:border-[#FF6A00]/40 hover:text-[#FF6A00] disabled:cursor-wait disabled:opacity-60 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/55"
              >
                <Radar size={14} />
                {isCollectingSources ? "Collecting" : "Run Sources"}
              </button>
            ) : null}
            {onRunVerification ? (
              <button
                type="button"
                onClick={onRunVerification}
                disabled={isVerifying}
                className="inline-flex h-10 items-center gap-2 rounded-full border border-[#DED4C7] bg-[#FFFDF8]/80 px-4 text-[11px] font-black uppercase tracking-[0.14em] text-[#4F4842] transition hover:border-[#18A86B]/40 hover:text-[#178A59] disabled:cursor-wait disabled:opacity-60 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/55"
              >
                <ShieldCheck size={14} />
                {isVerifying ? "Verifying" : "Run Verification"}
              </button>
            ) : null}
            {onRunSynthesis ? (
              <button
                type="button"
                onClick={onRunSynthesis}
                disabled={isSynthesizing}
                className="inline-flex h-10 items-center gap-2 rounded-full border border-[#DED4C7] bg-[#FFFDF8]/80 px-4 text-[11px] font-black uppercase tracking-[0.14em] text-[#4F4842] transition hover:border-[#5B6CFF]/40 hover:text-[#4F5DE8] disabled:cursor-wait disabled:opacity-60 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/55"
              >
                <FileText size={14} />
                {isSynthesizing ? "Synthesizing" : "Run Synthesis"}
              </button>
            ) : null}
            {sourceStatuses.slice(0, 5).map((status, index) => (
              <span
                key={`${status.collector}-${index}`}
                className={cn(
                  "inline-flex h-8 items-center rounded-full border px-3 text-[10px] font-black uppercase tracking-[0.12em]",
                  status.status === "completed"
                    ? "border-[#A8E8C8] bg-[#E7F8EF] text-[#12633D] dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200"
                    : status.status === "failed"
                      ? "border-[#FFC7C3] bg-[#FFF0EF] text-[#A5342E] dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-200"
                      : "border-[#D9D1C7] bg-[#F3EEE6] text-[#61584E] dark:border-white/10 dark:bg-white/[0.06] dark:text-white/60",
                )}
              >
                {status.collector}: {status.status}
              </span>
            ))}
          </div>

          <nav className="mt-5 flex gap-2 overflow-x-auto pb-1">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "inline-flex h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-[11px] font-black uppercase tracking-[0.12em] transition",
                    isActive
                      ? "border-[#FF6A00]/40 bg-[#FFE1C7] text-[#B44A00] dark:border-orange-400/30 dark:bg-orange-400/15 dark:text-orange-200"
                      : "border-[#DED4C7] bg-[#FFFDF8]/70 text-[#6F675F] hover:border-[#FF6A00]/40 hover:text-[#FF6A00] dark:border-white/10 dark:bg-white/[0.04] dark:text-white/45",
                  )}
                >
                  <Icon size={14} />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-8 py-7">
          {activeTab === "overview" && <Overview artifact={artifact} />}
          {activeTab === "claims" && <ClaimMatrix artifact={artifact} verificationByClaim={verificationByClaim} />}
          {activeTab === "github" && <GitHubDepth artifact={artifact} />}
          {activeTab === "timeline" && <Timeline artifact={artifact} />}
          {activeTab === "contradictions" && <Contradictions artifact={artifact} />}
          {activeTab === "interview" && <InterviewPack artifact={artifact} />}
          {activeTab === "dossier" && <EvidenceDossier artifact={artifact} />}
          {activeTab === "report" && <ShareableReport artifact={artifact} />}
          {activeTab === "trust" && (
            <TrustControls
              artifact={artifact}
              auditTrail={auditTrail}
              humanNotes={humanNotes}
              copiedDisclosure={copiedDisclosure}
              onCopyDisclosure={handleCopyDisclosure}
              onExport={handleExport}
              onNoteChange={handleNoteChange}
              onSaveHumanNote={handleSaveHumanNote}
            />
          )}
        </div>
      </div>
    </motion.section>
  )
}

function Overview({ artifact }: { artifact: SherlockArtifactEnvelope }) {
  const extractionOnly =
    artifact.summary.verified === 0 &&
    artifact.summary.contradicted === 0 &&
    artifact.claims.length > 0 &&
    artifact.verifications.every((verification) => verification.state === "unverified")
  const synthesisSections = artifact.synthesis?.ninetySecondReport

  return (
    <div className="mx-auto max-w-[1180px] space-y-7">
      <div className="grid grid-cols-4 gap-3">
        <SummaryMetric label="Verified" value={artifact.summary.verified} state="verified" />
        <SummaryMetric label="Contradicted" value={artifact.summary.contradicted} state="contradicted" />
        <SummaryMetric label="Unverified" value={artifact.summary.unverified} state="unverified" />
        <SummaryMetric label="Proof routes" value={artifact.summary.needsAlternativeProof} state="needs_alternative_proof" />
      </div>

      <section className="grid grid-cols-[1.1fr_0.9fr] gap-6">
        <Panel title="90-second report" icon={FileText}>
          <div className="space-y-4">
            {synthesisSections?.length ? (
              synthesisSections.map((section) => <ReportLine key={section.id} title={section.title} body={section.body} />)
            ) : extractionOnly ? (
              <>
                <ReportLine title="What is extracted" body={`${artifact.claims.length} self-reported claims were extracted from user-provided text.`} />
                <ReportLine title="What is verified" body="Nothing has been verified yet because evidence collection has not run." />
                <ReportLine title="What remains unverified" body="Every extracted claim is currently marked unverified and needs source collection or alternative proof." />
                <ReportLine title="Required handoff" body="Run GitHub, portfolio, package, or approved-source collection before drawing any verification conclusion." />
              </>
            ) : (
              <>
                <ReportLine title="What is verified" body="TypeScript API work and public backend activity are supported by owned GitHub repositories and portfolio cross-links." />
                <ReportLine title="What is contradicted" body="Senior Rust depth is not supported by the current public Rust artifact, which is narrow and lab-like." />
                <ReportLine title="What remains unverified" body="Payments architecture ownership and stronger identity continuity require a human proof path." />
                <ReportLine title="Required handoff" body="Use the interview pack and alternative proof routes. Human decision required." />
              </>
            )}
          </div>
        </Panel>

        <Panel title="Identity and source posture" icon={ShieldCheck}>
          <div className="space-y-3">
            {artifact.candidate.handles.map((handle) => (
              <div key={`${handle.source}-${handle.value}`} className="flex items-center justify-between gap-4 border-b border-[#E6DED4] py-3 last:border-0 dark:border-white/10">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#8A8177] dark:text-white/35">{handle.source}</p>
                  <p className="mt-1 break-all text-[14px] font-black text-[#2A2520] dark:text-white">{handle.value}</p>
                </div>
                <span className="rounded-full border border-[#DED4C7] px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#6F675F] dark:border-white/10 dark:text-white/55">
                  {handle.confidence}
                </span>
              </div>
            ))}
          </div>
        </Panel>
      </section>

      <Panel title="Proof routes" icon={Route}>
        <div className="grid grid-cols-2 gap-4">
          {artifact.proofRoutes.map((route) => (
            <div key={route.id} className="rounded-[18px] border border-[#DED4C7] bg-[#FFFDF8]/70 p-4 dark:border-white/10 dark:bg-white/[0.04]">
              <p className="text-[15px] font-black tracking-[-0.04em] text-[#2A2520] dark:text-white">{route.label}</p>
              <p className="mt-2 text-[12px] font-bold leading-5 text-[#6F675F] dark:text-white/55">{route.reason}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {route.requestedArtifacts.map((artifactName) => (
                  <span key={artifactName} className="rounded-full bg-[#EEE8DF] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.1em] text-[#6F675F] dark:bg-white/10 dark:text-white/55">
                    {artifactName}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  )
}

function ShareableReport({ artifact }: { artifact: SherlockArtifactEnvelope }) {
  const synthesis = artifact.synthesis

  function downloadJson() {
    if (!synthesis) return
    const blob = new Blob([JSON.stringify(synthesis.shareableReport, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = `${artifact.sessionId}-sherlock-evidence-report.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  if (!synthesis) {
    return (
      <div className="mx-auto max-w-[980px]">
        <Panel title="Shareable evidence report" icon={Share2}>
          <div className="rounded-[22px] border border-[#DED4C7] bg-[#FFFDF8]/75 p-6 dark:border-white/10 dark:bg-white/[0.04]">
            <p className="text-[18px] font-black tracking-[-0.04em] text-[#2A2520] dark:text-white">No synthesis generated yet.</p>
            <p className="mt-3 text-[13px] font-bold leading-6 text-[#6F675F] dark:text-white/55">
              Run verification first, then run synthesis to create the validated evidence report.
            </p>
          </div>
        </Panel>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[1180px] space-y-6">
      <Panel title="Shareable evidence report" icon={Share2}>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[22px] font-black tracking-[-0.05em] text-[#2A2520] dark:text-white">{synthesis.shareableReport.title}</p>
            <p className="mt-1 text-[11px] font-black uppercase tracking-[0.16em] text-[#8A8177] dark:text-white/35">
              {new Date(synthesis.generatedAt).toLocaleString()} - {synthesis.method.replaceAll("_", " ")}
            </p>
          </div>
          <button
            type="button"
            onClick={downloadJson}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-[#DED4C7] bg-[#FFFDF8]/80 px-4 text-[11px] font-black uppercase tracking-[0.14em] text-[#4F4842] transition hover:border-[#FF6A00]/40 hover:text-[#FF6A00] dark:border-white/10 dark:bg-white/[0.04] dark:text-white/55"
          >
            <Download size={14} />
            Download JSON
          </button>
        </div>

        <div className="grid grid-cols-[1fr_0.85fr] gap-5">
          <div className="space-y-4">
            {synthesis.ninetySecondReport.map((section) => (
              <ReportSection key={section.id} section={section} />
            ))}
          </div>

          <div className="space-y-4">
            <div className="rounded-[22px] border border-[#DED4C7] bg-[#FFFDF8]/70 p-5 dark:border-white/10 dark:bg-white/[0.04]">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8A8177] dark:text-white/35">Handoff state</p>
              <p className="mt-2 text-[18px] font-black tracking-[-0.04em] text-[#2A2520] dark:text-white">Human review required</p>
              <p className="mt-2 text-[12px] font-bold leading-5 text-[#6F675F] dark:text-white/55">
                The report contains verification states and cited artifacts only.
              </p>
            </div>

            <div className="rounded-[22px] border border-[#DED4C7] bg-[#FFFDF8]/70 p-5 dark:border-white/10 dark:bg-white/[0.04]">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8A8177] dark:text-white/35">Cited evidence</p>
              <EvidenceLinks ids={synthesis.shareableReport.evidenceIds} emptyLabel="No evidence IDs cited in the synthesized sections." />
            </div>
          </div>
        </div>
      </Panel>

      <Panel title="Contradiction-driven interview pack" icon={MessageSquareText}>
        <div className="grid grid-cols-2 gap-4">
          {synthesis.interviewPack.map((item) => (
            <div key={item.id} className="rounded-[22px] border border-[#DED4C7] bg-[#FFFDF8]/75 p-5 dark:border-white/10 dark:bg-white/[0.04]">
              <p className="text-[16px] font-black leading-6 tracking-[-0.04em] text-[#2A2520] dark:text-white">{item.question}</p>
              <p className="mt-3 text-[12px] font-bold leading-5 text-[#6F675F] dark:text-white/55">{item.reason}</p>
              <EvidenceLinks ids={item.linkedEvidenceIds} emptyLabel="No direct artifact yet; proof route required." />
            </div>
          ))}
        </div>
      </Panel>
    </div>
  )
}

function TrustControls({
  artifact,
  auditTrail,
  humanNotes,
  copiedDisclosure,
  onCopyDisclosure,
  onExport,
  onNoteChange,
  onSaveHumanNote,
}: {
  artifact: SherlockArtifactEnvelope
  auditTrail: SherlockAuditEntry[]
  humanNotes: Record<string, string>
  copiedDisclosure: boolean
  onCopyDisclosure: () => void
  onExport: () => void
  onNoteChange: (entryId: string, note: string) => void
  onSaveHumanNote: (entryId: string) => void
}) {
  const disclosure = buildCandidateDisclosure(artifact)
  const retentionDays = Number.isFinite(SHERLOCK_RETENTION_DAYS) ? SHERLOCK_RETENTION_DAYS : 30

  return (
    <div className="mx-auto max-w-[1180px] space-y-6">
      <section className="grid grid-cols-[0.95fr_1.05fr] gap-6">
        <Panel title="Trust posture" icon={ShieldCheck}>
          <div className="grid grid-cols-2 gap-3">
            <TrustFlag label="Output mode" value="Evidence only" />
            <TrustFlag label="Human step" value="Decision required" />
            <TrustFlag label="Retention" value={`${retentionDays} days`} />
            <TrustFlag label="Redaction" value="Export enabled" />
          </div>
          <div className="mt-5 rounded-[20px] border border-[#DED4C7] bg-[#FFFDF8]/70 p-4 dark:border-white/10 dark:bg-white/[0.04]">
            <p className="text-[13px] font-bold leading-6 text-[#5F564D] dark:text-white/60">
              Reports contain claim states, cited artifacts, source policy, audit references, and human notes. They do not contain a score, ranking, or automated decision.
            </p>
          </div>
          <button
            type="button"
            onClick={onExport}
            className="mt-5 inline-flex h-10 items-center gap-2 rounded-full border border-[#DED4C7] bg-[#FFFDF8]/80 px-4 text-[11px] font-black uppercase tracking-[0.14em] text-[#4F4842] transition hover:border-[#FF6A00]/40 hover:text-[#FF6A00] dark:border-white/10 dark:bg-white/[0.04] dark:text-white/55"
          >
            <Download size={14} />
            Export redacted report
          </button>
        </Panel>

        <Panel title="Candidate disclosure" icon={FileText}>
          <div className="rounded-[20px] border border-[#DED4C7] bg-[#FFFDF8]/75 p-5 dark:border-white/10 dark:bg-white/[0.04]">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-[18px] font-black tracking-[-0.04em] text-[#2A2520] dark:text-white">{disclosure.title}</p>
                <p className="mt-1 text-[11px] font-black uppercase tracking-[0.16em] text-[#8A8177] dark:text-white/35">
                  Generated {new Date(disclosure.generatedAt).toLocaleString()}
                </p>
              </div>
              <button
                type="button"
                onClick={onCopyDisclosure}
                className="inline-flex h-9 shrink-0 items-center gap-2 rounded-full border border-[#DED4C7] px-3 text-[10px] font-black uppercase tracking-[0.12em] text-[#4F4842] transition hover:border-[#FF6A00]/40 hover:text-[#FF6A00] dark:border-white/10 dark:text-white/55"
              >
                <Copy size={13} />
                {copiedDisclosure ? "Copied" : "Copy"}
              </button>
            </div>
            <pre className="whitespace-pre-wrap font-mono text-[12px] font-bold leading-6 text-[#5F564D] dark:text-white/60">
              {candidateDisclosureTemplate}
            </pre>
          </div>
        </Panel>
      </section>

      <Panel title="Source policy" icon={Database}>
        <div className="grid grid-cols-2 gap-4">
          {sourcePolicyCopy.map((item) => (
            <div key={item.source} className="rounded-[20px] border border-[#DED4C7] bg-[#FFFDF8]/75 p-4 dark:border-white/10 dark:bg-white/[0.04]">
              <div className="flex items-start justify-between gap-3">
                <p className="text-[15px] font-black leading-5 tracking-[-0.03em] text-[#2A2520] dark:text-white">{item.source}</p>
                <span
                  className={cn(
                    "shrink-0 rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.1em]",
                    item.status === "allowed"
                      ? "border-[#A8E8C8] bg-[#E7F8EF] text-[#12633D] dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200"
                      : item.status === "restricted"
                        ? "border-[#FFD8A8] bg-[#FFF5E7] text-[#8A520C] dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200"
                        : "border-[#FFC7C3] bg-[#FFF0EF] text-[#A5342E] dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-200",
                  )}
                >
                  {item.status.replaceAll("_", " ")}
                </span>
              </div>
              <p className="mt-3 text-[12px] font-bold leading-5 text-[#6F675F] dark:text-white/55">{item.copy}</p>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Audit log" icon={ClipboardList}>
        <div className="space-y-4">
          {auditTrail.map((entry) => (
            <div key={entry.id} className="rounded-[20px] border border-[#DED4C7] bg-[#FFFDF8]/75 p-5 dark:border-white/10 dark:bg-white/[0.04]">
              <div className="grid grid-cols-[160px_1fr_150px] gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8A8177] dark:text-white/35">Time</p>
                  <p className="mt-2 text-[12px] font-black text-[#2A2520] dark:text-white">{formatAuditTime(entry.time)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8A8177] dark:text-white/35">
                    {entry.actor} - {entry.event.replaceAll("_", " ")}
                  </p>
                  <p className="mt-2 text-[14px] font-black leading-5 tracking-[-0.03em] text-[#2A2520] dark:text-white">{entry.source}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {entry.collector ? <AuditPill label={entry.collector} /> : null}
                    {entry.modelPromptVersion ? <AuditPill label={entry.modelPromptVersion} /> : null}
                    {entry.evidenceIds.map((id) => (
                      <AuditPill key={id} label={id} />
                    ))}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8A8177] dark:text-white/35">Human notes</p>
                  <button
                    type="button"
                    onClick={() => onSaveHumanNote(entry.id)}
                    className="mt-2 inline-flex h-8 items-center rounded-full border border-[#DED4C7] px-3 text-[10px] font-black uppercase tracking-[0.12em] text-[#4F4842] transition hover:border-[#FF6A00]/40 hover:text-[#FF6A00] dark:border-white/10 dark:text-white/55"
                  >
                    Save note
                  </button>
                </div>
              </div>
              <textarea
                value={humanNotes[entry.id] ?? ""}
                onChange={(event) => onNoteChange(entry.id, event.target.value)}
                placeholder="Add human review note for this audit event."
                className="mt-4 min-h-[74px] w-full resize-y rounded-[16px] border border-[#DED4C7] bg-[#FBF7EF] px-4 py-3 text-[12px] font-bold leading-5 text-[#4F4842] outline-none transition placeholder:text-[#9C9288] focus:border-[#FF6A00]/50 dark:border-white/10 dark:bg-black/20 dark:text-white/70 dark:placeholder:text-white/25"
              />
            </div>
          ))}
        </div>
      </Panel>
    </div>
  )
}

function TrustFlag({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-[#DED4C7] bg-[#FFFDF8]/70 p-4 dark:border-white/10 dark:bg-white/[0.04]">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8A8177] dark:text-white/35">{label}</p>
      <p className="mt-2 text-[15px] font-black tracking-[-0.04em] text-[#2A2520] dark:text-white">{value}</p>
    </div>
  )
}

function AuditPill({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-[#EEE8DF] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.1em] text-[#6F675F] dark:bg-white/10 dark:text-white/50">
      {label}
    </span>
  )
}

function ClaimMatrix({
  artifact,
  verificationByClaim,
}: {
  artifact: SherlockArtifactEnvelope
  verificationByClaim: Map<string, SherlockVerification>
}) {
  return (
    <div className="mx-auto max-w-[1180px]">
      <Panel title="Claim matrix" icon={Layers3}>
        <div className="space-y-3">
          {artifact.claims.map((claim) => (
            <ClaimRow key={claim.id} claim={claim} verification={verificationByClaim.get(claim.id)} />
          ))}
        </div>
      </Panel>
    </div>
  )
}

function GitHubDepth({ artifact }: { artifact: SherlockArtifactEnvelope }) {
  const github = artifact.githubDepth
  return (
    <div className="mx-auto max-w-[1180px] space-y-6">
      <Panel title={`GitHub depth: ${github.username}`} icon={GitBranch}>
        <div className="grid grid-cols-3 gap-3">
          <CompactMetric label="Owned repos" value={github.ownedRepos} />
          <CompactMetric label="Forks separated" value={github.forkedRepos} />
          <CompactMetric label="Authored commits" value={github.authoredCommits} />
        </div>
        <p className="mt-5 text-[14px] font-bold leading-6 text-[#6F675F] dark:text-white/60">{github.cadenceSummary}</p>
      </Panel>

      <div className="grid grid-cols-[1fr_0.85fr] gap-6">
        <Panel title="Language evidence" icon={BookOpenCheck}>
          <div className="space-y-3">
            {github.languageSignals.map((signal) => (
              <div key={signal.language} className="rounded-[18px] border border-[#DED4C7] bg-[#FFFDF8]/70 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[18px] font-black tracking-[-0.05em] text-[#2A2520] dark:text-white">{signal.language}</p>
                  <span className="rounded-full bg-[#EEE8DF] px-3 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-[#6F675F] dark:bg-white/10 dark:text-white/50">
                    {signal.basis.replaceAll("_", " ")}
                  </span>
                </div>
                <p className="mt-2 text-[12px] font-bold leading-5 text-[#6F675F] dark:text-white/55">{signal.summary}</p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Noise handling" icon={Database}>
          <div className="space-y-3">
            {github.noiseSignals.map((signal) => (
              <div key={signal} className="flex gap-3 rounded-[16px] bg-[#EEE8DF]/70 p-3 text-[12px] font-bold leading-5 text-[#6F675F] dark:bg-white/[0.05] dark:text-white/55">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#18A86B]" />
                <p>{signal}</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  )
}

function Timeline({ artifact }: { artifact: SherlockArtifactEnvelope }) {
  return (
    <div className="mx-auto max-w-[980px]">
      <Panel title="Evidence timeline" icon={Clock3}>
        <div className="space-y-0">
          {artifact.timeline.map((event, index) => (
            <div key={event.id} className="grid grid-cols-[96px_28px_1fr] gap-4">
              <p className="pt-1 text-right text-[13px] font-black text-[#8A8177] dark:text-white/40">{event.date}</p>
              <div className="flex flex-col items-center">
                <span className={cn("h-4 w-4 rounded-full border", stateClasses[event.state])} />
                {index < artifact.timeline.length - 1 ? <span className="h-16 w-px bg-[#DED4C7] dark:bg-white/10" /> : null}
              </div>
              <div className="pb-7">
                <StateBadge state={event.state} />
                <p className="mt-2 text-[17px] font-black tracking-[-0.04em] text-[#2A2520] dark:text-white">{event.label}</p>
                <p className="mt-1 text-[12px] font-bold uppercase tracking-[0.14em] text-[#8A8177] dark:text-white/35">{event.source}</p>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  )
}

function Contradictions({ artifact }: { artifact: SherlockArtifactEnvelope }) {
  return (
    <div className="mx-auto max-w-[1040px]">
      <Panel title="Contradiction board" icon={AlertTriangle}>
        <div className="space-y-4">
          {artifact.contradictionCards.map((card) => (
            <div key={card.id} className="rounded-[22px] border border-[#FFC7C3] bg-[#FFF7F6] p-5 dark:border-red-400/20 dark:bg-red-400/10">
              <p className="text-[20px] font-black tracking-[-0.05em] text-[#6A211D] dark:text-red-100">{card.title}</p>
              <p className="mt-2 text-[13px] font-bold leading-6 text-[#7A3D39] dark:text-red-100/70">{card.summary}</p>
              <div className="mt-4 rounded-[18px] bg-white/60 p-4 dark:bg-black/20">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#A5342E] dark:text-red-200">Interview probe</p>
                <p className="mt-2 text-[14px] font-black leading-6 tracking-[-0.03em] text-[#2A2520] dark:text-white">{card.interviewPrompt}</p>
              </div>
              <EvidenceLinks ids={card.evidenceIds} />
            </div>
          ))}
        </div>
      </Panel>
    </div>
  )
}

function InterviewPack({ artifact }: { artifact: SherlockArtifactEnvelope }) {
  return (
    <div className="mx-auto max-w-[1040px]">
      <Panel title="Contradiction-driven interview pack" icon={MessageSquareText}>
        <div className="space-y-4">
          {artifact.interviewPack.map((item) => (
            <div key={item.id} className="rounded-[22px] border border-[#DED4C7] bg-[#FFFDF8]/75 p-5 dark:border-white/10 dark:bg-white/[0.04]">
              <p className="text-[17px] font-black leading-6 tracking-[-0.04em] text-[#2A2520] dark:text-white">{item.question}</p>
              <p className="mt-3 text-[12px] font-bold leading-5 text-[#6F675F] dark:text-white/55">{item.reason}</p>
              <EvidenceLinks ids={item.linkedEvidenceIds} emptyLabel="No direct artifact yet; proof route required." />
            </div>
          ))}
        </div>
      </Panel>
    </div>
  )
}

function EvidenceDossier({ artifact }: { artifact: SherlockArtifactEnvelope }) {
  return (
    <div className="mx-auto max-w-[1180px] space-y-6">
      <Panel title="Evidence dossier" icon={Archive}>
        <div className="grid grid-cols-2 gap-4">
          {artifact.evidence.map((evidence) => (
            <EvidenceCard key={evidence.id} evidence={evidence} />
          ))}
        </div>
      </Panel>

      <Panel title="Audit references" icon={Database}>
        <div className="flex flex-wrap gap-2">
          {artifact.auditRefs.map((ref) => (
            <span key={ref} className="rounded-full border border-[#DED4C7] bg-[#FFFDF8]/70 px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-[#6F675F] dark:border-white/10 dark:bg-white/[0.04] dark:text-white/50">
              {ref}
            </span>
          ))}
        </div>
      </Panel>
    </div>
  )
}

function ReportSection({
  section,
}: {
  section: {
    id: string
    title: string
    body: string
    evidenceIds: string[]
  }
}) {
  return (
    <div className="rounded-[22px] border border-[#DED4C7] bg-[#FFFDF8]/70 p-5 dark:border-white/10 dark:bg-white/[0.04]">
      <p className="text-[16px] font-black tracking-[-0.04em] text-[#2A2520] dark:text-white">{section.title}</p>
      <p className="mt-2 text-[13px] font-bold leading-6 text-[#6F675F] dark:text-white/55">{section.body}</p>
      <EvidenceLinks ids={section.evidenceIds} emptyLabel="No direct evidence cited for this section." />
    </div>
  )
}

function Panel({ title, icon: Icon, children }: { title: string; icon: ElementType; children: ReactNode }) {
  return (
    <section className="rounded-[26px] border border-[#DED4C7] bg-[#FBF7EF]/92 p-6 shadow-[0_18px_50px_rgba(42,37,32,0.06)] dark:border-white/10 dark:bg-[#101010]/92 dark:shadow-none">
      <div className="mb-5 flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#FFE1C7] text-[#FF6A00] dark:bg-orange-400/15 dark:text-orange-200">
          <Icon size={18} />
        </span>
        <h2 className="text-[19px] font-black uppercase tracking-[-0.03em] text-[#2A2520] dark:text-white">{title}</h2>
      </div>
      {children}
    </section>
  )
}

function SummaryMetric({ label, value, state }: { label: string; value: number; state: SherlockVerificationState }) {
  return (
    <div className={cn("rounded-[22px] border p-5", stateClasses[state])}>
      <p className="text-[42px] font-black leading-none tracking-[-0.08em]">{value}</p>
      <p className="mt-3 text-[11px] font-black uppercase tracking-[0.16em]">{label}</p>
    </div>
  )
}

function CompactMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[18px] border border-[#DED4C7] bg-[#FFFDF8]/70 p-4 dark:border-white/10 dark:bg-white/[0.04]">
      <p className="text-[32px] font-black leading-none tracking-[-0.08em] text-[#2A2520] dark:text-white">{value}</p>
      <p className="mt-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#8A8177] dark:text-white/35">{label}</p>
    </div>
  )
}

function ReportLine({ title, body }: { title: string; body: string }) {
  return (
    <div className="border-b border-[#E6DED4] pb-4 last:border-0 last:pb-0 dark:border-white/10">
      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#8A8177] dark:text-white/35">{title}</p>
      <p className="mt-2 text-[14px] font-bold leading-6 text-[#5F564D] dark:text-white/60">{body}</p>
    </div>
  )
}

function ClaimRow({ claim, verification }: { claim: SherlockClaim; verification?: SherlockVerification }) {
  const state = verification?.state ?? "unverified"
  return (
    <div className="grid grid-cols-[150px_1fr_190px] items-start gap-4 rounded-[20px] border border-[#DED4C7] bg-[#FFFDF8]/70 p-4 dark:border-white/10 dark:bg-white/[0.04]">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8A8177] dark:text-white/35">{claim.type.replaceAll("_", " ")}</p>
        <p className="mt-2 text-[12px] font-black text-[#2A2520] dark:text-white">{claim.source}</p>
      </div>
      <div>
        <p className="text-[15px] font-black leading-6 tracking-[-0.03em] text-[#2A2520] dark:text-white">{claim.text}</p>
        <p className="mt-2 text-[12px] font-bold leading-5 text-[#6F675F] dark:text-white/50">"{claim.sourceSnippet}"</p>
        {verification?.summary ? <p className="mt-3 text-[12px] font-bold leading-5 text-[#4F4842] dark:text-white/60">{verification.summary}</p> : null}
      </div>
      <div className="flex justify-end">
        <StateBadge state={state} />
      </div>
    </div>
  )
}

function StateBadge({ state }: { state: SherlockVerificationState }) {
  return (
    <span className={cn("inline-flex rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em]", stateClasses[state])}>
      {stateLabels[state]}
    </span>
  )
}

function EvidenceCard({ evidence }: { evidence: SherlockEvidence }) {
  return (
    <div className="rounded-[22px] border border-[#DED4C7] bg-[#FFFDF8]/70 p-5 dark:border-white/10 dark:bg-white/[0.04]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8A8177] dark:text-white/35">{evidence.sourceType.replaceAll("_", " ")}</p>
          <p className="mt-2 text-[18px] font-black tracking-[-0.05em] text-[#2A2520] dark:text-white">{evidence.sourceName}</p>
        </div>
        <span className="rounded-full bg-[#EEE8DF] px-3 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-[#6F675F] dark:bg-white/10 dark:text-white/50">
          {evidence.id}
        </span>
      </div>
      <p className="mt-4 text-[13px] font-bold leading-6 text-[#6F675F] dark:text-white/55">{evidence.summary}</p>
      <ul className="mt-4 space-y-2">
        {evidence.details.map((detail) => (
          <li key={detail} className="flex gap-2 text-[12px] font-bold leading-5 text-[#6F675F] dark:text-white/50">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#FF6A00]" />
            {detail}
          </li>
        ))}
      </ul>
    </div>
  )
}

function EvidenceLinks({ ids, emptyLabel = "No evidence linked." }: { ids: string[]; emptyLabel?: string }) {
  if (!ids.length) {
    return <p className="mt-4 text-[11px] font-black uppercase tracking-[0.14em] text-[#8A8177] dark:text-white/35">{emptyLabel}</p>
  }

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {ids.map((id) => (
        <span key={id} className="rounded-full bg-[#EEE8DF] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-[#6F675F] dark:bg-white/10 dark:text-white/50">
          {id}
        </span>
      ))}
    </div>
  )
}

function downloadJson(value: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

function mergeAuditEntries(primary: SherlockAuditEntry[], fallback: SherlockAuditEntry[]) {
  const byId = new Map<string, SherlockAuditEntry>()
  ;[...fallback, ...primary].forEach((entry) => byId.set(entry.id, entry))
  return Array.from(byId.values()).sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
}

function formatAuditTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
}

function isUuid(value: string | undefined) {
  return Boolean(value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i.test(value))
}
