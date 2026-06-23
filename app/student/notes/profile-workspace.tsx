"use client"

import React, { useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowUp,
  BadgeCheck,
  Briefcase,
  Camera,
  Check,
  ChevronDown,
  Code2,
  Download,
  FileText,
  Github,
  Globe,
  GraduationCap,
  HeartHandshake,
  Image as ImageIcon,
  ImagePlus,
  LayoutGrid,
  Link2,
  Linkedin,
  Loader2,
  LogOut,
  Paperclip,
  Pencil,
  Plus,
  ShieldCheck,
  Sparkles,
  Trash2,
  Trophy,
  X,
} from "lucide-react"
import type { ChatMessageRow, FullProfile, ProofRow, SectionWithItems } from "@/lib/supabase/types"
import type { LinkedInIdentity } from "@/lib/profile/linkedin"
import { RESUME_DEFINITIONS } from "@/lib/resume/types"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import {
  addItem,
  addProof,
  addSection,
  deleteItem,
  deleteProof,
  deleteSection,
  signOutAction,
  syncLinkedInIdentityAction,
  updateAvatar,
  updateHeader,
  updateItem,
  verifyAllProofs,
  verifyProofAction,
} from "./actions"

const QUICK_COMMANDS = [
  "Create an education section from my resume",
  "Add my GitHub project github.com/...",
  "Add these photos to my social work section",
]

const SECTION_PRESETS: { type: string; title: string }[] = [
  { type: "education", title: "Education" },
  { type: "experience", title: "Experience" },
  { type: "projects", title: "Projects" },
  { type: "research", title: "Research" },
  { type: "hackathons", title: "Hackathons & Awards" },
  { type: "social-work", title: "Social Work" },
  { type: "certifications", title: "Certifications" },
  { type: "skills", title: "Skills" },
  { type: "gallery", title: "Events & Gallery" },
  { type: "custom", title: "Custom Section" },
]

const SECTION_ICON: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  education: GraduationCap,
  experience: Briefcase,
  projects: Code2,
  research: FileText,
  hackathons: Trophy,
  "social-work": HeartHandshake,
  certifications: BadgeCheck,
  skills: Sparkles,
  gallery: ImageIcon,
  custom: LayoutGrid,
}

function initials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || "?"
  )
}

export default function ProfileWorkspace({
  profile,
  initialChat,
  linkedInIdentity,
}: {
  profile: FullProfile
  initialChat: ChatMessageRow[]
  linkedInIdentity: LinkedInIdentity
}) {
  const projectSections = profile.sections.filter((s) => s.type === "projects")
  const pitchSection = profile.sections.find((s) => s.type === "gallery")
  const endorsementItems = profile.sections
    .filter((s) => s.type === "endorsements" || s.type === "social-work")
    .flatMap((s) => s.items)
  // Accordion holds everything that isn't already surfaced as a featured band.
  const accordionSections = profile.sections.filter((s) => s.type !== "projects")

  return (
    <main className="flex h-full min-w-0 flex-1 overflow-hidden bg-[#FAF7F2] font-normal text-[#1F1B17] dark:bg-[#070707] dark:text-white">
      <AristotlePanel profile={profile} initialChat={initialChat} />

      <section className="relative h-full min-w-0 flex-1 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(36,31,24,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(36,31,24,0.025)_1px,transparent_1px)] bg-[size:32px_32px] dark:bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)]" />

        <div className="relative h-full overflow-y-auto px-6 py-6">
          <div className="mx-auto flex w-full max-w-[820px] flex-col gap-4 pb-12">
            <Toolbar profile={profile} linkedInIdentity={linkedInIdentity} />
            <HeroIdentityStrip profile={profile} />
            <PitchReel profile={profile} pitchSection={pitchSection} />
            <MetricsStrip profile={profile} />
            {projectSections.length > 0 && <FeaturedWorkCarousel sections={projectSections} />}
            <EndorsementsAndInsights profile={profile} items={endorsementItems} />

            {profile.sections.length === 0 && (
              <div className="rounded-2xl border border-dashed border-[#E3DACD] px-6 py-10 text-center dark:border-white/10">
                <LayoutGrid size={20} className="mx-auto text-[#A89D91] dark:text-white/25" />
                <h2 className="mt-3 text-[13px] font-semibold text-[#1F1B17] dark:text-white">No sections yet</h2>
                <p className="mx-auto mt-1 max-w-md text-[12px] font-normal leading-5 text-[#7B7269] dark:text-white/50">
                  Ask Aristotle to build one from your resume, or add a section manually below.
                </p>
              </div>
            )}

            {accordionSections.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between pl-1">
                  <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#A89D91] dark:text-white/40">
                    Everything else
                  </h2>
                  <span className="text-[10px] font-medium text-[#A89D91] dark:text-white/40">
                    {accordionSections.length} sections · click to expand
                  </span>
                </div>
                {accordionSections.map((section) => (
                  <AccordionSection key={section.id} section={section} />
                ))}
              </div>
            )}

            <AddSectionForm />
          </div>
        </div>
      </section>
    </main>
  )
}

// --- LinkedIn slim toolbar button -------------------------------------------
function LinkedInToolbarButton({ identity }: { identity: LinkedInIdentity }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [error, setError] = useState("")

  function connect() {
    start(async () => {
      setError("")
      const supabase = createClient()
      const redirectTo = `${window.location.origin}/auth/callback?mode=linkedin-connect&next=${encodeURIComponent("/student/notes")}`
      const { error: oauthError } = await supabase.auth.linkIdentity({
        provider: "linkedin_oidc",
        options: { redirectTo },
      })
      if (oauthError) setError(oauthError.message)
    })
  }

  function refreshIdentity() {
    start(async () => {
      setError("")
      const result = await syncLinkedInIdentityAction()
      if (!result.ok) setError(result.error ?? "Could not refresh LinkedIn identity")
      router.refresh()
    })
  }

  if (identity.connected) {
    return (
      <button
        type="button"
        onClick={refreshIdentity}
        disabled={pending}
        title={identity.name ? `${identity.name} · ${identity.email}` : "LinkedIn connected"}
        className="inline-flex items-center gap-1.5 rounded-md border border-[#0A66C2]/25 bg-white px-2.5 py-1.5 text-[10px] font-semibold text-[#0A66C2] transition hover:bg-[#0A66C2]/5 disabled:opacity-50 dark:bg-white/[0.04]"
      >
        {pending ? <Loader2 size={11} className="animate-spin" /> : <Linkedin size={11} />}
        LinkedIn connected
      </button>
    )
  }

  return (
    <div className="relative inline-flex">
      <button
        type="button"
        onClick={connect}
        disabled={pending}
        className="inline-flex items-center gap-1.5 rounded-md bg-[#0A66C2] px-2.5 py-1.5 text-[10px] font-semibold text-white shadow-sm transition hover:bg-[#084f96] disabled:opacity-50"
      >
        {pending ? <Loader2 size={11} className="animate-spin" /> : <Linkedin size={11} />}
        Connect LinkedIn
      </button>
      {error && (
        <span className="absolute -bottom-5 right-0 text-[10px] font-medium text-red-600" role="alert">
          {error}
        </span>
      )}
    </div>
  )
}

// --- Resume export slim dropdown --------------------------------------------
function ResumeExportButton() {
  const [open, setOpen] = useState(false)
  const [format, setFormat] = useState(RESUME_DEFINITIONS[0].id)
  const ref = useRef<HTMLDivElement>(null)
  const active = RESUME_DEFINITIONS.find((entry) => entry.id === format) ?? RESUME_DEFINITIONS[0]

  React.useEffect(() => {
    if (!open) return
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onDocClick)
    return () => document.removeEventListener("mousedown", onDocClick)
  }, [open])

  return (
    <div className="relative inline-flex" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-md border border-[#E8E0D2] bg-white px-2.5 py-1.5 text-[10px] font-semibold text-[#5C5249] transition hover:border-[#7C5CFF]/45 hover:text-[#6B4EF6] dark:border-white/10 dark:bg-white/[0.04] dark:text-white/55"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <FileText size={11} className="text-[#7C5CFF]" />
        Export · {active.label}
        <ChevronDown size={11} className={cn("transition", open && "rotate-180")} />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-30 mt-1 w-60 rounded-lg border border-[#E8E0D2] bg-white p-1.5 shadow-lg dark:border-white/10 dark:bg-[#141414]"
        >
          <p className="px-2 pb-1 pt-0.5 text-[9px] font-semibold uppercase tracking-wider text-[#A89D91] dark:text-white/35">
            Format
          </p>
          <div className="flex flex-col">
            {RESUME_DEFINITIONS.map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => setFormat(entry.id)}
                className={cn(
                  "flex items-start gap-2 rounded-md px-2 py-1.5 text-left transition",
                  format === entry.id
                    ? "bg-[#F3EFFF] text-[#6B4EF6] dark:bg-[#7C5CFF]/15 dark:text-[#C9BEFF]"
                    : "text-[#5C5249] hover:bg-[#F7F3EB] dark:text-white/60 dark:hover:bg-white/[0.04]",
                )}
                role="menuitem"
              >
                <span className="mt-0.5 flex h-3 w-3 shrink-0 items-center justify-center">
                  {format === entry.id && <Check size={11} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[11px] font-semibold">{entry.label}</span>
                  <span className="mt-0.5 block text-[10px] font-normal leading-4 text-[#7B7269] dark:text-white/45">
                    {entry.description}
                  </span>
                </span>
              </button>
            ))}
          </div>
          <div className="mt-1 border-t border-[#E8E0D2] pt-1.5 dark:border-white/10">
            <a
              href={`/api/student/resume?format=${format}`}
              onClick={() => setOpen(false)}
              className="flex w-full items-center justify-center gap-1.5 rounded-md bg-[#7C5CFF] px-2.5 py-1.5 text-[10px] font-semibold text-white shadow-sm transition hover:bg-[#684AF0]"
            >
              <Download size={11} /> Download {active.label} PDF
            </a>
          </div>
        </div>
      )}
    </div>
  )
}

