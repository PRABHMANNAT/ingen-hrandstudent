"use client"

import React, { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  ArrowRight,
  BadgeCheck,
  BookmarkCheck,
  BriefcaseBusiness,
  Download,
  Layers3,
  Map as MapIcon,
  SearchCheck,
  Sparkles,
  Star,
  Trash2,
  UserRound,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { buildSherlockExportPackage } from "@/lib/sherlock/compliance"
import type { SherlockArtifactEnvelope } from "@/lib/sherlock/types"

type CollectionKind = "profile" | "job" | "roadmap" | "sherlock_report"
type FilterId = "all" | "profile" | "job" | "roadmap" | "sherlock_report"

type CollectionItem = {
  id: string
  kind: CollectionKind
  title: string
  eyebrow: string
  savedAt: string
  summary: string
  description: string
  tags: string[]
  meta: string
  href: string
  actionLabel: string
  company?: string
  salary?: string
  phases?: number
  nodes?: number
  avatar?: string
  initials?: string
  progress?: number
  status?: string
  lastOpened?: string
  highlight?: string
  sourceReportId?: string
  artifact?: SherlockArtifactEnvelope
}

const mediaUrl = (name: string) => `/api/student-media?name=${encodeURIComponent(name)}`

const FILTERS: { id: FilterId; label: string }[] = [
  { id: "all", label: "All" },
  { id: "profile", label: "Saved Profiles" },
  { id: "job", label: "Jobs" },
  { id: "roadmap", label: "Roadmaps" },
  { id: "sherlock_report", label: "Sherlock Reports" },
]

const MOCK_ITEMS: CollectionItem[] = [
  {
    id: "profile-ibm-sde",
    kind: "profile",
    title: "IBM SDE 1 Profile",
    eyebrow: "Profile",
    savedAt: "Apr 24, 2026",
    summary: "Tailored for Northstar Labs / IBM-style SDE screening",
    description: "Backend-leaning profile version with Python, SQL, REST APIs, and recruiter-focused proof.",
    tags: ["Python", "SQL", "APIs"],
    meta: "Recruiter-ready profile",
    href: "/student/notes",
    actionLabel: "Open Profile",
    avatar: mediaUrl("PROFILE-PHOTO.png"),
    initials: "VV",
    progress: 96,
    status: "Backend ready",
    lastOpened: "2 days ago",
    highlight: "IBM SDE version",
  },
  {
    id: "profile-frontend",
    kind: "profile",
    title: "Frontend Engineer Profile",
    eyebrow: "Profile",
    savedAt: "Apr 18, 2026",
    summary: "Tailored for UI/UX focused roles",
    description: "Frontend role with strong React, UI systems, and product execution focus. Emphasizes visual polish.",
    tags: ["React", "Framer Motion", "Tailwind"],
    meta: "Candidate profile",
    href: "/student/notes",
    actionLabel: "Open Profile",
    avatar: mediaUrl("PROFILE-PHOTO.png"),
    initials: "VV",
    progress: 92,
    status: "UI focused",
    lastOpened: "Apr 20",
    highlight: "React proof stack",
  },
  {
    id: "profile-backend",
    kind: "profile",
    title: "Backend Engineer Profile",
    eyebrow: "Profile",
    savedAt: "Apr 15, 2026",
    summary: "High-performance systems engineering",
    description: "AI-tailored profile version for backend-focused graduate roles. Focuses on architecture and distributed systems.",
    tags: ["Go", "PostgreSQL", "Docker"],
    meta: "Candidate profile",
    href: "/student/notes",
    actionLabel: "Open Profile",
    avatar: mediaUrl("PROFILE-PHOTO.png"),
    initials: "VV",
    progress: 88,
    status: "Systems angle",
    lastOpened: "Apr 16",
    highlight: "Go + SQL signals",
  },
  {
    id: "job-northstar",
    kind: "job",
    title: "Frontend Engineer",
    eyebrow: "Northstar Labs",
    savedAt: "Apr 26, 2026",
    summary: "Joining the core platform team to build scalable UI systems and interactive dashboards.",
    description: "$110k - $130k",
    tags: ["Remote", "Full-time", "React"],
    meta: "Job opportunity",
    href: "/student/jobs",
    actionLabel: "Open Job",
    salary: "$110k - $130k",
    initials: "NL",
    progress: 96,
    status: "Saved for apply",
    lastOpened: "Yesterday",
    highlight: "96% Match",
  },
  {
    id: "job-lumio",
    kind: "job",
    title: "Full Stack Engineer",
    eyebrow: "Lumio AI",
    savedAt: "Apr 22, 2026",
    summary: "Building AI-driven recruiter workflows and maintaining the Node/React monolithic architecture.",
    description: "$120k - $145k",
    tags: ["Hybrid", "TypeScript", "Node.js"],
    meta: "Job opportunity",
    href: "/student/jobs",
    actionLabel: "Open Job",
    salary: "$120k - $145k",
    initials: "LA",
    progress: 91,
    status: "Shortlisted",
    lastOpened: "Apr 23",
    highlight: "AI recruiter workflow",
  },
  {
    id: "job-vertex",
    kind: "job",
    title: "Product Engineer",
    eyebrow: "Vertex Systems",
    savedAt: "Apr 10, 2026",
    summary: "Fast-paced product engineering role focusing on shipping user-facing features quickly.",
    description: "$105k - $125k",
    tags: ["Remote", "React", "Go"],
    meta: "Job opportunity",
    href: "/student/jobs",
    actionLabel: "Open Job",
    salary: "$105k - $125k",
    initials: "VS",
    progress: 87,
    status: "Review later",
    lastOpened: "Apr 11",
    highlight: "Product speed",
  },
  {
    id: "roadmap-full-stack",
    kind: "roadmap",
    title: "Full Stack Developer",
    eyebrow: "Roadmap",
    savedAt: "Apr 28, 2026",
    summary: "Structured path with phases, milestones, and skill nodes covering frontend and backend fundamentals.",
    description: "4 Phases - 32 Nodes",
    tags: ["Frontend", "Backend", "APIs"],
    meta: "4 Phases - 32 Nodes",
    href: "/student",
        actionLabel: "Open in 3D",
        phases: 4,
        nodes: 32,
    progress: 28,
    status: "4 phases",
    lastOpened: "Today",
    highlight: "Frontend + backend",
  },
  {
    id: "roadmap-backend",
    kind: "roadmap",
    title: "Backend Foundations",
    eyebrow: "Roadmap",
    savedAt: "Apr 12, 2026",
    summary: "Deep dive into databases, caching, message queues, and API design principles.",
    description: "3 Phases - 24 Nodes",
    tags: ["Databases", "Queues", "API Design"],
    meta: "3 Phases - 24 Nodes",
    href: "/student",
        actionLabel: "Open in 3D",
        phases: 3,
        nodes: 24,
    progress: 18,
    status: "3 phases",
    lastOpened: "Apr 18",
    highlight: "Databases + queues",
  },
  {
    id: "roadmap-ai-product",
    kind: "roadmap",
    title: "AI Product Builder",
    eyebrow: "Roadmap",
    savedAt: "Apr 29, 2026",
    summary: "Integrating LLMs, prompt engineering, and building AI-first application architectures.",
    description: "5 Phases - 40 Nodes",
    tags: ["LLMs", "Prompting", "AI Architecture"],
    meta: "5 Phases - 40 Nodes",
    href: "/student",
        actionLabel: "Open in 3D",
        phases: 5,
        nodes: 40,
    progress: 34,
    status: "5 phases",
    lastOpened: "Apr 30",
    highlight: "LLM architecture",
  },
]

export default function StudentCollectionsPage() {
  const [activeFilter, setActiveFilter] = useState<FilterId>("all")
  const [storedItems, setStoredItems] = useState<CollectionItem[]>([])

  useEffect(() => {
    setStoredItems(loadStoredItems())
  }, [])

  const allItems = useMemo(() => mergeItems(storedItems, MOCK_ITEMS), [storedItems])
  const visibleItems = activeFilter === "all" ? allItems : allItems.filter((item) => item.kind === activeFilter)
  const counts = useMemo(
    () => ({
      profile: allItems.filter((item) => item.kind === "profile").length,
      job: allItems.filter((item) => item.kind === "job").length,
      roadmap: allItems.filter((item) => item.kind === "roadmap").length,
      sherlock: allItems.filter((item) => item.kind === "sherlock_report").length,
      ready: allItems.filter((item) => (item.progress ?? 0) >= 90).length,
    }),
    [allItems]
  )

  async function handleDeleteSherlockReport(item: CollectionItem) {
    if (item.kind !== "sherlock_report" || !item.sourceReportId) return
    const confirmed = window.confirm(`Delete "${item.title}" from saved Sherlock reports?`)
    if (!confirmed) return

    removeStoredSherlockReport(item.sourceReportId)
    setStoredItems(loadStoredItems())

    if (isUuid(item.sourceReportId)) {
      await fetch(`/api/sherlock/reports/${encodeURIComponent(item.sourceReportId)}`, { method: "DELETE" }).catch(() => undefined)
    }
  }

  async function handleExportSherlockReport(item: CollectionItem) {
    if (item.kind !== "sherlock_report") return
    let artifact = item.artifact

    if (!artifact && item.sourceReportId && isUuid(item.sourceReportId)) {
      const response = await fetch(`/api/sherlock/reports/${encodeURIComponent(item.sourceReportId)}`).catch(() => null)
      const result = response ? ((await response.json().catch(() => null)) as { localStorageItem?: { artifact?: SherlockArtifactEnvelope } } | null) : null
      artifact = result?.localStorageItem?.artifact
    }

    if (!artifact) return
    downloadJson(buildSherlockExportPackage(artifact), `${item.sourceReportId ?? item.id}-sherlock-redacted-export.json`)
  }

  return (
    <main className="h-full min-w-0 flex-1 overflow-y-auto bg-[#F5F1EA] text-[#111827] dark:bg-[#050505] dark:text-white">
      <section className="mx-auto max-w-[1220px] px-8 py-10">
        <header className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-4xl font-black uppercase tracking-[-0.07em] text-[#0B1220] dark:text-white md:text-5xl">
              Saved Collection
            </h1>
            <p className="mt-2 text-sm font-medium text-[#5F5A54] dark:text-white/50">
              Saved profiles, job opportunities, and learning paths in one place.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {FILTERS.map((filter) => {
              const isActive = activeFilter === filter.id
              return (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setActiveFilter(filter.id)}
                  className={cn(
                    "h-10 rounded-full border px-5 text-[12px] font-black uppercase tracking-[0.08em] transition",
                    isActive
                      ? "border-[#A7EFE6] bg-[#B7F4EA] text-[#052E2A] shadow-[0_10px_26px_rgba(22,190,174,0.16)]"
                      : "border-[#E2D9CF] bg-[#FFFDF8] text-[#4F4842] hover:border-[#A7EFE6] hover:text-[#00AFA0] dark:border-white/10 dark:bg-white/[0.04] dark:text-white/55"
                  )}
                >
                  {filter.label}
                </button>
              )
            })}
            <span className="ml-2 text-[12px] font-black text-[#5F5A54] dark:text-white/40">
              {visibleItems.length} saved items
            </span>
          </div>
        </header>

        <section className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <CollectionSummaryStat icon={UserRound} label="Saved profiles" value={counts.profile} tone="purple" />
          <CollectionSummaryStat icon={BriefcaseBusiness} label="Job shortlist" value={counts.job} tone="orange" />
          <CollectionSummaryStat icon={MapIcon} label="Roadmaps" value={counts.roadmap} tone="teal" />
          <CollectionSummaryStat icon={SearchCheck} label="Sherlock reports" value={counts.sherlock} tone="dark" />
        </section>

        <motion.div layout className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {visibleItems.map((item) => (
            <CollectionCard
              key={item.id}
              item={item}
              onDeleteSherlockReport={handleDeleteSherlockReport}
              onExportSherlockReport={handleExportSherlockReport}
            />
          ))}
        </motion.div>
      </section>
    </main>
  )
}

function CollectionCard({
  item,
  onDeleteSherlockReport,
  onExportSherlockReport,
}: {
  item: CollectionItem
  onDeleteSherlockReport: (item: CollectionItem) => void
  onExportSherlockReport: (item: CollectionItem) => void
}) {
  const Icon = item.kind === "profile" ? UserRound : item.kind === "job" ? BriefcaseBusiness : item.kind === "roadmap" ? MapIcon : SearchCheck
  const tone =
    item.kind === "profile"
      ? {
          text: "text-[#7C5CFF]",
          soft: "bg-[#E9DDFF] text-[#7C5CFF]",
          ring: "ring-[#7C5CFF]/18",
          progress: "bg-[#7C5CFF]",
        }
      : item.kind === "job"
        ? {
            text: "text-[#FF8A1D]",
            soft: "bg-[#FFF0C8] text-[#FF8A1D]",
            ring: "ring-[#FF8A1D]/18",
            progress: "bg-[#FF8A1D]",
          }
        : item.kind === "roadmap"
          ? {
            text: "text-[#00BFB0]",
            soft: "bg-[#B7F4EA] text-[#008E84]",
            ring: "ring-[#00BFB0]/18",
            progress: "bg-[#00BFB0]",
          }
          : {
              text: "text-[#1F2A38]",
              soft: "bg-[#E8ECF4] text-[#1F2A38]",
              ring: "ring-[#1F2A38]/12",
              progress: "bg-[#1F2A38]",
            }

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="group flex min-h-[410px] flex-col rounded-[26px] border border-[#E2D9CF] bg-[#FFFDF8] p-7 shadow-[0_16px_42px_rgba(42,37,32,0.07)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_58px_rgba(42,37,32,0.11)] dark:border-white/10 dark:bg-[#101010]"
    >
      <div className="flex items-start justify-between gap-5">
        <div className="flex items-center gap-3">
          <CollectionAvatar item={item} icon={Icon} tone={tone} />
          <div className="min-w-0">
            <p className={cn("text-[11px] font-black uppercase tracking-[0.14em]", tone.text)}>{item.eyebrow}</p>
            <p className="mt-1 truncate text-[12px] font-black text-[#7B7168] dark:text-white/40">{item.status ?? item.meta}</p>
          </div>
        </div>
        <span className="shrink-0 rounded-full bg-[#F4F0EA] px-3 py-1.5 text-[12px] font-bold text-[#5F5A54] dark:bg-white/[0.06] dark:text-white/45">
          {item.savedAt}
        </span>
      </div>

      <div className="mt-6">
        <h2 className="text-[22px] font-black leading-7 tracking-[-0.05em] text-[#050A14] dark:text-white">{item.title}</h2>
        {item.kind === "profile" ? (
          <p className="mt-2 text-sm font-black leading-5 text-[#121212] dark:text-white/85">{item.summary}</p>
        ) : null}
        <p className="mt-3 text-sm font-medium leading-6 text-[#625A52] dark:text-white/50">
          {item.kind === "profile" ? item.description : item.summary}
        </p>
      </div>

      {item.kind === "roadmap" ? <RoadmapPreview phases={item.phases ?? 3} progress={item.progress ?? 0} /> : null}

      <div className="mt-5 grid grid-cols-2 gap-2">
        <MiniStat icon={BookmarkCheck} label="Saved" value={item.lastOpened ?? "Recently"} />
        <MiniStat
          icon={item.kind === "roadmap" ? Layers3 : item.kind === "job" ? Star : BadgeCheck}
          label={item.kind === "roadmap" ? "Progress" : item.kind === "job" ? "Match" : "Ready"}
          value={`${item.progress ?? 0}%`}
        />
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2.5">
        {item.kind === "job" && item.salary ? (
          <span className="mr-1 inline-flex items-center gap-1.5 rounded-full bg-[#FFF0C8] px-3 py-1.5 text-[12px] font-black text-[#9A5700] dark:bg-orange-500/10 dark:text-orange-300">
            <BriefcaseBusiness size={13} />
            {item.salary}
          </span>
        ) : null}
        {item.kind === "roadmap" ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E9FFFB] px-3 py-1.5 text-[12px] font-black text-[#008E84] dark:bg-cyan-500/10 dark:text-cyan-300">
            <MapIcon size={13} />
            {item.meta}
          </span>
        ) : (
          item.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-[#F4F0EA] px-3 py-1.5 text-[11px] font-bold text-[#625A52] dark:bg-white/[0.06] dark:text-white/45"
            >
              {tag}
            </span>
          ))
        )}
      </div>

      <div className="mt-5 rounded-[18px] border border-[#E8E0D6] bg-[#F8F4ED] px-4 py-3 dark:border-white/10 dark:bg-white/[0.035]">
        <div className="flex items-center gap-2 text-[12px] font-black text-[#514A43] dark:text-white/55">
          <Sparkles size={14} className={tone.text} />
          <span>{item.highlight ?? item.meta}</span>
        </div>
      </div>

      {item.kind === "sherlock_report" ? (
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onExportSherlockReport(item)}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-[#D8DDE8] text-[11px] font-black uppercase tracking-[0.12em] text-[#1F2A38] transition hover:bg-[#E8ECF4]"
          >
            <Download size={14} />
            Export
          </button>
          <button
            type="button"
            onClick={() => onDeleteSherlockReport(item)}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-[#F2C6C2] text-[11px] font-black uppercase tracking-[0.12em] text-[#A5342E] transition hover:bg-[#FFF0EF]"
          >
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      ) : null}

      <div className="mt-auto border-t border-[#E4DCD2] pt-5 dark:border-white/10">
        <Link
          href={item.href}
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-full border border-[#A7EFE6] text-[12px] font-black uppercase tracking-[0.12em] text-[#00AFA0] transition hover:bg-[#B7F4EA] hover:text-[#052E2A]"
        >
          {item.actionLabel}
          <ArrowRight size={15} />
        </Link>
      </div>
    </motion.article>
  )
}

