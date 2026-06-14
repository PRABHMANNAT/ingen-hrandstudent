"use client"

import React, { useState, useTransition } from "react"
import {
  ArrowUp,
  BadgeCheck,
  Briefcase,
  Check,
  Code2,
  FileText,
  GraduationCap,
  HeartHandshake,
  LayoutGrid,
  Loader2,
  LogOut,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  Trophy,
  X,
} from "lucide-react"
import type { FullProfile, ProofRow, SectionWithItems } from "@/lib/supabase/types"
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

export default function ProfileWorkspace({ profile }: { profile: FullProfile }) {
  return (
    <main className="flex h-full min-w-0 flex-1 overflow-hidden bg-[#F5F1EA] text-[#251F1A] dark:bg-[#050505] dark:text-white">
      <AristotlePanel profileName={profile.full_name} />

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

// --- Aristotle panel (Phase 2 will make this drive AI edits) ----------------
function AristotlePanel({ profileName }: { profileName: string }) {
  return (
    <aside className="relative flex h-full w-[40%] min-w-[320px] max-w-[560px] shrink-0 flex-col border-r border-[#DED4C7]/70 bg-[#F5F1EA] px-7 py-8 dark:border-white/[0.06] dark:bg-[#0A0A0A]">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#DED4C733_1px,transparent_1px),linear-gradient(to_bottom,#DED4C733_1px,transparent_1px)] bg-[size:30px_30px] opacity-30 dark:opacity-10" />

      <div className="relative">
        <p className="text-[10px] font-black uppercase tracking-[0.34em] text-[#7C5CFF]">Aristotle</p>
        <h1 className="mt-3 text-2xl font-black tracking-[-0.06em] text-[#251F1A] dark:text-white">
          Hi {profileName?.split(" ")[0] || "there"} — let&apos;s build your profile.
        </h1>
        <p className="mt-3 text-sm font-semibold leading-6 text-[#756B63] dark:text-white/50">
          Use the controls on the right to add and edit sections now. AI-assisted editing — &ldquo;add my hackathon
          certificates&rdquo;, &ldquo;create an education section from my resume&rdquo; — comes online in the next update.
        </p>
      </div>

      <form
        onSubmit={(e) => e.preventDefault()}
        className="relative mt-auto"
      >
        <div className="relative rounded-[22px] border border-[#DED4C7] bg-[#FFFDF8] opacity-60 shadow-[0_14px_36px_rgba(42,37,32,0.08)] dark:border-white/10 dark:bg-[#141414]">
          <input
            disabled
            placeholder="Aristotle chat — coming next"
            className="h-[58px] w-full rounded-[22px] bg-transparent px-4 pr-28 text-sm font-semibold text-[#251F1A] outline-none placeholder:text-[#B7AEA5] dark:text-white"
          />
          <button
            type="button"
            disabled
            className="absolute right-2 top-1/2 inline-flex h-10 -translate-y-1/2 items-center gap-1.5 rounded-full bg-[#DED4C7] px-3 text-[10px] font-black uppercase tracking-[0.12em] text-white dark:bg-white/10"
          >
            Soon <ArrowUp size={14} />
          </button>
        </div>
      </form>
    </aside>
  )
}