// --- Toolbar ----------------------------------------------------------------
function Toolbar({ profile, linkedInIdentity }: { profile: FullProfile; linkedInIdentity: LinkedInIdentity }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [verifying, startVerify] = useTransition()
  const [verificationNote, setVerificationNote] = useState("")

  const allProofs = profile.sections.flatMap((s) => s.items).flatMap((i) => i.proofs)
  const verifiedCount = allProofs.filter((p) => p.status === "verified").length
  const partialCount = allProofs.filter((p) => p.status === "partial").length
  const pendingCount = allProofs.filter((p) => p.status !== "verified").length

  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-2 text-[11px] font-medium text-[#7B7269] dark:text-white/50">
        <Check size={12} className="text-emerald-600" />
        <span>Signed in as</span>
        <span className="font-semibold text-[#1F1B17] dark:text-white">{profile.full_name || profile.email}</span>
        <span className="rounded-full bg-[#F3EFFF] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-[#6B4EF6] dark:bg-[#7C5CFF]/15 dark:text-[#C9BEFF]">
          {profile.role}
        </span>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-1.5">
        {allProofs.length > 0 && (
          <>
            <span className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-[10px] font-medium text-[#7B7269] dark:bg-white/[0.04] dark:text-white/50">
              <ShieldCheck size={12} className={verifiedCount === allProofs.length ? "text-emerald-600" : "text-[#7C5CFF]"} />
              <span className="font-semibold">{allProofs.length}</span> claimed · <span className="font-semibold">{verifiedCount}</span> verified{partialCount > 0 ? ` · ${partialCount} partial` : ""}
            </span>
            {pendingCount > 0 && (
              <button
                type="button"
                onClick={() =>
                  startVerify(async () => {
                    setVerificationNote("")
                    const result = await verifyAllProofs()
                    setVerificationNote(
                      result.ok
                        ? `Checked ${result.checked ?? 0}: ${result.verified ?? 0} verified, ${result.partial ?? 0} partial, ${result.unverified ?? 0} unverified.`
                        : result.error ?? "Verification failed.",
                    )
                    router.refresh()
                  })
                }
                disabled={verifying}
                className="inline-flex items-center gap-1 rounded-md bg-[#7C5CFF] px-2.5 py-1.5 text-[10px] font-semibold text-white shadow-sm transition hover:bg-[#684AF0] disabled:opacity-50"
              >
                {verifying ? <Loader2 size={12} className="animate-spin" /> : <ShieldCheck size={12} />}
                Verify all ({pendingCount})
              </button>
            )}
          </>
        )}
        {verificationNote && <span className="max-w-72 text-[10px] font-medium text-[#7B7269] dark:text-white/50">{verificationNote}</span>}
        <LinkedInToolbarButton identity={linkedInIdentity} />
        <ResumeExportButton />
        <button
          type="button"
          onClick={() => start(() => void signOutAction())}
          disabled={pending}
          className="inline-flex items-center gap-1 rounded-md border border-[#E8E0D2] bg-white px-2.5 py-1.5 text-[10px] font-semibold text-[#7B7269] transition hover:border-red-300 hover:text-red-600 disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/50"
        >
          {pending ? <Loader2 size={12} className="animate-spin" /> : <LogOut size={12} />}
          Sign out
        </button>
      </div>
    </div>
  )
}

// --- Avatar uploader --------------------------------------------------------
function AvatarUploader({ profile }: { profile: FullProfile }) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")

  async function handleFile(file: File) {
    setError("")
    if (!file.type.startsWith("image/")) {
      setError("Pick an image file")
      return
    }
    if (file.size > 6 * 1024 * 1024) {
      setError("Image must be under 6MB")
      return
    }
    setUploading(true)
    try {
      const supabase = createClient()
      const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "png"
      const path = `${profile.id}/avatar/${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage
        .from("profile-media")
        .upload(path, file, { upsert: true, contentType: file.type })
      if (upErr) throw upErr
      const { data } = supabase.storage.from("profile-media").getPublicUrl(path)
      const res = await updateAvatar({ url: data.publicUrl })
      if (!res.ok) throw new Error(res.error ?? "Could not save avatar")
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  async function clearAvatar() {
    setError("")
    setUploading(true)
    const res = await updateAvatar({ url: null })
    setUploading(false)
    if (!res.ok) setError(res.error ?? "Could not remove avatar")
    else router.refresh()
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        title={profile.avatar_url ? "Change photo" : "Upload a photo"}
        className="group/avatar relative flex w-24 aspect-[4/5] shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-[#7C5CFF] to-[#6B4EF6] text-lg font-bold text-white shadow-sm ring-offset-2 transition hover:ring-2 hover:ring-[#7C5CFF]/40 disabled:opacity-60"
      >
        {profile.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.avatar_url} alt={profile.full_name} className="h-full w-full object-cover" />
        ) : (
          <span>{initials(profile.full_name)}</span>
        )}
        <span
          className={cn(
            "absolute inset-0 flex flex-col items-center justify-center gap-0.5 bg-black/55 text-[9px] font-semibold uppercase tracking-wider text-white transition",
            uploading ? "opacity-100" : "opacity-0 group-hover/avatar:opacity-100",
          )}
        >
          {uploading ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
          {!uploading && <span>{profile.avatar_url ? "Change" : "Upload"}</span>}
        </span>
      </button>
      {profile.avatar_url && !uploading && (
        <button
          type="button"
          onClick={clearAvatar}
          title="Remove photo"
          className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-[#E8E0D2] bg-white text-[#7B7269] opacity-0 shadow-sm transition hover:text-red-600 group-hover/avatar:opacity-100 dark:border-white/10 dark:bg-[#141414] dark:text-white/50"
          aria-label="Remove photo"
        >
          <X size={11} />
        </button>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) void handleFile(f)
          e.target.value = ""
        }}
      />
      {error && (
        <p className="absolute left-0 top-full mt-1 whitespace-nowrap text-[10px] font-medium text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

// --- Hero identity strip (replaces the old LinkedIn-style header block) -----
function HeroIdentityStrip({ profile }: { profile: FullProfile }) {
  const [editing, setEditing] = useState(false)
  const [pending, start] = useTransition()
  const [form, setForm] = useState({
    full_name: profile.full_name,
    headline: profile.headline,
    about: profile.about,
    tags: profile.tags.join(", "),
    target_role: profile.target_role,
  })

  function beginEdit() {
    setForm({
      full_name: profile.full_name,
      headline: profile.headline,
      about: profile.about,
      tags: profile.tags.join(", "),
      target_role: profile.target_role,
    })
    setEditing(true)
  }

  function save() {
    start(async () => {
      const res = await updateHeader({
        full_name: form.full_name,
        headline: form.headline,
        about: form.about,
        target_role: form.target_role,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      })
      if (res.ok) setEditing(false)
    })
  }

  const allProofs = profile.sections.flatMap((s) => s.items).flatMap((i) => i.proofs)
  const hasVerifiedProofs = allProofs.some((p) => p.status === "verified")
  const topSkills = profile.tags.slice(0, 3)

  // Pull school + grad date from the first education item if present.
  const eduSection = profile.sections.find((s) => s.type === "education")
  const topEdu = eduSection?.items[0]
  const eduMeta = (topEdu?.meta ?? {}) as ItemMeta
  const schoolLine = topEdu
    ? [
        eduMeta.school || splitTitle(topEdu.title)[0],
        eduMeta.degree,
        eduMeta.end ? `Graduating ${formatYM(eduMeta.end)}` : "",
      ]
        .filter(Boolean)
        .join(" · ")
    : profile.headline

  return (
    <section className="overflow-hidden rounded-2xl border border-[#E8E0D2] bg-white p-5 shadow-[0_1px_2px_rgba(31,27,23,0.04)] dark:border-white/10 dark:bg-[#0E0E0E]">
      {!editing ? (
        <div className="flex items-start gap-4">
          <AvatarUploader profile={profile} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-[#1F1B17] dark:text-white">
                {profile.full_name || "Your name"}
              </h1>
              {hasVerifiedProofs && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300">
                  <BadgeCheck size={11} /> verified by Aristotle
                </span>
              )}
            </div>
            <p className="mt-0.5 text-[12px] font-normal text-[#7B7269] dark:text-white/55">
              {schoolLine || "Add a headline — your role focus in one line"}
            </p>
            {topSkills.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                {topSkills.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-full bg-[#F3EFFF] px-2.5 py-0.5 text-[11px] font-semibold text-[#6B4EF6] dark:bg-[#7C5CFF]/15 dark:text-[#C9BEFF]"
                  >
                    <Sparkles size={9} /> {tag}
                  </span>
                ))}
                <span className="text-[10px] font-medium text-[#A89D91] dark:text-white/40">
                  top skills, proof-backed
                </span>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={beginEdit}
            className="inline-flex shrink-0 items-center gap-1 rounded-md border border-[#E8E0D2] bg-white px-2.5 py-1.5 text-[10px] font-semibold text-[#7B7269] transition hover:border-[#7C5CFF]/45 hover:text-[#6B4EF6] dark:border-white/10 dark:bg-white/[0.04] dark:text-white/50"
          >
            <Pencil size={11} /> Edit
          </button>
        </div>
      ) : (
        <div className="flex items-start gap-4">
          <AvatarUploader profile={profile} />
          <div className="min-w-0 flex-1 space-y-3">
            <EditField label="Full name" value={form.full_name} onChange={(v) => setForm({ ...form, full_name: v })} />
            <EditField label="Headline / tagline (shown in pitch reel)" value={form.headline} onChange={(v) => setForm({ ...form, headline: v })} placeholder='e.g. "I build distributed systems that scale to 100k+ RPS."' />
            <EditField label="Target role" value={form.target_role} onChange={(v) => setForm({ ...form, target_role: v })} placeholder="Backend Engineer" />
            <EditField label="Top skills (first 3 shown as pills)" value={form.tags} onChange={(v) => setForm({ ...form, tags: v })} placeholder="TypeScript, Kubernetes, Distributed systems" />
            <div>
              <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[#7B7269] dark:text-white/45">About</span>
              <textarea
                value={form.about}
                onChange={(e) => setForm({ ...form, about: e.target.value })}
                rows={3}
                placeholder="A short note about you."
                className="w-full resize-none rounded-lg border border-[#E8E0D2] bg-white px-3 py-2 text-[13px] font-normal text-[#1F1B17] outline-none focus:border-[#7C5CFF]/50 focus:ring-2 focus:ring-[#7C5CFF]/15 dark:border-white/10 dark:bg-[#141414] dark:text-white"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={save}
                disabled={pending}
                className="inline-flex items-center gap-1 rounded-md bg-[#7C5CFF] px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm transition hover:bg-[#684AF0] disabled:opacity-50"
              >
                {pending ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} Save
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                disabled={pending}
                className="inline-flex items-center gap-1 rounded-md border border-[#E8E0D2] px-3 py-1.5 text-[11px] font-semibold text-[#7B7269] transition hover:bg-[#1F1B17]/5 disabled:opacity-50 dark:border-white/10 dark:text-white/50"
              >
                <X size={12} /> Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

// --- Pitch reel: hero media + tagline, replaces wall-of-text About ----------
function PitchReel({ profile, pitchSection }: { profile: FullProfile; pitchSection?: SectionWithItems }) {
  const allImages = pitchSection
    ? pitchSection.items.flatMap((it) => {
        const meta = (it.meta ?? {}) as ItemMeta & { images?: string[] }
        return (meta.images ?? []).map((src) => ({ src, caption: it.title }))
      })
    : []
  const [idx, setIdx] = useState(0)
  const total = allImages.length
  const current = total > 0 ? allImages[idx % total] : null

  const tagline =
    profile.headline ||
    (profile.about ? profile.about.split(/[.!?]/)[0].trim() : "")

  return (
    <section className="overflow-hidden rounded-2xl border border-[#E8E0D2] bg-white p-5 shadow-[0_1px_2px_rgba(31,27,23,0.04)] dark:border-white/10 dark:bg-[#0E0E0E]">
      <div className="flex flex-col gap-4 md:flex-row md:items-stretch">
        <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-[#1F1B17] to-[#3F362E] md:w-[300px] dark:from-[#0c0c0c] dark:to-[#1a1a1a]">
          {current ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={current.src} alt={current.caption} className="h-full w-full object-cover" />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
              <span className="absolute bottom-2 left-2.5 text-[10px] font-semibold text-white/85">
                {current.caption}
              </span>
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <div className="text-center">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-white/95">
                  <ImageIcon size={20} className="text-[#1F1B17]" />
                </div>
                <p className="mt-2 text-[10px] font-medium uppercase tracking-[0.2em] text-white/70">
                  Drop a pitch reel
                </p>
              </div>
            </div>
          )}
          {total > 1 && (
            <>
              <button
                type="button"
                onClick={() => setIdx((i) => (i - 1 + total) % total)}
                className="absolute left-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-[14px] font-bold text-[#1F1B17] backdrop-blur-sm transition hover:bg-white"
                aria-label="Previous"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={() => setIdx((i) => (i + 1) % total)}
                className="absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-[14px] font-bold text-[#1F1B17] backdrop-blur-sm transition hover:bg-white"
                aria-label="Next"
              >
                ›
              </button>
              <div className="absolute bottom-2 right-2 rounded-md bg-black/45 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white/90 backdrop-blur-sm">
                {idx + 1} / {total}
              </div>
            </>
          )}
        </div>
        <div className="flex flex-1 flex-col justify-center">
          {tagline ? (
            <blockquote
              className="text-[17px] font-medium italic leading-[1.45] text-[#1F1B17] dark:text-white"
              style={{ fontFamily: "Georgia, ui-serif, serif" }}
            >
              &ldquo;{tagline}&rdquo;
            </blockquote>
          ) : (
            <p className="text-[13px] font-medium text-[#A89D91] dark:text-white/40">
              Add a headline — it becomes your tagline here.
            </p>
          )}
          <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#A89D91] dark:text-white/40">
            {profile.target_role || "Add a target role"}
          </p>
          {profile.about && (
            <p className="mt-3 line-clamp-3 text-[12px] font-normal leading-5 text-[#5C5249] dark:text-white/55">
              {profile.about}
            </p>
          )}
        </div>
      </div>
    </section>
  )
}

// --- Metrics strip: 4 live-computed tiles -----------------------------------
function MetricsStrip({ profile }: { profile: FullProfile }) {
  const allProofs = profile.sections.flatMap((s) => s.items).flatMap((i) => i.proofs)

  const projectsItems = profile.sections.filter((s) => s.type === "projects").flatMap((s) => s.items)
  const projectsCount = projectsItems.length
  const projectsWithProof = projectsItems.filter((i) => i.proofs.some((p) => p.status === "verified")).length

  const hackathonItems = profile.sections.filter((s) => s.type === "hackathons").flatMap((s) => s.items)
  const hackathonCount = hackathonItems.length
  const topPlace = hackathonItems
    .map((i) => ((i.meta ?? {}) as ItemMeta).place)
    .filter((p): p is string => Boolean(p))
    .sort()[0]

  const githubProofs = allProofs.filter((p) => p.kind === "github" && p.status === "verified")
  const githubCount = githubProofs.length
  const totalStars = githubProofs.reduce((acc, p) => {
    const e = (p.extracted ?? {}) as Record<string, unknown>
    return acc + (typeof e.stars === "number" ? e.stars : 0)
  }, 0)

  const verifiedCount = allProofs.filter((p) => p.status === "verified").length

  type Tone = "success" | "info" | "muted"
  const tiles: {
    label: string
    value: number
    sub: string
    subTone: Tone
    icon: React.ComponentType<{ size?: number; className?: string }>
  }[] = [
    {
      label: "Projects",
      value: projectsCount,
      sub: projectsWithProof > 0 ? `${projectsWithProof} with proof` : "Add proofs to verify",
      subTone: projectsWithProof > 0 ? "success" : "muted",
      icon: Code2,
    },
    {
      label: "Hackathons",
      value: hackathonCount,
      sub: topPlace ? `Best: ${topPlace} place` : "Add a win or finalist",
      subTone: topPlace ? "success" : "muted",
      icon: Trophy,
    },
    {
      label: "GitHub repos",
      value: githubCount,
      sub: totalStars > 0 ? `★ ${totalStars} stars` : githubCount > 0 ? "Verified" : "Connect GitHub proofs",
      subTone: githubCount > 0 ? "info" : "muted",
      icon: Github,
    },
    {
      label: "Verified claims",
      value: verifiedCount,
      sub: allProofs.length > 0 ? `${verifiedCount} of ${allProofs.length} proofs` : "Add proofs to start",
      subTone: verifiedCount > 0 ? "success" : "muted",
      icon: ShieldCheck,
    },
  ]

  return (
    <section className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {tiles.map((tile) => {
        const Icon = tile.icon
        const toneCls =
          tile.subTone === "success"
            ? "text-emerald-600 dark:text-emerald-400"
            : tile.subTone === "info"
              ? "text-[#6B4EF6] dark:text-[#C9BEFF]"
              : "text-[#A89D91] dark:text-white/40"
        return (
          <div
            key={tile.label}
            className="rounded-xl border border-[#E8E0D2] bg-white p-3.5 shadow-[0_1px_2px_rgba(31,27,23,0.04)] dark:border-white/10 dark:bg-[#0E0E0E]"
          >
            <div className="flex items-center gap-1.5">
              <Icon size={12} className="text-[#A89D91] dark:text-white/40" />
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#7B7269] dark:text-white/45">
                {tile.label}
              </p>
            </div>
            <p className="mt-1.5 text-[24px] font-bold leading-none tracking-tight text-[#1F1B17] dark:text-white">
              {tile.value}
            </p>
            <p className={cn("mt-1.5 text-[10px] font-semibold", toneCls)}>{tile.sub}</p>
          </div>
        )
      })}
    </section>
  )
}

// --- Featured work carousel: horizontal scroll, no LinkedIn list ------------
function FeaturedWorkCarousel({ sections }: { sections: SectionWithItems[] }) {
  const allItems = sections.flatMap((s) => s.items)
  const scrollRef = useRef<HTMLDivElement>(null)

  function scrollByDir(dir: 1 | -1) {
    if (!scrollRef.current) return
    scrollRef.current.scrollBy({ left: dir * 320, behavior: "smooth" })
  }

  if (allItems.length === 0) return null

  return (
    <section className="space-y-2.5">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-[15px] font-bold tracking-tight text-[#1F1B17] dark:text-white">Featured work</h2>
          <p className="text-[11px] font-normal text-[#7B7269] dark:text-white/50">
            {allItems.length} {allItems.length === 1 ? "project" : "projects"}
            {allItems.length > 2 ? " · swipe for more" : ""}
          </p>
        </div>
        {allItems.length > 2 && (
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => scrollByDir(-1)}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-[#E8E0D2] bg-white text-[14px] font-bold text-[#7B7269] transition hover:border-[#7C5CFF]/45 hover:text-[#6B4EF6] dark:border-white/10 dark:bg-white/[0.04] dark:text-white/50"
              aria-label="Scroll left"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => scrollByDir(1)}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-[#E8E0D2] bg-white text-[14px] font-bold text-[#7B7269] transition hover:border-[#7C5CFF]/45 hover:text-[#6B4EF6] dark:border-white/10 dark:bg-white/[0.04] dark:text-white/50"
              aria-label="Scroll right"
            >
              ›
            </button>
          </div>
        )}
      </div>
      <div
        ref={scrollRef}
        className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2"
        style={{ scrollSnapType: "x mandatory", scrollbarWidth: "thin" }}
      >
        {allItems.map((item) => (
          <div
            key={item.id}
            className="w-[300px] min-w-[300px] shrink-0"
            style={{ scrollSnapAlign: "start" }}
          >
            <ProjectCard item={item} />
          </div>
        ))}
      </div>
    </section>
  )
}

// --- Endorsements + Insights row --------------------------------------------
function EndorsementsAndInsights({ profile, items }: { profile: FullProfile; items: ItemRecord[] }) {
  const internshipCount = profile.sections
    .filter((s) => s.type === "experience")
    .flatMap((s) => s.items)
    .filter((it) => /intern/i.test(((it.meta as ItemMeta)?.role ?? "") + " " + it.title)).length

  const certCount = profile.sections
    .filter((s) => s.type === "certifications")
    .flatMap((s) => s.items).length

  const galleryCount = profile.sections
    .filter((s) => s.type === "gallery")
    .flatMap((s) => s.items)
    .flatMap((it) => ((it.meta as ItemMeta & { images?: string[] })?.images ?? [])).length

  const skillsCount = profile.sections
    .filter((s) => s.type === "skills")
    .flatMap((s) => s.items)
    .flatMap((it) =>
      (it.body || it.title)
        .split(/[·•·,]/)
        .map((s) => s.trim())
        .filter(Boolean),
    ).length

  return (
    <section className="grid gap-3 md:grid-cols-[1.4fr_1fr]">
      <div className="overflow-hidden rounded-2xl border border-[#E8E0D2] bg-white p-4 shadow-[0_1px_2px_rgba(31,27,23,0.04)] dark:border-white/10 dark:bg-[#0E0E0E]">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-[14px] font-bold tracking-tight text-[#1F1B17] dark:text-white">Endorsements</h2>
          <span className="inline-flex items-center gap-1 rounded-md bg-[#0A66C2]/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-[#0A66C2]">
            <Linkedin size={9} /> verified provenance
          </span>
        </div>
        {items.length === 0 ? (
          <p className="mt-3 rounded-lg border border-dashed border-[#E8E0D2] px-3 py-3 text-[11px] font-normal text-[#A89D91] dark:border-white/10 dark:text-white/40">
            No endorsements yet — ask Aristotle to add a quote from a tutor, manager, or teammate.
          </p>
        ) : (
          <div className="mt-2 space-y-2.5">
            {items.slice(0, 2).map((it) => {
              const meta = (it.meta ?? {}) as ItemMeta
              return (
                <div key={it.id} className="border-l-2 border-[#7C5CFF]/45 pl-3">
                  <p
                    className="text-[12px] font-medium italic leading-5 text-[#1F1B17] dark:text-white"
                    style={{ fontFamily: "Georgia, ui-serif, serif" }}
                  >
                    &ldquo;{it.body || it.title}&rdquo;
                  </p>
                  <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-[#7B7269] dark:text-white/45">
                    {it.title}
                    {meta.role ? ` · ${meta.role}` : ""}
                    {meta.company ? ` · ${meta.company}` : ""}
                  </p>
                </div>
              )
            })}
            {items.length > 2 && (
              <p className="text-[10px] font-medium text-[#A89D91] dark:text-white/40">
                + {items.length - 2} more
              </p>
            )}
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#E8E0D2] bg-white p-4 shadow-[0_1px_2px_rgba(31,27,23,0.04)] dark:border-white/10 dark:bg-[#0E0E0E]">
        <h2 className="text-[14px] font-bold tracking-tight text-[#1F1B17] dark:text-white">Insights</h2>
        <div className="mt-2.5 space-y-1.5">
          <InsightRow
            icon={Briefcase}
            label={`${internshipCount} ${internshipCount === 1 ? "internship" : "internships"}`}
            tone={internshipCount > 0 ? "success" : "muted"}
          />
          <InsightRow
            icon={BadgeCheck}
            label={`${certCount} ${certCount === 1 ? "certification" : "certifications"}`}
            tone={certCount > 0 ? "info" : "muted"}
          />
          <InsightRow icon={Sparkles} label={`${skillsCount} skills listed`} tone={skillsCount > 0 ? "info" : "muted"} />
          <InsightRow icon={ImageIcon} label={`${galleryCount} event photos`} tone={galleryCount > 0 ? "muted" : "muted"} />
        </div>
      </div>
    </section>
  )
}

function InsightRow({
  icon: Icon,
  label,
  tone,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>
  label: string
  tone: "success" | "info" | "muted"
}) {
  const iconCls =
    tone === "success"
      ? "text-emerald-600 dark:text-emerald-400"
      : tone === "info"
        ? "text-[#6B4EF6] dark:text-[#C9BEFF]"
        : "text-[#A89D91] dark:text-white/45"
  return (
    <div className="flex items-center gap-2">
      <Icon size={14} className={iconCls} />
      <span className="text-[12px] font-medium text-[#1F1B17] dark:text-white">{label}</span>
    </div>
  )
}

// --- Accordion section: collapsed wrapper around SectionBody ----------------
function AccordionSection({ section }: { section: SectionWithItems }) {
  const [open, setOpen] = useState(false)
  const [adding, setAdding] = useState(false)
  const [pending, start] = useTransition()
  const Icon = SECTION_ICON[section.type] ?? LayoutGrid
  const count = section.items.length

  return (
    <div className="overflow-hidden rounded-2xl border border-[#E8E0D2] bg-white shadow-[0_1px_2px_rgba(31,27,23,0.04)] dark:border-white/10 dark:bg-[#0E0E0E]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3 transition hover:bg-[#FAF7F2] dark:hover:bg-white/[0.02]"
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#F3EFFF] text-[#6B4EF6] dark:bg-[#7C5CFF]/15 dark:text-[#C9BEFF]">
          <Icon size={13} />
        </div>
        <div className="flex-1 text-left">
          <p className="text-[13px] font-bold tracking-tight text-[#1F1B17] dark:text-white">{section.title}</p>
        </div>
        <span className="text-[10px] font-medium text-[#A89D91] dark:text-white/40">
          {count === 0 ? "Empty" : `${count} ${count === 1 ? "item" : "items"}`}
        </span>
        <ChevronDown
          size={14}
          className={cn("text-[#A89D91] transition dark:text-white/40", open && "rotate-180")}
        />
      </button>
      {open && (
        <div className="border-t border-[#E8E0D2] px-4 py-4 dark:border-white/10">
          <div className="mb-3 flex items-center justify-end gap-1">
            <button
              type="button"
              onClick={() => setAdding((v) => !v)}
              className="inline-flex items-center gap-1 rounded-md border border-[#E8E0D2] bg-white px-2 py-1 text-[10px] font-semibold text-[#7B7269] transition hover:border-[#7C5CFF]/45 hover:text-[#6B4EF6] dark:border-white/10 dark:bg-white/[0.04] dark:text-white/50"
            >
              <Plus size={11} /> Item
            </button>
            <button
              type="button"
              onClick={() => start(() => void deleteSection(section.id))}
              disabled={pending}
              className="inline-flex items-center justify-center rounded-md border border-[#E8E0D2] bg-white p-1.5 text-[#7B7269] transition hover:border-red-300 hover:text-red-600 disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/50"
              aria-label="Delete section"
            >
              <Trash2 size={12} />
            </button>
          </div>
          {section.items.length === 0 && !adding && (
            <p className="rounded-lg border border-dashed border-[#E8E0D2] px-3 py-2.5 text-[11px] font-medium text-[#B7AEA5] dark:border-white/10">
              No items yet — add one, or ask Aristotle to fill this in.
            </p>
          )}
          {section.items.length > 0 && <SectionBody section={section} />}
          {adding && (
            <div className="mt-2">
              <AddItemForm sectionId={section.id} onDone={() => setAdding(false)} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// --- Logo + metadata helpers ------------------------------------------------
type ItemRecord = SectionWithItems["items"][number]
type ItemMeta = {
  company?: string
  school?: string
  role?: string
  degree?: string
  domain?: string
  logo?: string
  image?: string
  location?: string
  start?: string
  end?: string
  date?: string
  event?: string
  org?: string
  links?: { website?: string; source?: string }
  website?: string
  source?: string
  stack?: string[]
  gpa?: string
  place?: string
  award?: string
}

const KNOWN_DOMAINS: Record<string, string> = {
  examic: "examic.in",
  examicedtech: "examic.in",
  kandra: "kandradigital.com",
  kandradigital: "kandradigital.com",
  komodor: "komodor.com",
  universityofsydney: "sydney.edu.au",
  maharajainstituteoftechnologythandavapura: "mitt.ac.in",
  mitt: "mitt.ac.in",
  civonavigate: "civo.com",
  civo: "civo.com",
  hpe: "hpe.com",
  hpeswarmit: "hpe.com",
  gnd: "gndec.ac.in",
}

function inferDomain(name: string, override?: string): string {
  if (override) return override
  if (!name) return ""
  const slug = name
    .toLowerCase()
    .replace(/\(.+?\)/g, "")
    .replace(/\b(pvt\.?\s*ltd\.?|pvt|ltd|inc|llc|corp(oration)?|technologies|tech|labs|software|edtech|digital|university|institute|of|the)\b/g, "")
    .replace(/[^a-z0-9]/g, "")
  if (KNOWN_DOMAINS[slug]) return KNOWN_DOMAINS[slug]
  return slug ? `${slug}.com` : ""
}

function buildLogoSources(name: string, domain?: string, logoUrl?: string): string[] {
  const d = inferDomain(name, domain)
  const out: string[] = []
  if (logoUrl) out.push(logoUrl)
  if (d) {
    out.push(`https://www.google.com/s2/favicons?domain=${d}&sz=128`)
  }
  return out
}

function CompanyLogo({ name, domain, logoUrl, size = 36, rounded = "full" }: { name: string; domain?: string; logoUrl?: string; size?: number; rounded?: "full" | "lg" }) {
  const sources = buildLogoSources(name, domain, logoUrl)
  const [idx, setIdx] = useState(0)
  const failed = idx >= sources.length
  const src = sources[idx]
  const initial = (name?.trim()[0] || "?").toUpperCase()
  const roundedCls = rounded === "lg" ? "rounded-lg" : "rounded-full"
  return (
    <div
      className={cn("relative flex shrink-0 items-center justify-center overflow-hidden border border-[#E8E0D2] bg-white dark:border-white/10 dark:bg-white/[0.04]", roundedCls)}
      style={{ width: size, height: size }}
    >
      {!failed && src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          className="h-full w-full object-contain p-1"
          onError={() => setIdx((i) => i + 1)}
        />
      ) : (
        <span className="text-[11px] font-bold text-[#7B7269] dark:text-white/45">{initial}</span>
      )}
    </div>
  )
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
function formatYM(raw?: string) {
  if (!raw) return ""
  const m = /^(\d{4})-(\d{1,2})$/.exec(raw)
  if (m) {
    const [, y, mo] = m
    const idx = Math.max(0, Math.min(11, parseInt(mo, 10) - 1))
    return `${MONTHS[idx]} ${y}`
  }
  return raw
}
function dateRangeFromMeta(meta?: ItemMeta) {
  if (!meta) return ""
  if (meta.date) return meta.date
  const s = formatYM(meta.start)
  const e = formatYM(meta.end)
  if (s && e) return `${s} – ${e}`
  if (s) return s
  if (e) return e
  return ""
}
function splitTitle(title: string): [string, string] {
  const m = title.split(/\s—\s|\s-\s/)
  if (m.length >= 2) return [m[0].trim(), m.slice(1).join(" — ").trim()]
  return [title, ""]
}

// --- Skills -----------------------------------------------------------------
const DEVICON_SLUG: Record<string, string> = {
  "react": "react/react-original",
  "next.js": "nextjs/nextjs-original",
  "nextjs": "nextjs/nextjs-original",
  "typescript": "typescript/typescript-original",
  "javascript": "javascript/javascript-original",
  "node.js": "nodejs/nodejs-original",
  "nodejs": "nodejs/nodejs-original",
  "python": "python/python-original",
  "java": "java/java-original",
  "go": "go/go-original",
  "c++": "cplusplus/cplusplus-original",
  "sql": "azuresqldatabase/azuresqldatabase-original",
  "postgresql": "postgresql/postgresql-original",
  "mysql": "mysql/mysql-original",
  "mongodb": "mongodb/mongodb-original",
  "redis": "redis/redis-original",
  "docker": "docker/docker-original",
  "kubernetes": "kubernetes/kubernetes-plain",
  "helm": "helm/helm-original",
  "aws": "amazonwebservices/amazonwebservices-original-wordmark",
  "azure": "azure/azure-original",
  "tailwind css": "tailwindcss/tailwindcss-original",
  "tailwind": "tailwindcss/tailwindcss-original",
  "react native": "react/react-original",
  "redux toolkit": "redux/redux-original",
  "redux": "redux/redux-original",
  "fastapi": "fastapi/fastapi-original",
  "nestjs": "nestjs/nestjs-plain",
  "grpc": "",
  "websockets": "",
  "github actions": "githubactions/githubactions-original",
  "ci/cd": "",
  "agentic ai": "",
  "llm integrations": "",
  "prompt engineering": "",
  "model context protocol (mcp)": "",
}

function SkillPill({ name }: { name: string }) {
  const key = name.trim().toLowerCase()
  const slug = DEVICON_SLUG[key]
  const iconUrl = slug ? `https://cdn.jsdelivr.net/gh/devicons/devicon/icons/${slug}.svg` : ""
  const [iconOk, setIconOk] = useState(Boolean(iconUrl))
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E8E0D2] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#3F362E] shadow-[0_1px_2px_rgba(31,27,23,0.04)] dark:border-white/10 dark:bg-white/[0.04] dark:text-white/75">
      {iconOk && iconUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={iconUrl} alt="" className="h-3.5 w-3.5" onError={() => setIconOk(false)} />
      ) : (
        <span className="h-1.5 w-1.5 rounded-full bg-[#7C5CFF]" />
      )}
      {name.trim()}
    </span>
  )
}