function CollectionSummaryStat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ElementType
  label: string
  value: number
  tone: "purple" | "orange" | "teal" | "dark"
}) {
  const tones = {
    purple: "bg-[#E9DDFF] text-[#7C5CFF]",
    orange: "bg-[#FFF0C8] text-[#C96B00]",
    teal: "bg-[#B7F4EA] text-[#008E84]",
    dark: "bg-[#251F1A] text-white dark:bg-white dark:text-[#111]",
  }

  return (
    <div className="rounded-[22px] border border-[#E2D9CF] bg-[#FFFDF8]/85 p-4 shadow-[0_10px_28px_rgba(42,37,32,0.05)] dark:border-white/10 dark:bg-white/[0.04]">
      <div className="flex items-center justify-between gap-3">
        <span className={cn("grid h-10 w-10 place-items-center rounded-2xl", tones[tone])}>
          <Icon size={17} />
        </span>
        <span className="text-2xl font-black tracking-[-0.07em] text-[#251F1A] dark:text-white">{value}</span>
      </div>
      <p className="mt-3 text-[11px] font-black uppercase tracking-[0.16em] text-[#7B7168] dark:text-white/40">{label}</p>
    </div>
  )
}

function CollectionAvatar({
  item,
  icon: Icon,
  tone,
}: {
  item: CollectionItem
  icon: React.ElementType
  tone: { soft: string; ring: string }
}) {
  if (item.avatar) {
    return (
      <span className={cn("relative grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white p-1 shadow-[0_14px_30px_rgba(42,37,32,0.09)] ring-4", tone.ring)}>
        <img src={item.avatar} alt={`${item.title} avatar`} className="h-full w-full rounded-[14px] object-cover" />
        <span className={cn("absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full border-2 border-[#FFFDF8]", tone.soft)}>
          <Icon size={12} />
        </span>
      </span>
    )
  }

  return (
    <span className={cn("relative grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-sm font-black shadow-[0_14px_30px_rgba(42,37,32,0.08)] ring-4", tone.soft, tone.ring)}>
      {item.kind === "roadmap" ? <Icon size={22} /> : item.initials ?? getInitials(item.title)}
      <span className="absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full border-2 border-[#FFFDF8] bg-[#FFFDF8] text-[#5F5A54] dark:border-[#101010] dark:bg-[#101010] dark:text-white/55">
        <Icon size={12} />
      </span>
    </span>
  )
}

