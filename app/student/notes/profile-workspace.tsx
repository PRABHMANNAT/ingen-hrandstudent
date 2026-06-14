"use client"

import React, { useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowUp,
  BadgeCheck,
  Briefcase,
  Check,
  Code2,
  FileText,
  GraduationCap,
  HeartHandshake,
  ImagePlus,
  LayoutGrid,
  Loader2,
  LogOut,
  Paperclip,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  Trophy,
  X,
} from "lucide-react"
import type { ChatMessageRow, FullProfile, ProofRow, SectionWithItems } from "@/lib/supabase/types"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import {
  addItem,
  addSection,
  deleteItem,
  deleteSection,
  signOutAction,
  updateHeader,
  updateItem,
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
}: {
  profile: FullProfile
  initialChat: ChatMessageRow[]
}) {
  return (
    <main className="flex h-full min-w-0 flex-1 overflow-hidden bg-[#F5F1EA] text-[#251F1A] dark:bg-[#050505] dark:text-white">
      <AristotlePanel profile={profile} initialChat={initialChat} />

      <section className="relative h-full min-w-0 flex-1 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(36,31,24,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(36,31,24,0.035)_1px,transparent_1px)] bg-[size:38px_38px] dark:bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)]" />

        <div className="relative h-full overflow-y-auto px-8 py-8">
          <div className="mx-auto w-full max-w-[920px] pb-16">
            <Toolbar profile={profile} />
            <HeaderBlock profile={profile} />

            <div className="mt-6 flex flex-col gap-5">
              {profile.sections.map((section) => (
                <SectionCard key={section.id} section={section} />
              ))}
            </div>

            <AddSectionForm />
          </div>
        </div>
      </section>
    </main>
  )
}

// --- Toolbar ----------------------------------------------------------------
function Toolbar({ profile }: { profile: FullProfile }) {
  const [pending, start] = useTransition()
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-xs font-bold text-[#756B63] dark:text-white/50">
        <Check size={14} className="text-emerald-600" />
        Signed in as <span className="text-[#251F1A] dark:text-white">{profile.full_name || profile.email}</span>
        <span className="rounded-full bg-[#EEE9FF] px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-[#6B4EF6] dark:bg-[#7C5CFF]/15 dark:text-[#C9BEFF]">
          {profile.role}
        </span>
      </div>
      <button
        type="button"
        onClick={() => start(() => void signOutAction())}
        disabled={pending}
        className="inline-flex items-center gap-1.5 rounded-full border border-[#DED4C7] bg-[#FFFDF8]/80 px-3 py-1.5 text-[11px] font-black text-[#756B63] transition hover:border-red-300 hover:text-red-600 disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/50"
      >
        {pending ? <Loader2 size={13} className="animate-spin" /> : <LogOut size={13} />}
        Sign out
      </button>
    </div>
  )
}