function SkillsGrid({ section }: { section: SectionWithItems }) {
  const skills = section.items.flatMap((item) =>
    (item.body || item.title)
      .split(/[·•·]|,/g)
      .map((s) => s.trim())
      .filter(Boolean),
  )
  if (skills.length === 0) return null
  return (
    <div className="flex flex-wrap gap-1.5">
      {skills.map((s, i) => (
        <SkillPill key={`${s}-${i}`} name={s} />
      ))}
    </div>
  )
}

// --- Experience / Education row --------------------------------------------
function PersonRow({ item, mode }: { item: ItemRecord; mode: "experience" | "education" }) {
  const meta = (item.meta ?? {}) as ItemMeta
  const [pending, start] = useTransition()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ title: item.title, body: item.body })

  if (editing) return <ItemEditCard item={item} form={form} setForm={setForm} onCancel={() => setEditing(false)} />

  const [primary, secondary] = splitTitle(item.title)
  const headline = mode === "experience" ? meta.company || secondary || primary : meta.school || primary
  const sub = mode === "experience" ? meta.role || primary : meta.degree || secondary
  const logoName = headline
  const dateRange = dateRangeFromMeta(meta)

  return (
    <div className="group flex items-start gap-3 rounded-lg px-1 py-2 transition hover:bg-[#F7F3EB] dark:hover:bg-white/[0.02]">
      <CompanyLogo name={logoName} domain={meta.domain} logoUrl={meta.logo} size={40} />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold leading-5 text-[#1F1B17] dark:text-white">{headline}</p>
            {sub && <p className="truncate text-[12px] font-normal leading-5 text-[#7B7269] dark:text-white/55">{sub}</p>}
            {meta.location && <p className="mt-0.5 text-[11px] font-normal text-[#9A8F84] dark:text-white/40">{meta.location}</p>}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {dateRange && <p className="whitespace-nowrap text-[11px] font-normal text-[#9A8F84] dark:text-white/40">{dateRange}</p>}
            <div className="flex items-center gap-0.5 opacity-0 transition group-hover:opacity-100">
              <button type="button" onClick={() => { setForm({ title: item.title, body: item.body }); setEditing(true) }} className="rounded-md p-1 text-[#7B7269] hover:bg-[#1F1B17]/5 dark:text-white/40" aria-label="Edit item">
                <Pencil size={11} />
              </button>
              <button type="button" onClick={() => start(() => void deleteItem(item.id))} disabled={pending} className="rounded-md p-1 text-[#7B7269] hover:text-red-600 disabled:opacity-50 dark:text-white/40" aria-label="Delete item">
                <Trash2 size={11} />
              </button>
            </div>
          </div>
        </div>
        {item.body && !meta.company && !meta.school && !meta.role && !meta.degree && (
          // Fallback bodies (when meta is missing) sometimes duplicate the title — only show body when meta is rich.
          <p className="mt-1 text-[12px] font-normal leading-5 text-[#5C5249] dark:text-white/55">{item.body}</p>
        )}
        {(meta.company || meta.school || meta.role || meta.degree) && item.body && (
          <p className="mt-1 text-[12px] font-normal leading-5 text-[#5C5249] dark:text-white/55">{item.body}</p>
        )}
        <ProofsArea itemId={item.id} proofs={item.proofs} />
      </div>
    </div>
  )
}