function MiniStat({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="rounded-[16px] border border-[#E8E0D6] bg-[#F8F4ED] px-3 py-2.5 dark:border-white/10 dark:bg-white/[0.035]">
      <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-[#8A8177] dark:text-white/35">
        <Icon size={12} />
        {label}
      </div>
      <p className="mt-1 truncate text-[12px] font-black text-[#251F1A] dark:text-white">{value}</p>
    </div>
  )
}

function RoadmapPreview({ phases, progress }: { phases: number; progress: number }) {
  const points = Array.from({ length: Math.max(3, phases) })

  return (
    <div className="mt-5 rounded-[20px] border border-[#E4DCD2] bg-[#F7F2EA] px-5 py-5 dark:border-white/10 dark:bg-white/[0.04]">
      <div className="mb-3 flex items-center justify-between text-[10px] font-black uppercase tracking-[0.16em] text-[#8A8177] dark:text-white/35">
        <span>3D path preview</span>
        <span>{progress}%</span>
      </div>
      <div className="relative h-16 overflow-hidden rounded-2xl border border-[#E3D9CD] bg-[#FFFDF8] px-5 dark:border-white/10 dark:bg-black/20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#D7D0C7_1px,transparent_1px)] bg-[size:14px_14px] opacity-55 dark:opacity-20" />
        <div className="absolute left-7 right-7 top-1/2 h-[4px] -translate-y-1/2 rounded-full bg-[#D9F6F2]">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="h-full rounded-full bg-[#00BFB0]"
          />
        </div>
        <div className="relative z-10 flex h-full items-center justify-between">
          {points.map((_, index) => {
            const pointProgress = ((index + 1) / points.length) * 100
            const completed = pointProgress <= progress + 10
            return (
              <span
                key={index}
                className={cn(
                  "grid h-8 w-8 place-items-center rounded-full border-2 shadow-[0_8px_18px_rgba(42,37,32,0.1)]",
                  completed ? "border-[#7EE7DD] bg-[#E9FFFB]" : "border-[#DED4C7] bg-[#FFFDF8]"
                )}
              >
                <span className={cn("h-3.5 w-3.5 rounded-full", completed ? "bg-[#00BFB0]" : "bg-[#CFC5BA]")} />
              </span>
            )
          })}
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between text-[11px] font-bold text-[#7B7168] dark:text-white/40">
        <span>Foundations</span>
        <span>Milestones</span>
        <span>Career</span>
      </div>
    </div>
  )
}

function mergeItems(primary: CollectionItem[], fallback: CollectionItem[]) {
  const byId = new Map<string, CollectionItem>()
  ;[...primary, ...fallback].forEach((item) => byId.set(item.id, item))
  return Array.from(byId.values())
}

function getInitials(value?: string) {
  if (!value) return "NX"
  const words = value
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
  return (words[0]?.[0] ?? "N").concat(words[1]?.[0] ?? words[0]?.[1] ?? "X").toUpperCase()
}

function loadStoredItems(): CollectionItem[] {
  const items: CollectionItem[] = []

  try {
    const savedSherlockReports = JSON.parse(localStorage.getItem("sherlock-saved-reports-v1") || "[]") as Array<{
      id?: string
      title?: string
      savedAt?: string
      summary?: string
      description?: string
      tags?: string[]
      href?: string
      artifact?: SherlockArtifactEnvelope
    }>

    savedSherlockReports.forEach((report, index) => {
      if (!report.title) return
      const verified = report.artifact?.summary?.verified ?? 0
      const contradicted = report.artifact?.summary?.contradicted ?? 0
      const proofRoutes = report.artifact?.summary?.needsAlternativeProof ?? 0
      items.push({
        id: `stored-sherlock-${report.id ?? index}`,
        kind: "sherlock_report",
        title: report.title,
        eyebrow: "Sherlock Report",
        savedAt: formatSavedDate(report.savedAt),
        summary: report.summary ?? `${verified} verified, ${contradicted} contradicted, ${proofRoutes} proof routes.`,
        description: report.description ?? "Evidence-only verification report. Human decision required.",
        tags: (report.tags ?? ["Evidence", "Audit", "Interview"]).slice(0, 4),
        meta: "Evidence report",
        href: report.href ?? "/analyse-profile",
        actionLabel: "Open Report",
        initials: "SH",
        progress: 0,
        status: report.artifact?.targetRole ?? "Human review",
        lastOpened: "Saved now",
        highlight: "No score, no ranking",
        sourceReportId: report.id,
        artifact: report.artifact,
      })
    })
  } catch {
    // Ignore malformed Sherlock reports.
  }

  try {
    const savedRoles = JSON.parse(localStorage.getItem("nexus-student-saved-roles") || "[]") as Array<{
      id?: string
      company?: string
      title?: string
      salary?: string
      type?: string
      location?: string
      tags?: string[]
      why?: string
    }>

    savedRoles.forEach((role, index) => {
      if (!role.title) return
      items.push({
        id: `stored-job-${role.id ?? index}`,
        kind: "job",
        title: role.title,
        eyebrow: role.company ?? "Saved job",
        savedAt: "Saved now",
        summary: role.why ?? `${role.company ?? "Company"} role saved from Columbus.`,
        description: role.salary ?? "Saved job opportunity",
        tags: [role.location, role.type, ...(role.tags ?? [])].filter((tag): tag is string => Boolean(tag)).slice(0, 4),
        meta: "Saved job opportunity",
        href: "/student/jobs",
        actionLabel: "Open Job",
        salary: role.salary,
        initials: getInitials(role.company ?? role.title),
        progress: 90,
        status: "Saved from Columbus",
        lastOpened: "Saved now",
        highlight: "Candidate fit",
      })
    })
  } catch {
    // Ignore malformed saved jobs.
  }

  try {
    const savedProfile = localStorage.getItem("nexus-student-profile-v1")
    if (savedProfile) {
      const parsed = JSON.parse(savedProfile) as { targetRole?: string; tagline?: string; keywords?: string[] }
      items.push({
        id: "stored-profile-current",
        kind: "profile",
        title: parsed.targetRole ? `${parsed.targetRole} Profile` : "Current Recruiter Profile",
        eyebrow: "Profile",
        savedAt: "Saved now",
        summary: "Latest profile saved from Profile",
        description: parsed.tagline ?? "Recruiter-ready profile saved from Aristotle.",
        tags: (parsed.keywords ?? ["React", "TypeScript", "Python"]).slice(0, 4),
        meta: "Saved profile",
        href: "/student/notes",
        actionLabel: "Open Profile",
        avatar: mediaUrl("PROFILE-PHOTO.png"),
        initials: "VV",
        progress: 94,
        status: "Latest saved",
        lastOpened: "Saved now",
        highlight: "Aristotle tailored",
      })
    }
  } catch {
    // Ignore malformed saved profile.
  }

  return items
}

function formatSavedDate(value?: string) {
  if (!value) return "Saved now"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Saved now"
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
}

function removeStoredSherlockReport(reportId: string) {
  try {
    const key = "sherlock-saved-reports-v1"
    const savedSherlockReports = JSON.parse(localStorage.getItem(key) || "[]") as Array<{ id?: string }>
    localStorage.setItem(key, JSON.stringify(savedSherlockReports.filter((report) => report.id !== reportId)))
  } catch {
    // Ignore malformed local report storage.
  }
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

function isUuid(value: string | undefined) {
  return Boolean(value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i.test(value))
}