// --- Fixed header block -----------------------------------------------------
function HeaderBlock({ profile }: { profile: FullProfile }) {
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

  return (
    <section className="mt-5 overflow-hidden rounded-[28px] border border-[#DED4C7]/70 bg-[#FFFDF8]/92 p-6 shadow-[0_20px_52px_rgba(42,37,32,0.08)] dark:border-white/10 dark:bg-[#101010]/92">
      <div className="flex items-start gap-5">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-[#7C5CFF] to-[#6B4EF6] text-2xl font-black text-white shadow-lg">
          {profile.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.avatar_url} alt={profile.full_name} className="h-full w-full object-cover" />
          ) : (
            initials(profile.full_name)
          )}
        </div>

        <div className="min-w-0 flex-1">
          {!editing ? (
            <>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h1 className="truncate text-2xl font-black tracking-[-0.04em] text-[#251F1A] dark:text-white">
                    {profile.full_name || "Your name"}
                  </h1>
                  <p className="mt-1 text-sm font-bold text-[#756B63] dark:text-white/55">
                    {profile.headline || "Add a headline — your role focus in one line"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={beginEdit}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#DED4C7] bg-[#FFFDF8] px-3 py-1.5 text-[11px] font-black text-[#756B63] transition hover:border-[#7C5CFF]/45 hover:text-[#6B4EF6] dark:border-white/10 dark:bg-white/[0.04] dark:text-white/50"
                >
                  <Pencil size={12} /> Edit
                </button>
              </div>

              {profile.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {profile.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-[#DED4C7] bg-[#FFFDF8] px-2.5 py-1 text-[11px] font-black text-[#756B63] dark:border-white/10 dark:bg-white/[0.04] dark:text-white/55"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {profile.about && (
                <p className="mt-3 text-sm font-semibold leading-6 text-[#5C534B] dark:text-white/60">{profile.about}</p>
              )}
            </>
          ) : (
            <div className="space-y-3">
              <EditField label="Full name" value={form.full_name} onChange={(v) => setForm({ ...form, full_name: v })} />
              <EditField label="Headline" value={form.headline} onChange={(v) => setForm({ ...form, headline: v })} placeholder="Backend Engineer · Distributed Systems" />
              <EditField label="Target role" value={form.target_role} onChange={(v) => setForm({ ...form, target_role: v })} placeholder="Backend Engineer" />
              <EditField label="Tags (comma separated)" value={form.tags} onChange={(v) => setForm({ ...form, tags: v })} placeholder="Java, Spring Boot, PostgreSQL" />
              <div>
                <span className="mb-1.5 block text-[11px] font-black uppercase tracking-[0.14em] text-[#756B63] dark:text-white/45">About</span>
                <textarea
                  value={form.about}
                  onChange={(e) => setForm({ ...form, about: e.target.value })}
                  rows={3}
                  placeholder="A short note about you."
                  className="w-full resize-none rounded-2xl border border-[#DED4C7] bg-[#FFFDF8] px-4 py-3 text-sm font-semibold text-[#251F1A] outline-none focus:border-[#7C5CFF]/50 focus:ring-2 focus:ring-[#7C5CFF]/15 dark:border-white/10 dark:bg-[#141414] dark:text-white"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={save}
                  disabled={pending}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#7C5CFF] px-4 py-2 text-xs font-black text-white shadow-[0_10px_22px_rgba(124,92,255,0.28)] transition hover:bg-[#684AF0] disabled:opacity-50"
                >
                  {pending ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Save
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  disabled={pending}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#DED4C7] px-4 py-2 text-xs font-black text-[#756B63] transition hover:bg-[#241f18]/5 disabled:opacity-50 dark:border-white/10 dark:text-white/50"
                >
                  <X size={13} /> Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

// --- Section ----------------------------------------------------------------
function SectionCard({ section }: { section: SectionWithItems }) {
  const [pending, start] = useTransition()
  const [adding, setAdding] = useState(false)
  const Icon = SECTION_ICON[section.type] ?? LayoutGrid

  return (
    <section className="overflow-hidden rounded-[28px] border border-[#DED4C7]/70 bg-[#FFFDF8]/92 p-5 shadow-[0_20px_52px_rgba(42,37,32,0.08)] dark:border-white/10 dark:bg-[#101010]/92">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EEE9FF] text-[#6B4EF6] dark:bg-[#7C5CFF]/15 dark:text-[#C9BEFF]">
            <Icon size={17} />
          </div>
          <h2 className="text-lg font-black tracking-[-0.03em] text-[#251F1A] dark:text-white">{section.title}</h2>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setAdding((v) => !v)}
            className="inline-flex items-center gap-1 rounded-full border border-[#DED4C7] bg-[#FFFDF8] px-2.5 py-1.5 text-[11px] font-black text-[#756B63] transition hover:border-[#7C5CFF]/45 hover:text-[#6B4EF6] dark:border-white/10 dark:bg-white/[0.04] dark:text-white/50"
          >
            <Plus size={12} /> Item
          </button>
          <button
            type="button"
            onClick={() => start(() => void deleteSection(section.id))}
            disabled={pending}
            className="inline-flex items-center justify-center rounded-full border border-[#DED4C7] bg-[#FFFDF8] p-1.5 text-[#756B63] transition hover:border-red-300 hover:text-red-600 disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/50"
            aria-label="Delete section"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {section.items.length === 0 && !adding && (
          <p className="rounded-2xl border border-dashed border-[#DED4C7] px-4 py-3 text-xs font-bold text-[#B7AEA5] dark:border-white/10">
            No items yet — add one, or ask Aristotle to fill this in.
          </p>
        )}
        {section.items.map((item) => (
          <ItemRow key={item.id} item={item} />
        ))}
        {adding && <AddItemForm sectionId={section.id} onDone={() => setAdding(false)} />}
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
      <div className="rounded-2xl border border-[#DED4C7] bg-[#FFFDF8] p-3 dark:border-white/10 dark:bg-[#141414]">
        <EditField label="Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
        <textarea
          value={form.body}
          onChange={(e) => setForm({ ...form, body: e.target.value })}
          rows={2}
          className="mt-2 w-full resize-none rounded-xl border border-[#DED4C7] bg-white px-3 py-2 text-sm font-semibold text-[#251F1A] outline-none focus:border-[#7C5CFF]/50 dark:border-white/10 dark:bg-[#0c0c0c] dark:text-white"
        />
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => start(async () => { const r = await updateItem(item.id, form); if (r.ok) setEditing(false) })}
            disabled={pending}
            className="inline-flex items-center gap-1 rounded-full bg-[#7C5CFF] px-3 py-1.5 text-[11px] font-black text-white disabled:opacity-50"
          >
            {pending ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} Save
          </button>
          <button type="button" onClick={() => setEditing(false)} className="rounded-full border border-[#DED4C7] px-3 py-1.5 text-[11px] font-black text-[#756B63] dark:border-white/10 dark:text-white/50">
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="group rounded-2xl border border-[#DED4C7]/60 bg-[#FFFDF8] p-3.5 dark:border-white/[0.06] dark:bg-white/[0.02]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {item.title && <p className="text-sm font-black text-[#251F1A] dark:text-white">{item.title}</p>}
          {item.body && <p className="mt-0.5 text-sm font-semibold leading-6 text-[#5C534B] dark:text-white/55">{item.body}</p>}
          {Array.isArray((item.meta as { images?: string[] })?.images) && (item.meta as { images?: string[] }).images!.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {(item.meta as { images: string[] }).images.map((src) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={src} src={src} alt="" className="h-20 w-20 rounded-xl border border-[#DED4C7] object-cover dark:border-white/10" />
              ))}
            </div>
          )}
          {item.proofs.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {item.proofs.map((proof) => (
                <ProofBadge key={proof.id} proof={proof} />
              ))}
            </div>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1 opacity-0 transition group-hover:opacity-100">
          <button type="button" onClick={() => { setForm({ title: item.title, body: item.body }); setEditing(true) }} className="rounded-full p-1.5 text-[#756B63] hover:bg-[#241f18]/5 dark:text-white/40" aria-label="Edit item">
            <Pencil size={12} />
          </button>
          <button type="button" onClick={() => start(() => void deleteItem(item.id))} disabled={pending} className="rounded-full p-1.5 text-[#756B63] hover:text-red-600 disabled:opacity-50 dark:text-white/40" aria-label="Delete item">
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    </div>
  )
}

function ProofBadge({ proof }: { proof: ProofRow }) {
  const tone =
    proof.status === "verified"
      ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300"
      : proof.status === "partial"
        ? "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-300"
        : "border-[#DED4C7] bg-[#FFFDF8] text-[#756B63] dark:border-white/10 dark:bg-white/[0.04] dark:text-white/50"
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-wide", tone)}>
      <BadgeCheck size={11} /> {proof.kind} · {proof.status}
    </span>
  )
}

// --- Add forms --------------------------------------------------------------
function AddItemForm({ sectionId, onDone }: { sectionId: string; onDone: () => void }) {
  const [pending, start] = useTransition()
  const [form, setForm] = useState({ title: "", body: "" })
  return (
    <div className="rounded-2xl border border-[#7C5CFF]/30 bg-[#F8F5FF] p-3 dark:border-[#7C5CFF]/20 dark:bg-[#7C5CFF]/[0.06]">
      <EditField label="Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} placeholder="e.g. B.E. Computer Science" />
      <textarea
        value={form.body}
        onChange={(e) => setForm({ ...form, body: e.target.value })}
        rows={2}
        placeholder="Details — dates, description, etc."
        className="mt-2 w-full resize-none rounded-xl border border-[#DED4C7] bg-white px-3 py-2 text-sm font-semibold text-[#251F1A] outline-none focus:border-[#7C5CFF]/50 dark:border-white/10 dark:bg-[#0c0c0c] dark:text-white"
      />
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          disabled={pending || (!form.title.trim() && !form.body.trim())}
          onClick={() => start(async () => { const r = await addItem({ sectionId, ...form }); if (r.ok) onDone() })}
          className="inline-flex items-center gap-1 rounded-full bg-[#7C5CFF] px-3 py-1.5 text-[11px] font-black text-white disabled:opacity-50"
        >
          {pending ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />} Add
        </button>
        <button type="button" onClick={onDone} className="rounded-full border border-[#DED4C7] px-3 py-1.5 text-[11px] font-black text-[#756B63] dark:border-white/10 dark:text-white/50">
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
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-[24px] border-2 border-dashed border-[#DED4C7] py-4 text-sm font-black text-[#756B63] transition hover:border-[#7C5CFF]/45 hover:text-[#6B4EF6] dark:border-white/10 dark:text-white/45"
      >
        <Plus size={16} /> Add a section
      </button>
    )
  }

  return (
    <div className="mt-5 rounded-[24px] border border-[#7C5CFF]/30 bg-[#F8F5FF] p-4 dark:border-[#7C5CFF]/20 dark:bg-[#7C5CFF]/[0.06]">
      <div className="flex flex-wrap gap-2">
        {SECTION_PRESETS.map((preset) => (
          <button
            key={preset.type}
            type="button"
            onClick={() => { setType(preset.type); setTitle(preset.title) }}
            className={cn(
              "rounded-full border px-3 py-1.5 text-[11px] font-black transition",
              type === preset.type
                ? "border-[#7C5CFF] bg-[#EEE9FF] text-[#6B4EF6] dark:border-[#7C5CFF]/50 dark:bg-[#7C5CFF]/15 dark:text-[#C9BEFF]"
                : "border-[#DED4C7] text-[#756B63] hover:border-[#7C5CFF]/40 dark:border-white/10 dark:text-white/50"
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
          className="h-10 flex-1 rounded-2xl border border-[#DED4C7] bg-[#FFFDF8] px-4 text-sm font-semibold text-[#251F1A] outline-none focus:border-[#7C5CFF]/50 dark:border-white/10 dark:bg-[#141414] dark:text-white"
        />
        <button
          type="button"
          disabled={pending || !title.trim()}
          onClick={() => start(async () => { const r = await addSection({ type, title }); if (r.ok) { setOpen(false) } })}
          className="inline-flex items-center gap-1.5 rounded-2xl bg-[#7C5CFF] px-4 py-2.5 text-xs font-black text-white shadow-[0_10px_22px_rgba(124,92,255,0.28)] transition hover:bg-[#684AF0] disabled:opacity-50"
        >
          {pending ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Add
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-2xl border border-[#DED4C7] px-3 py-2.5 text-xs font-black text-[#756B63] dark:border-white/10 dark:text-white/50">
          <X size={13} />
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
      <span className="mb-1.5 block text-[11px] font-black uppercase tracking-[0.14em] text-[#756B63] dark:text-white/45">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-2xl border border-[#DED4C7] bg-[#FFFDF8] px-4 text-sm font-semibold text-[#251F1A] outline-none focus:border-[#7C5CFF]/50 focus:ring-2 focus:ring-[#7C5CFF]/15 dark:border-white/10 dark:bg-[#141414] dark:text-white"
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
      if (data.applied > 0) router.refresh() // reload the profile to show new sections/items
    } catch (err) {
      setMessages((prev) => [...prev, { role: "assistant", content: "Network error — please try again." }])
      setError(err instanceof Error ? err.message : "Network error")
    } finally {
      setSending(false)
    }
  }

  return (
    <aside className="relative flex h-full w-[40%] min-w-[320px] max-w-[560px] shrink-0 flex-col border-r border-[#DED4C7]/70 bg-[#F5F1EA] px-7 py-8 dark:border-white/[0.06] dark:bg-[#0A0A0A]">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#DED4C733_1px,transparent_1px),linear-gradient(to_bottom,#DED4C733_1px,transparent_1px)] bg-[size:30px_30px] opacity-30 dark:opacity-10" />

      <div className="relative shrink-0">
        <p className="text-[10px] font-black uppercase tracking-[0.34em] text-[#7C5CFF]">Aristotle</p>
        <h1 className="mt-2 text-xl font-black tracking-[-0.05em] text-[#251F1A] dark:text-white">
          Hi {profile.full_name?.split(" ")[0] || "there"} — let&apos;s build your profile.
        </h1>
      </div>

      {/* Conversation */}
      <div ref={scrollRef} className="relative mt-5 flex-1 space-y-3 overflow-y-auto pr-1">
        {!hasHistory && (
          <div className="space-y-3">
            <p className="text-sm font-semibold leading-6 text-[#756B63] dark:text-white/50">
              Tell me what to add — paste your resume, drop a GitHub link, attach event photos or certificates, and I&apos;ll
              build the right section with proof.
            </p>
            <div className="flex flex-col gap-2">
              {QUICK_COMMANDS.map((cmd) => (
                <button
                  key={cmd}
                  type="button"
                  disabled={sending}
                  onClick={() => send(cmd)}
                  className="rounded-2xl border border-[#DED4C7] bg-[#FFFDF8]/80 px-3 py-2 text-left text-[12px] font-bold text-[#756B63] transition hover:border-[#7C5CFF]/45 hover:text-[#6B4EF6] disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/55"
                >
                  {cmd}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm font-semibold leading-6",
                m.role === "user"
                  ? "bg-[#7C5CFF] text-white"
                  : "border border-[#DED4C7] bg-[#FFFDF8] text-[#251F1A] dark:border-white/10 dark:bg-[#141414] dark:text-white",
              )}
            >
              {m.content}
              {m.attachments && m.attachments.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {m.attachments.map((a) =>
                    a.type.startsWith("image/") ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={a.url} src={a.url} alt={a.name} className="h-12 w-12 rounded-lg object-cover" />
                    ) : (
                      <span key={a.url} className="rounded-lg bg-black/10 px-2 py-1 text-[10px] font-bold">{a.name}</span>
                    ),
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {sending && (
          <div className="flex justify-start">
            <div className="inline-flex items-center gap-2 rounded-2xl border border-[#DED4C7] bg-[#FFFDF8] px-3.5 py-2.5 text-sm font-bold text-[#756B63] dark:border-white/10 dark:bg-[#141414] dark:text-white/55">
              <Loader2 size={14} className="animate-spin text-[#7C5CFF]" /> Aristotle is working…
            </div>
          </div>
        )}
      </div>

      {error && <p className="relative mt-2 shrink-0 text-xs font-bold text-red-600 dark:text-red-400">{error}</p>}

      {/* Attachment previews */}
      {attachments.length > 0 && (
        <div className="relative mt-3 flex shrink-0 flex-wrap gap-2">
          {attachments.map((a, i) => (
            <div key={i} className="relative">
              {a.type.startsWith("image/") && a.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={a.url} alt={a.name} className="h-14 w-14 rounded-xl border border-[#DED4C7] object-cover dark:border-white/10" />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-[#DED4C7] bg-[#FFFDF8] text-[#756B63] dark:border-white/10 dark:bg-white/[0.04]">
                  {a.uploading ? <Loader2 size={16} className="animate-spin" /> : <Paperclip size={16} />}
                </div>
              )}
              {a.uploading && a.type.startsWith("image/") && (
                <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/30">
                  <Loader2 size={16} className="animate-spin text-white" />
                </div>
              )}
              <button
                type="button"
                onClick={() => setAttachments((prev) => prev.filter((_, idx) => idx !== i))}
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#251F1A] text-white shadow"
                aria-label="Remove attachment"
              >
                <X size={11} />
              </button>
            </div>
          ))}
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
        <div className="relative rounded-[22px] border border-[#DED4C7] bg-[#FFFDF8] shadow-[0_14px_36px_rgba(42,37,32,0.08)] focus-within:border-[#7C5CFF]/50 dark:border-white/10 dark:bg-[#141414]">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
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
            className="block w-full resize-none rounded-t-[22px] bg-transparent px-4 pt-3 text-sm font-semibold text-[#251F1A] outline-none placeholder:text-[#B7AEA5] disabled:opacity-50 dark:text-white dark:placeholder:text-white/30"
          />
          <div className="flex items-center justify-between px-2.5 pb-2.5">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={sending}
              className="inline-flex items-center gap-1.5 rounded-full px-2 py-1.5 text-[11px] font-black text-[#756B63] transition hover:bg-[#241f18]/5 hover:text-[#6B4EF6] disabled:opacity-50 dark:text-white/45 dark:hover:bg-white/5"
            >
              <ImagePlus size={15} /> Attach
            </button>
            <button
              type="submit"
              disabled={sending || (!input.trim() && attachments.filter((a) => a.url).length === 0)}
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#7C5CFF] px-3.5 text-[11px] font-black uppercase tracking-[0.1em] text-white shadow-[0_10px_22px_rgba(124,92,255,0.28)] transition hover:bg-[#684AF0] disabled:bg-[#DED4C7] disabled:shadow-none dark:disabled:bg-white/10"
            >
              {sending ? <Loader2 size={13} className="animate-spin" /> : <>Send <ArrowUp size={13} /></>}
            </button>
          </div>
        </div>
      </form>
    </aside>
  )
}