// --- Hackathons / Awards timeline -------------------------------------------
function HackathonTimeline({ items }: { items: ItemRecord[] }) {
  return (
    <div className="relative">
      <div className="absolute bottom-4 left-[19px] top-4 w-px bg-[#E8E0D2] dark:bg-white/10" />
      <div className="space-y-3">
        {items.map((item) => (
          <HackathonRow key={item.id} item={item} />
        ))}
      </div>
    </div>
  )
}
function HackathonRow({ item }: { item: ItemRecord }) {
  const meta = (item.meta ?? {}) as ItemMeta
  const [pending, start] = useTransition()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ title: item.title, body: item.body })
  if (editing) return <div className="ml-12"><ItemEditCard item={item} form={form} setForm={setForm} onCancel={() => setEditing(false)} /></div>

  const dateLabel = meta.date || dateRangeFromMeta(meta) || (meta.place ? `${meta.place} place` : "")
  return (
    <div className="group relative flex gap-3 pl-0">
      <div className="relative z-10">
        <CompanyLogo name={meta.event || item.title} domain={meta.domain} logoUrl={meta.logo} size={40} />
      </div>
      <div className="min-w-0 flex-1 pt-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            {dateLabel && (
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9A8F84] dark:text-white/40">{dateLabel}</p>
            )}
            <p className="text-[13px] font-semibold leading-5 text-[#1F1B17] dark:text-white">{item.title}</p>
            {meta.location && <p className="text-[11px] font-normal text-[#7B7269] dark:text-white/50">{meta.location}</p>}
            {item.body && <p className="mt-1 text-[12px] font-normal leading-5 text-[#5C5249] dark:text-white/55">{item.body}</p>}
            <ProofsArea itemId={item.id} proofs={item.proofs} />
          </div>
          <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition group-hover:opacity-100">
            <button type="button" onClick={() => { setForm({ title: item.title, body: item.body }); setEditing(true) }} className="rounded-md p-1 text-[#7B7269] hover:bg-[#1F1B17]/5 dark:text-white/40" aria-label="Edit item">
              <Pencil size={11} />
            </button>
            <button type="button" onClick={() => start(() => void deleteItem(item.id))} disabled={pending} className="rounded-md p-1 text-[#7B7269] hover:text-red-600 disabled:opacity-50 dark:text-white/40" aria-label="Delete item">
              <Trash2 size={11} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// --- Projects grid ----------------------------------------------------------
function ProjectGrid({ items }: { items: ItemRecord[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <ProjectCard key={item.id} item={item} />
      ))}
    </div>
  )
}
function ProjectCard({ item }: { item: ItemRecord }) {
  const meta = (item.meta ?? {}) as ItemMeta
  const [pending, start] = useTransition()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ title: item.title, body: item.body })
  if (editing) return <ItemEditCard item={item} form={form} setForm={setForm} onCancel={() => setEditing(false)} />

  const website = meta.website || meta.links?.website
  const source = meta.source || meta.links?.source
  const dateRange = dateRangeFromMeta(meta)
  const stack = Array.isArray(meta.stack) ? meta.stack.slice(0, 6) : []
  const [primaryTitle] = splitTitle(item.title)

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-[#E8E0D2] bg-white transition hover:border-[#7C5CFF]/40 hover:shadow-[0_2px_8px_rgba(31,27,23,0.06)] dark:border-white/10 dark:bg-[#0E0E0E]">
      <div className="relative h-28 w-full overflow-hidden bg-gradient-to-br from-[#EEE9FF] via-[#F7F3EB] to-[#FAF7F2] dark:from-[#7C5CFF]/10 dark:via-white/[0.02] dark:to-white/[0.04]">
        {meta.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={meta.image} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7C5CFF]/70">{primaryTitle.slice(0, 24)}</span>
          </div>
        )}
        <div className="absolute right-2 top-2 flex gap-1">
          {website && (
            <a
              href={website}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-md bg-[#1F1B17] px-2 py-1 text-[10px] font-semibold text-white shadow-sm transition hover:bg-black"
            >
              <Globe size={10} /> Website
            </a>
          )}
          {source && (
            <a
              href={source}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-md bg-[#1F1B17] px-2 py-1 text-[10px] font-semibold text-white shadow-sm transition hover:bg-black"
            >
              <Github size={10} /> Source
            </a>
          )}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold leading-5 text-[#1F1B17] dark:text-white">{primaryTitle}</p>
            {dateRange && <p className="text-[11px] font-normal text-[#7B7269] dark:text-white/50">{dateRange}</p>}
          </div>
          <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition group-hover:opacity-100">
            <button type="button" onClick={() => { setForm({ title: item.title, body: item.body }); setEditing(true) }} className="rounded-md p-1 text-[#7B7269] hover:bg-[#1F1B17]/5 dark:text-white/40" aria-label="Edit item">
              <Pencil size={11} />
            </button>
            <button type="button" onClick={() => start(() => void deleteItem(item.id))} disabled={pending} className="rounded-md p-1 text-[#7B7269] hover:text-red-600 disabled:opacity-50 dark:text-white/40" aria-label="Delete item">
              <Trash2 size={11} />
            </button>
          </div>
        </div>
        {item.body && <p className="mt-1 text-[12px] font-normal leading-5 text-[#5C5249] dark:text-white/55">{item.body}</p>}
        {stack.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {stack.map((s) => (
              <span key={s} className="rounded-md bg-[#F7F3EB] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-[#7B7269] dark:bg-white/[0.04] dark:text-white/45">
                {s}
              </span>
            ))}
          </div>
        )}
        <div className="mt-auto pt-2">
          <ProofsArea itemId={item.id} proofs={item.proofs} />
        </div>
      </div>
    </div>
  )
}

// Shared inline edit card for the new layouts
function ItemEditCard({ item, form, setForm, onCancel }: { item: ItemRecord; form: { title: string; body: string }; setForm: (v: { title: string; body: string }) => void; onCancel: () => void }) {
  const [pending, start] = useTransition()
  return (
    <div className="rounded-lg border border-[#E8E0D2] bg-white p-3 dark:border-white/10 dark:bg-[#141414]">
      <EditField label="Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
      <textarea
        value={form.body}
        onChange={(e) => setForm({ ...form, body: e.target.value })}
        rows={2}
        className="mt-2 w-full resize-none rounded-md border border-[#E8E0D2] bg-white px-2.5 py-2 text-[13px] font-normal text-[#1F1B17] outline-none focus:border-[#7C5CFF]/50 dark:border-white/10 dark:bg-[#0c0c0c] dark:text-white"
      />
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={() => start(async () => { const r = await updateItem(item.id, form); if (r.ok) onCancel() })}
          disabled={pending}
          className="inline-flex items-center gap-1 rounded-md bg-[#7C5CFF] px-2.5 py-1 text-[10px] font-semibold text-white shadow-sm disabled:opacity-50"
        >
          {pending ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />} Save
        </button>
        <button type="button" onClick={onCancel} className="rounded-md border border-[#E8E0D2] px-2.5 py-1 text-[10px] font-semibold text-[#7B7269] dark:border-white/10 dark:text-white/50">
          Cancel
        </button>
      </div>
    </div>
  )
}

// --- Events & Gallery --------------------------------------------------------
function GallerySection({ items }: { items: ItemRecord[] }) {
  const allImages = items.flatMap((it) => {
    const meta = (it.meta ?? {}) as ItemMeta & { images?: string[] }
    return (meta.images ?? []).map((src) => ({ src, caption: it.title, item: it }))
  })
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)
  return (
    <div className="space-y-5">
      {items.map((item) => (
        <GalleryGroup
          key={item.id}
          item={item}
          onOpenLightbox={(src) => {
            const idx = allImages.findIndex((g) => g.src === src)
            if (idx >= 0) setLightboxIdx(idx)
          }}
        />
      ))}
      {lightboxIdx !== null && (
        <LightboxViewer
          images={allImages}
          startIndex={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
        />
      )}
    </div>
  )
}

function GalleryGroup({ item, onOpenLightbox }: { item: ItemRecord; onOpenLightbox: (src: string) => void }) {
  const meta = (item.meta ?? {}) as ItemMeta & { images?: string[] }
  const images = meta.images ?? []
  const [pending, start] = useTransition()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ title: item.title, body: item.body })
  if (editing) return <ItemEditCard item={item} form={form} setForm={setForm} onCancel={() => setEditing(false)} />

  const dateLabel = meta.date || dateRangeFromMeta(meta)

  return (
    <div className="group">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-[13px] font-bold tracking-tight text-[#1F1B17] dark:text-white">{item.title}</h3>
            {dateLabel && (
              <span className="rounded-md bg-[#F3EFFF] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-[#6B4EF6] dark:bg-[#7C5CFF]/10 dark:text-[#C9BEFF]">
                {dateLabel}
              </span>
            )}
            {meta.location && (
              <span className="text-[10px] font-medium text-[#9A8F84] dark:text-white/40">· {meta.location}</span>
            )}
          </div>
          {item.body && (
            <p className="mt-1 text-[12px] font-normal leading-5 text-[#5C5249] dark:text-white/55">{item.body}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition group-hover:opacity-100">
          <button type="button" onClick={() => { setForm({ title: item.title, body: item.body }); setEditing(true) }} className="rounded-md p-1 text-[#7B7269] hover:bg-[#1F1B17]/5 dark:text-white/40" aria-label="Edit event">
            <Pencil size={11} />
          </button>
          <button type="button" onClick={() => start(() => void deleteItem(item.id))} disabled={pending} className="rounded-md p-1 text-[#7B7269] hover:text-red-600 disabled:opacity-50 dark:text-white/40" aria-label="Delete event">
            <Trash2 size={11} />
          </button>
        </div>
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 md:grid-cols-5">
          {images.map((src, i) => (
            <button
              key={src + i}
              type="button"
              onClick={() => onOpenLightbox(src)}
              className={cn(
                "group/tile relative overflow-hidden rounded-lg border border-[#E8E0D2] bg-[#FAF7F2] transition hover:border-[#7C5CFF]/40 hover:shadow-[0_2px_10px_rgba(124,92,255,0.18)] dark:border-white/10 dark:bg-white/[0.04]",
                // First image of each group is larger
                i === 0 ? "col-span-2 row-span-2 aspect-square" : "aspect-square",
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={`${item.title} — ${i + 1}`}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-300 group-hover/tile:scale-[1.04]"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent opacity-0 transition group-hover/tile:opacity-100" />
              <div className="pointer-events-none absolute bottom-1 left-1.5 right-1.5 flex items-center justify-between text-[9px] font-semibold text-white opacity-0 transition group-hover/tile:opacity-100">
                <span className="rounded-sm bg-black/40 px-1 py-0.5 backdrop-blur-sm">{i + 1}/{images.length}</span>
              </div>
            </button>
          ))}
        </div>
      )}
      <ProofsArea itemId={item.id} proofs={item.proofs} />
    </div>
  )
}

function LightboxViewer({
  images,
  startIndex,
  onClose,
}: {
  images: { src: string; caption: string }[]
  startIndex: number
  onClose: () => void
}) {
  const [idx, setIdx] = useState(startIndex)
  const current = images[idx]
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
      if (e.key === "ArrowRight") setIdx((i) => (i + 1) % images.length)
      if (e.key === "ArrowLeft") setIdx((i) => (i - 1 + images.length) % images.length)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [images.length, onClose])

  if (!current) return null
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/85 backdrop-blur-md"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onClose() }}
        className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
        aria-label="Close"
      >
        <X size={18} />
      </button>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setIdx((i) => (i - 1 + images.length) % images.length) }}
        className="absolute left-4 top-1/2 -translate-y-1/2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
        aria-label="Previous"
      >
        ‹
      </button>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setIdx((i) => (i + 1) % images.length) }}
        className="absolute right-4 top-1/2 -translate-y-1/2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
        aria-label="Next"
      >
        ›
      </button>
      <div className="relative flex max-h-[90vh] max-w-[92vw] flex-col items-center gap-3" onClick={(e) => e.stopPropagation()}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={current.src} alt={current.caption} className="max-h-[80vh] max-w-full rounded-xl object-contain shadow-2xl" />
        <div className="flex items-center gap-3 text-[12px] font-medium text-white/80">
          <span className="rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
            {idx + 1} / {images.length}
          </span>
          <span>{current.caption}</span>
        </div>
      </div>
    </div>
  )
}

function SectionBody({ section }: { section: SectionWithItems }) {
  if (section.type === "experience") {
    return (
      <div className="space-y-1">
        {section.items.map((item) => (
          <PersonRow key={item.id} item={item} mode="experience" />
        ))}
      </div>
    )
  }
  if (section.type === "education") {
    return (
      <div className="space-y-1">
        {section.items.map((item) => (
          <PersonRow key={item.id} item={item} mode="education" />
        ))}
      </div>
    )
  }
  if (section.type === "skills") {
    return <SkillsGrid section={section} />
  }
  if (section.type === "hackathons") {
    return <HackathonTimeline items={section.items} />
  }
  if (section.type === "projects") {
    return <ProjectGrid items={section.items} />
  }
  if (section.type === "certifications") {
    return <HackathonTimeline items={section.items} />
  }
  if (section.type === "gallery") {
    return <GallerySection items={section.items} />
  }
  return (
    <div className="space-y-2">
      {section.items.map((item) => (
        <ItemRow key={item.id} item={item} />
      ))}
    </div>
  )
}

// --- Section ----------------------------------------------------------------
function SectionCard({ section }: { section: SectionWithItems }) {
  const [pending, start] = useTransition()
  const [adding, setAdding] = useState(false)
  const Icon = SECTION_ICON[section.type] ?? LayoutGrid

  return (
    <section className="overflow-hidden rounded-2xl border border-[#E8E0D2] bg-white p-4 shadow-[0_1px_2px_rgba(31,27,23,0.04)] dark:border-white/10 dark:bg-[#0E0E0E]">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F3EFFF] text-[#6B4EF6] dark:bg-[#7C5CFF]/15 dark:text-[#C9BEFF]">
            <Icon size={15} />
          </div>
          <h2 className="text-[15px] font-bold tracking-tight text-[#1F1B17] dark:text-white">{section.title}</h2>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setAdding((v) => !v)}
            className="inline-flex items-center gap-1 rounded-md border border-[#E8E0D2] bg-white px-2 py-1 text-[10px] font-semibold text-[#7B7269] transition hover:border-[#7C5CFF]/45 hover:text-[#6B4EF6] dark:border-white/10 dark:bg-white/[0.04] dark:text-white/50"
          >
            <Plus size={11} /> Item
          </button>
          <button
            type="button"
            onClick={() => start(() => void deleteSection(section.id))}
            disabled={pending}
            className="inline-flex items-center justify-center rounded-md border border-[#E8E0D2] bg-white p-1.5 text-[#7B7269] transition hover:border-red-300 hover:text-red-600 disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/50"
            aria-label="Delete section"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      <div className="mt-3">
        {section.items.length === 0 && !adding && (
          <p className="rounded-lg border border-dashed border-[#E8E0D2] px-3 py-2.5 text-[11px] font-medium text-[#B7AEA5] dark:border-white/10">
            No items yet — add one, or ask Aristotle to fill this in.
          </p>
        )}
        {section.items.length > 0 && <SectionBody section={section} />}
        {adding && <div className="mt-2"><AddItemForm sectionId={section.id} onDone={() => setAdding(false)} /></div>}
      </div>
    </section>
  )
}

function ItemRow({ item }: { item: SectionWithItems["items"][number] }) {
  const [pending, start] = useTransition()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ title: item.title, body: item.body })

  if (editing) {
    return (
      <div className="rounded-lg border border-[#E8E0D2] bg-white p-3 dark:border-white/10 dark:bg-[#141414]">
        <EditField label="Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
        <textarea
          value={form.body}
          onChange={(e) => setForm({ ...form, body: e.target.value })}
          rows={2}
          className="mt-2 w-full resize-none rounded-md border border-[#E8E0D2] bg-white px-2.5 py-2 text-[13px] font-normal text-[#1F1B17] outline-none focus:border-[#7C5CFF]/50 dark:border-white/10 dark:bg-[#0c0c0c] dark:text-white"
        />
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => start(async () => { const r = await updateItem(item.id, form); if (r.ok) setEditing(false) })}
            disabled={pending}
            className="inline-flex items-center gap-1 rounded-md bg-[#7C5CFF] px-2.5 py-1 text-[10px] font-semibold text-white shadow-sm disabled:opacity-50"
          >
            {pending ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />} Save
          </button>
          <button type="button" onClick={() => setEditing(false)} className="rounded-md border border-[#E8E0D2] px-2.5 py-1 text-[10px] font-semibold text-[#7B7269] dark:border-white/10 dark:text-white/50">
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="group rounded-lg border border-[#EDE5D8] bg-[#FDFBF6] p-3 transition hover:border-[#E8E0D2] hover:bg-white dark:border-white/[0.06] dark:bg-white/[0.02]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {item.title && <p className="text-[13px] font-semibold leading-5 text-[#1F1B17] dark:text-white">{item.title}</p>}
          {item.body && <p className="mt-0.5 text-[12px] font-normal leading-5 text-[#5C5249] dark:text-white/55">{item.body}</p>}
          {Array.isArray((item.meta as { images?: string[] })?.images) && (item.meta as { images?: string[] }).images!.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {(item.meta as { images: string[] }).images.map((src) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={src} src={src} alt="" className="h-16 w-16 rounded-md border border-[#E8E0D2] object-cover dark:border-white/10" />
              ))}
            </div>
          )}
          <ProofsArea itemId={item.id} proofs={item.proofs} />
        </div>
        <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition group-hover:opacity-100">
          <button type="button" onClick={() => { setForm({ title: item.title, body: item.body }); setEditing(true) }} className="rounded-md p-1.5 text-[#7B7269] hover:bg-[#1F1B17]/5 dark:text-white/40" aria-label="Edit item">
            <Pencil size={11} />
          </button>
          <button type="button" onClick={() => start(() => void deleteItem(item.id))} disabled={pending} className="rounded-md p-1.5 text-[#7B7269] hover:text-red-600 disabled:opacity-50 dark:text-white/40" aria-label="Delete item">
            <Trash2 size={11} />
          </button>
        </div>
      </div>
    </div>
  )
}

const PROOF_KIND_OPTIONS = [
  { kind: "github", label: "GitHub repo", placeholder: "github.com/user/repo" },
  { kind: "doi", label: "Research / DOI", placeholder: "https://doi.org/10.… or paper URL" },
  { kind: "link", label: "Link", placeholder: "https://…" },
]

function proofSummary(proof: ProofRow): string | null {
  const e = (proof.extracted ?? {}) as Record<string, unknown>
  const s = (k: string) => (typeof e[k] === "string" && e[k] ? (e[k] as string) : null)
  if (proof.kind === "github" && (e.stars !== undefined || e.full_name)) {
    return [s("full_name"), e.language ? String(e.language) : null, e.stars !== undefined ? `★ ${e.stars}` : null].filter(Boolean).join(" · ")
  }
  if (proof.kind === "doi") return s("title")
  if (proof.kind === "image") return s("document_type") || s("event")
  return s("title") || s("reason")
}

function ProofsArea({ itemId, proofs }: { itemId: string; proofs: ProofRow[] }) {
  const [adding, setAdding] = useState(false)
  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex flex-wrap items-center gap-1">
        {proofs.map((proof) => (
          <ProofChip key={proof.id} proof={proof} />
        ))}
        <button
          type="button"
          onClick={() => setAdding((v) => !v)}
          className="inline-flex items-center gap-0.5 rounded-md border border-dashed border-[#E8E0D2] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-[#B7AEA5] transition hover:border-[#7C5CFF]/45 hover:text-[#6B4EF6] dark:border-white/15"
        >
          <Plus size={10} /> Proof
        </button>
      </div>
      {adding && <AddProofForm itemId={itemId} onDone={() => setAdding(false)} />}
    </div>
  )
}

function ProofChip({ proof }: { proof: ProofRow }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [error, setError] = useState("")
  const tone =
    proof.status === "verified"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300"
      : proof.status === "partial"
        ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-300"
        : "border-[#E8E0D2] bg-white text-[#7B7269] dark:border-white/10 dark:bg-white/[0.04] dark:text-white/50"
  const summary = proofSummary(proof)
  const Icon = proof.kind === "github" ? Code2 : proof.kind === "image" ? ImagePlus : proof.kind === "doi" ? FileText : Link2

  return (
    <span
      className={cn("group/proof inline-flex max-w-full items-center gap-1 rounded-md border px-1.5 py-0.5 text-[9px] font-semibold", tone)}
      title={summary ? `${proof.kind}: ${summary}` : proof.url ?? proof.kind}
    >
      <Icon size={10} className="shrink-0" />
      <span className="truncate uppercase tracking-wider">
        {proof.kind} · {proof.status}
        {summary ? <span className="ml-1 normal-case opacity-80">· {summary}</span> : null}
      </span>
      {proof.status === "verified" ? (
        <BadgeCheck size={11} className="shrink-0" />
      ) : (
        <button
          type="button"
          onClick={() =>
            start(async () => {
              setError("")
              const result = await verifyProofAction(proof.id)
              if (!result.ok) setError(result.error ?? "Verification failed")
              router.refresh()
            })
          }
          disabled={pending}
          className="shrink-0 rounded-sm px-0.5 uppercase tracking-wider hover:underline disabled:opacity-50"
        >
          {pending ? <Loader2 size={10} className="animate-spin" /> : "Verify"}
        </button>
      )}
      <button
        type="button"
        onClick={() =>
          start(async () => {
            setError("")
            const result = await deleteProof(proof.id)
            if (!result.ok) setError(result.error ?? "Could not remove proof")
            router.refresh()
          })
        }
        disabled={pending}
        className="shrink-0 opacity-0 transition group-hover/proof:opacity-100"
        aria-label="Remove proof"
      >
        <X size={10} />
      </button>
      {error && <span className="sr-only" role="alert">{error}</span>}
    </span>
  )
}

function AddProofForm({ itemId, onDone }: { itemId: string; onDone: () => void }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [kind, setKind] = useState(PROOF_KIND_OPTIONS[0].kind)
  const [url, setUrl] = useState("")
  const [error, setError] = useState("")
  const active = PROOF_KIND_OPTIONS.find((o) => o.kind === kind) ?? PROOF_KIND_OPTIONS[0]

  return (
    <div className="rounded-lg border border-[#7C5CFF]/25 bg-[#F8F5FF] p-2 dark:border-[#7C5CFF]/20 dark:bg-[#7C5CFF]/[0.06]">
      <div className="flex flex-wrap gap-1">
        {PROOF_KIND_OPTIONS.map((o) => (
          <button
            key={o.kind}
            type="button"
            onClick={() => setKind(o.kind)}
            className={cn(
              "rounded-md border px-2 py-0.5 text-[10px] font-semibold transition",
              kind === o.kind
                ? "border-[#7C5CFF] bg-[#F3EFFF] text-[#6B4EF6] dark:border-[#7C5CFF]/50 dark:bg-[#7C5CFF]/15 dark:text-[#C9BEFF]"
                : "border-[#E8E0D2] text-[#7B7269] hover:border-[#7C5CFF]/40 dark:border-white/10 dark:text-white/50",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-2">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder={active.placeholder}
          className="h-7 flex-1 rounded-md border border-[#E8E0D2] bg-white px-2.5 text-[11px] font-normal text-[#1F1B17] outline-none focus:border-[#7C5CFF]/50 dark:border-white/10 dark:bg-[#0c0c0c] dark:text-white"
        />
        <button
          type="button"
          disabled={pending || !url.trim()}
          onClick={() =>
            start(async () => {
              setError("")
              const result = await addProof({ itemId, kind, url })
              if (result.ok) {
                router.refresh()
                onDone()
              } else {
                setError(result.error ?? "Could not add proof")
              }
            })
          }
          className="inline-flex items-center gap-1 rounded-md bg-[#7C5CFF] px-2 py-1 text-[10px] font-semibold text-white shadow-sm disabled:opacity-50"
        >
          {pending ? <Loader2 size={11} className="animate-spin" /> : <Plus size={11} />} Add
        </button>
        <button type="button" onClick={onDone} className="rounded-md border border-[#E8E0D2] p-1 text-[#7B7269] dark:border-white/10 dark:text-white/50">
          <X size={11} />
        </button>
      </div>
      {error && <p className="mt-1 text-[10px] font-medium text-red-600" role="alert">{error}</p>}
    </div>
  )
}

// --- Add forms --------------------------------------------------------------
function AddItemForm({ sectionId, onDone }: { sectionId: string; onDone: () => void }) {
  const [pending, start] = useTransition()
  const [form, setForm] = useState({ title: "", body: "" })
  return (
    <div className="rounded-lg border border-[#7C5CFF]/25 bg-[#F8F5FF] p-3 dark:border-[#7C5CFF]/20 dark:bg-[#7C5CFF]/[0.06]">
      <EditField label="Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} placeholder="e.g. B.E. Computer Science" />
      <textarea
        value={form.body}
        onChange={(e) => setForm({ ...form, body: e.target.value })}
        rows={2}
        placeholder="Details — dates, description, etc."
        className="mt-2 w-full resize-none rounded-md border border-[#E8E0D2] bg-white px-2.5 py-2 text-[13px] font-normal text-[#1F1B17] outline-none focus:border-[#7C5CFF]/50 dark:border-white/10 dark:bg-[#0c0c0c] dark:text-white"
      />
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          disabled={pending || (!form.title.trim() && !form.body.trim())}
          onClick={() => start(async () => { const r = await addItem({ sectionId, ...form }); if (r.ok) onDone() })}
          className="inline-flex items-center gap-1 rounded-md bg-[#7C5CFF] px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-sm disabled:opacity-50"
        >
          {pending ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />} Add
        </button>
        <button type="button" onClick={onDone} className="rounded-md border border-[#E8E0D2] px-2.5 py-1.5 text-[11px] font-semibold text-[#7B7269] dark:border-white/10 dark:text-white/50">
          Cancel
        </button>
      </div>
    </div>
  )
}

function AddSectionForm() {
  const [pending, start] = useTransition()
  const [open, setOpen] = useState(false)
  const [type, setType] = useState(SECTION_PRESETS[0].type)
  const [title, setTitle] = useState(SECTION_PRESETS[0].title)

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-2xl border border-dashed border-[#E3DACD] py-3 text-[13px] font-semibold text-[#7B7269] transition hover:border-[#7C5CFF]/45 hover:bg-[#F8F5FF]/40 hover:text-[#6B4EF6] dark:border-white/10 dark:text-white/45"
      >
        <Plus size={14} /> Add a section
      </button>
    )
  }

  return (
    <div className="mt-4 rounded-2xl border border-[#7C5CFF]/25 bg-[#F8F5FF] p-4 dark:border-[#7C5CFF]/20 dark:bg-[#7C5CFF]/[0.06]">
      <div className="flex flex-wrap gap-1.5">
        {SECTION_PRESETS.map((preset) => (
          <button
            key={preset.type}
            type="button"
            onClick={() => { setType(preset.type); setTitle(preset.title) }}
            className={cn(
              "rounded-md border px-2.5 py-1 text-[11px] font-semibold transition",
              type === preset.type
                ? "border-[#7C5CFF] bg-[#F3EFFF] text-[#6B4EF6] dark:border-[#7C5CFF]/50 dark:bg-[#7C5CFF]/15 dark:text-[#C9BEFF]"
                : "border-[#E8E0D2] bg-white text-[#7B7269] hover:border-[#7C5CFF]/40 dark:border-white/10 dark:text-white/50"
            )}
          >
            {preset.title}
          </button>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Section title"
          className="h-9 flex-1 rounded-lg border border-[#E8E0D2] bg-white px-3 text-[13px] font-normal text-[#1F1B17] outline-none focus:border-[#7C5CFF]/50 dark:border-white/10 dark:bg-[#141414] dark:text-white"
        />
        <button
          type="button"
          disabled={pending || !title.trim()}
          onClick={() => start(async () => { const r = await addSection({ type, title }); if (r.ok) { setOpen(false) } })}
          className="inline-flex items-center gap-1 rounded-lg bg-[#7C5CFF] px-3.5 py-2 text-[11px] font-semibold text-white shadow-sm transition hover:bg-[#684AF0] disabled:opacity-50"
        >
          {pending ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} Add
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-[#E8E0D2] px-2.5 py-2 text-[11px] font-semibold text-[#7B7269] dark:border-white/10 dark:text-white/50">
          <X size={12} />
        </button>
      </div>
    </div>
  )
}

function EditField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[#7B7269] dark:text-white/45">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-9 w-full rounded-lg border border-[#E8E0D2] bg-white px-3 text-[13px] font-normal text-[#1F1B17] outline-none focus:border-[#7C5CFF]/50 focus:ring-2 focus:ring-[#7C5CFF]/15 dark:border-white/10 dark:bg-[#141414] dark:text-white"
      />
    </label>
  )
}

// --- Aristotle panel (real AI chat that edits the profile) ------------------
type ChatTurn = { role: "user" | "assistant"; content: string; attachments?: { url: string; name: string; type: string }[] }
type PendingAttachment = { url: string; name: string; type: string; uploading?: boolean }

function AristotlePanel({ profile, initialChat }: { profile: FullProfile; initialChat: ChatMessageRow[] }) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [messages, setMessages] = useState<ChatTurn[]>(
    initialChat.map((m) => ({
      role: m.role,
      content: m.content,
      attachments: (m.attachments as ChatTurn["attachments"]) ?? [],
    })),
  )
  const [input, setInput] = useState("")
  const [attachments, setAttachments] = useState<PendingAttachment[]>([])
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingIdx, setEditingIdx] = useState<number | null>(null)
  const [editText, setEditText] = useState("")

  const hasHistory = messages.length > 0

  function scrollToBottom() {
    requestAnimationFrame(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    })
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    setError(null)
    const supabase = createClient()
    for (const file of Array.from(files).slice(0, 6)) {
      const placeholder: PendingAttachment = { url: "", name: file.name, type: file.type, uploading: true }
      setAttachments((prev) => [...prev, placeholder])
      const path = `${profile.id}/chat/${Date.now()}-${file.name.replace(/[^\w.\-]/g, "_")}`
      const { error: upErr } = await supabase.storage.from("profile-media").upload(path, file, { upsert: true })
      if (upErr) {
        setError(`Upload failed: ${upErr.message}`)
        setAttachments((prev) => prev.filter((a) => a !== placeholder))
        continue
      }
      const { data } = supabase.storage.from("profile-media").getPublicUrl(path)
      setAttachments((prev) => prev.map((a) => (a === placeholder ? { url: data.publicUrl, name: file.name, type: file.type } : a)))
    }
  }

  async function send(text: string) {
    const message = text.trim()
    const ready = attachments.filter((a) => a.url && !a.uploading)
    if ((!message && ready.length === 0) || sending) return

    setSending(true)
    setError(null)
    const sentAttachments = ready.map(({ url, name, type }) => ({ url, name, type }))
    setMessages((prev) => [...prev, { role: "user", content: message, attachments: sentAttachments }])
    setInput("")
    setAttachments([])
    scrollToBottom()

    try {
      const res = await fetch("/api/student/aristotle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, attachments: sentAttachments }),
      })
      const data = await res.json()
      const reply = data.reply ?? data.error ?? "Something went wrong."
      setMessages((prev) => [...prev, { role: "assistant", content: reply }])
      scrollToBottom()
      if (data.applied > 0) router.refresh()
    } catch (err) {
      setMessages((prev) => [...prev, { role: "assistant", content: "Network error — please try again." }])
      setError(err instanceof Error ? err.message : "Network error")
    } finally {
      setSending(false)
    }
  }

  async function sendEdit(idx: number, newText: string) {
    const trimmed = newText.trim()
    if (!trimmed || sending) return
    setMessages((prev) => prev.slice(0, idx))
    setEditingIdx(null)
    setEditText("")
    await send(trimmed)
  }

  return (
    <aside className="relative flex h-full w-[34%] min-w-[300px] max-w-[440px] shrink-0 flex-col border-r border-[#E8E0D2] bg-[#FAF7F2] px-5 py-5 dark:border-white/[0.06] dark:bg-[#0A0A0A]">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(232,224,210,0.25)_1px,transparent_1px),linear-gradient(to_bottom,rgba(232,224,210,0.25)_1px,transparent_1px)] bg-[size:28px_28px] dark:opacity-10" />

      <div className="relative shrink-0">
        <div className="flex items-center gap-1.5">
          <Sparkles size={11} className="text-[#7C5CFF]" />
          <p className="text-[9px] font-semibold uppercase tracking-[0.24em] text-[#7C5CFF]">Aristotle</p>
        </div>
        <h1 className="mt-1.5 text-[17px] font-bold leading-tight tracking-tight text-[#1F1B17] dark:text-white">
          Hi {profile.full_name?.split(" ")[0] || "there"} — let&apos;s build your profile.
        </h1>
      </div>

      {/* Conversation */}
      <div ref={scrollRef} className="relative mt-4 flex-1 space-y-2.5 overflow-y-auto pr-1">
        {!hasHistory && (
          <div className="space-y-3">
            <p className="text-[12px] font-normal leading-5 text-[#7B7269] dark:text-white/50">
              Tell me what to add — drop your resume (PDF/DOCX/MD/TXT), paste a GitHub link, attach event photos or
              certificates, and I&apos;ll read them and build the right sections with proof.
            </p>
            <div className="flex flex-col gap-1.5">
              {QUICK_COMMANDS.map((cmd) => (
                <button
                  key={cmd}
                  type="button"
                  disabled={sending}
                  onClick={() => send(cmd)}
                  className="rounded-lg border border-[#E8E0D2] bg-white px-2.5 py-2 text-left text-[11px] font-medium text-[#5C5249] transition hover:border-[#7C5CFF]/45 hover:bg-[#F8F5FF]/50 hover:text-[#6B4EF6] disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/55"
                >
                  {cmd}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={cn("group/msg flex items-end gap-1", m.role === "user" ? "justify-end" : "justify-start")}>
            {m.role === "user" && editingIdx !== i && (
              <button
                type="button"
                onClick={() => { setEditingIdx(i); setEditText(m.content) }}
                title="Edit message"
                className="mb-1 shrink-0 rounded-md p-1 text-[#A89D91] opacity-0 transition hover:bg-[#1F1B17]/5 hover:text-[#6B4EF6] group-hover/msg:opacity-100 dark:text-white/30 dark:hover:bg-white/5 dark:hover:text-[#C9BEFF]"
              >
                <Pencil size={11} />
              </button>
            )}
            {editingIdx === i ? (
              <div className="w-full max-w-[92%]">
                <textarea
                  value={editText}
                  autoFocus
                  rows={3}
                  onChange={(e) => setEditText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void sendEdit(i, editText) }
                    if (e.key === "Escape") { setEditingIdx(null); setEditText("") }
                  }}
                  className="w-full resize-none rounded-xl border border-[#7C5CFF]/40 bg-white px-3 py-2 text-[12px] font-normal text-[#1F1B17] outline-none focus:border-[#7C5CFF]/70 focus:ring-2 focus:ring-[#7C5CFF]/10 dark:bg-[#141414] dark:text-white"
                />
                <div className="mt-1.5 flex justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => { setEditingIdx(null); setEditText("") }}
                    className="rounded-md px-2.5 py-1 text-[10px] font-semibold text-[#7B7269] transition hover:bg-[#1F1B17]/5 dark:text-white/50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => void sendEdit(i, editText)}
                    disabled={!editText.trim() || sending}
                    className="rounded-md bg-[#7C5CFF] px-2.5 py-1 text-[10px] font-semibold text-white shadow-sm transition hover:bg-[#684AF0] disabled:opacity-50"
                  >
                    Send
                  </button>
                </div>
              </div>
            ) : (
              <div
                className={cn(
                  "max-w-[88%] rounded-2xl px-3 py-2 text-[12px] font-normal leading-5",
                  m.role === "user"
                    ? "bg-[#7C5CFF] text-white shadow-sm"
                    : "border border-[#E8E0D2] bg-white text-[#1F1B17] dark:border-white/10 dark:bg-[#141414] dark:text-white",
                )}
              >
                {m.content}
                {m.attachments && m.attachments.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {m.attachments.map((a) =>
                      a.type.startsWith("image/") ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={a.url} src={a.url} alt={a.name} className="h-10 w-10 rounded-md object-cover" />
                      ) : (
                        <span key={a.url} className="rounded-md bg-black/10 px-1.5 py-0.5 text-[9px] font-semibold">{a.name}</span>
                      ),
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {sending && (
          <div className="flex justify-start">
            <div className="inline-flex items-center gap-1.5 rounded-2xl border border-[#E8E0D2] bg-white px-3 py-2 text-[12px] font-medium text-[#7B7269] dark:border-white/10 dark:bg-[#141414] dark:text-white/55">
              <Loader2 size={12} className="animate-spin text-[#7C5CFF]" /> Aristotle is working…
            </div>
          </div>
        )}
      </div>

      {error && <p className="relative mt-2 shrink-0 text-[11px] font-medium text-red-600 dark:text-red-400">{error}</p>}

      {/* Attachment previews */}
      {attachments.length > 0 && (
        <div className="relative mt-2.5 flex shrink-0 flex-wrap gap-1.5">
          {attachments.map((a, i) => {
            const isImg = a.type.startsWith("image/")
            const shortName = a.name.length > 22 ? `${a.name.slice(0, 19)}…` : a.name
            return (
              <div key={i} className="relative">
                {isImg && a.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.url} alt={a.name} className="h-11 w-11 rounded-lg border border-[#E8E0D2] object-cover dark:border-white/10" />
                ) : (
                  <div
                    title={a.name}
                    className="flex h-11 max-w-[160px] items-center gap-1.5 rounded-lg border border-[#E8E0D2] bg-white px-2 text-[10px] font-semibold text-[#5C5249] dark:border-white/10 dark:bg-white/[0.04] dark:text-white/65"
                  >
                    {a.uploading ? <Loader2 size={14} className="animate-spin shrink-0" /> : <FileText size={14} className="shrink-0 text-[#7C5CFF]" />}
                    <span className="truncate">{shortName}</span>
                  </div>
                )}
                {a.uploading && isImg && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/30">
                    <Loader2 size={14} className="animate-spin text-white" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setAttachments((prev) => prev.filter((_, idx) => idx !== i))}
                  className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#1F1B17] text-white shadow"
                  aria-label="Remove attachment"
                >
                  <X size={9} />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Composer */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          void send(input)
        }}
        className="relative mt-3 shrink-0"
      >
        <div className="relative rounded-2xl border border-[#E8E0D2] bg-white shadow-[0_1px_2px_rgba(31,27,23,0.04)] transition focus-within:border-[#7C5CFF]/50 focus-within:shadow-[0_0_0_3px_rgba(124,92,255,0.08)] dark:border-white/10 dark:bg-[#141414]">
          <input
            ref={fileRef}
            type="file"
            accept="image/*,.pdf,.docx,.md,.markdown,.txt,.rtf,.csv,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/markdown,text/plain,text/csv"
            multiple
            hidden
            onChange={(e) => {
              void handleFiles(e.target.files)
              e.target.value = ""
            }}
          />
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                void send(input)
              }
            }}
            disabled={sending}
            rows={2}
            placeholder="Ask Aristotle to add or update a section…"
            className="block w-full resize-none rounded-t-2xl bg-transparent px-3 pt-2.5 text-[12px] font-normal text-[#1F1B17] outline-none placeholder:text-[#B7AEA5] disabled:opacity-50 dark:text-white dark:placeholder:text-white/30"
          />
          <div className="flex items-center justify-between px-2 pb-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={sending}
              className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[10px] font-semibold text-[#7B7269] transition hover:bg-[#1F1B17]/5 hover:text-[#6B4EF6] disabled:opacity-50 dark:text-white/45 dark:hover:bg-white/5"
            >
              <Paperclip size={13} /> Attach (image, PDF, DOCX, MD, TXT)
            </button>
            <button
              type="submit"
              disabled={sending || (!input.trim() && attachments.filter((a) => a.url).length === 0)}
              className="inline-flex h-7 items-center gap-1 rounded-md bg-[#7C5CFF] px-2.5 text-[10px] font-semibold uppercase tracking-wider text-white shadow-sm transition hover:bg-[#684AF0] disabled:bg-[#E3DACD] disabled:shadow-none dark:disabled:bg-white/10"
            >
              {sending ? <Loader2 size={11} className="animate-spin" /> : <>Send <ArrowUp size={11} /></>}
            </button>
          </div>
        </div>
      </form>
    </aside>
  )
}
