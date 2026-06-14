"use client"

import React, { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { GraduationCap, Briefcase, Loader2, AlertCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import { IngenLogo } from "@/components/ingen-logo"
import { cn } from "@/lib/utils"

type Mode = "signin" | "signup"
type Role = "student" | "recruiter"

function LoginInner() {
  const router = useRouter()
  const params = useSearchParams()
  const next = params.get("next") || ""

  const [mode, setMode] = useState<Mode>("signin")
  const [role, setRole] = useState<Role>("student")
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(params.get("error") ? "Sign-in failed. Please try again." : null)
  const [info, setInfo] = useState<string | null>(null)

  const configured = isSupabaseConfigured()

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!configured || busy) return
    setBusy(true)
    setError(null)
    setInfo(null)

    const supabase = createClient()

    try {
      if (mode === "signup") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { role, full_name: fullName },
            emailRedirectTo: `${window.location.origin}/auth/callback${next ? `?next=${encodeURIComponent(next)}` : ""}`,
          },
        })
        if (signUpError) throw signUpError
        // If email confirmation is required there is no session yet.
        if (!data.session) {
          setInfo("Account created. Check your email to confirm, then sign in.")
          setMode("signin")
          return
        }
        redirectByRole(role)
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
        if (signInError) throw signInError
        const userRole = (data.user?.user_metadata?.role as Role) ?? "student"
        redirectByRole(userRole)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.")
    } finally {
      setBusy(false)
    }
  }

  function redirectByRole(userRole: Role) {
    const destination = next || (userRole === "recruiter" ? "/" : "/student")
    router.push(destination)
    router.refresh()
  }

  async function handleLinkedIn() {
    if (!configured || busy) return
    setBusy(true)
    setError(null)
    const supabase = createClient()
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "linkedin_oidc",
      options: {
        redirectTo: `${window.location.origin}/auth/callback${next ? `?next=${encodeURIComponent(next)}` : ""}`,
      },
    })
    if (oauthError) {
      setError(oauthError.message)
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#F5F1EA] px-4 py-10 dark:bg-[#050505]">
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(36,31,24,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(36,31,24,0.035)_1px,transparent_1px)] bg-[size:38px_38px] dark:bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)]" />

      <div className="relative w-full max-w-[420px] rounded-[28px] border border-[#DED4C7]/70 bg-[#FFFDF8]/95 p-8 shadow-[0_24px_60px_rgba(42,37,32,0.10)] backdrop-blur-xl dark:border-white/10 dark:bg-[#101010]/95">
        <div className="flex flex-col items-center text-center">
          <IngenLogo size={40} className="h-10 w-10 rounded-xl" />
          <h1 className="mt-4 text-xl font-black tracking-[-0.04em] text-[#251F1A] dark:text-white">
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-1.5 text-sm font-semibold text-[#756B63] dark:text-white/50">
            {mode === "signin" ? "Sign in to your iNGEN workspace" : "Build a proof-backed profile recruiters trust"}
          </p>
        </div>

        {!configured && (
          <div className="mt-5 flex items-start gap-2 rounded-xl border border-amber-300/60 bg-amber-50 px-3 py-2.5 text-xs font-semibold text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-300">
            <AlertCircle size={15} className="mt-0.5 shrink-0" />
            <span>Supabase isn&apos;t configured yet. Add your keys to <code>.env.local</code> to enable login.</span>
          </div>
        )}

        {mode === "signup" && (
          <div className="mt-6 grid grid-cols-2 gap-2">
            <RoleButton active={role === "student"} onClick={() => setRole("student")} icon={GraduationCap} label="Student" />
            <RoleButton active={role === "recruiter"} onClick={() => setRole("recruiter")} icon={Briefcase} label="Recruiter" />
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-3">
          {mode === "signup" && (
            <Field label="Full name" value={fullName} onChange={setFullName} type="text" placeholder="Kumar Dhananjaya Shivanna" required />
          )}
          <Field label="Email" value={email} onChange={setEmail} type="email" placeholder="you@example.com" required />
          <Field label="Password" value={password} onChange={setPassword} type="password" placeholder="••••••••" required minLength={6} />

          {error && <p className="text-xs font-bold text-red-600 dark:text-red-400">{error}</p>}
          {info && <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">{info}</p>}

          <button
            type="submit"
            disabled={!configured || busy}
            className="mt-1 flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#7C5CFF] text-sm font-black text-white shadow-[0_12px_26px_rgba(124,92,255,0.28)] transition hover:bg-[#684AF0] disabled:cursor-not-allowed disabled:bg-[#DED4C7] disabled:shadow-none dark:disabled:bg-white/10"
          >
            {busy && <Loader2 size={16} className="animate-spin" />}
            {mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        <div className="my-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-[#DED4C7] dark:bg-white/10" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#B7AEA5]">or</span>
          <div className="h-px flex-1 bg-[#DED4C7] dark:bg-white/10" />
        </div>

        <button
          type="button"
          onClick={handleLinkedIn}
          disabled={!configured || busy}
          className="flex h-11 w-full items-center justify-center gap-2.5 rounded-2xl border border-[#DED4C7] bg-white text-sm font-black text-[#251F1A] transition hover:border-[#0A66C2]/40 hover:bg-[#0A66C2]/[0.04] disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#0A66C2" aria-hidden>
            <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z" />
          </svg>
          Continue with LinkedIn
        </button>

        <p className="mt-6 text-center text-sm font-semibold text-[#756B63] dark:text-white/50">
          {mode === "signin" ? "New to iNGEN?" : "Already have an account?"}{" "}
          <button
            type="button"
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin")
              setError(null)
              setInfo(null)
            }}
            className="font-black text-[#7C5CFF] hover:underline"
          >
            {mode === "signin" ? "Create account" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  )
}

function RoleButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ComponentType<{ size?: number; className?: string }>
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center justify-center gap-2 rounded-2xl border px-3 py-2.5 text-sm font-black transition",
        active
          ? "border-[#7C5CFF] bg-[#EEE9FF] text-[#6B4EF6] dark:border-[#7C5CFF]/50 dark:bg-[#7C5CFF]/15 dark:text-[#C9BEFF]"
          : "border-[#DED4C7] text-[#756B63] hover:border-[#7C5CFF]/40 dark:border-white/10 dark:text-white/50"
      )}
    >
      <Icon size={16} />
      {label}
    </button>
  )
}

function Field({
  label,
  value,
  onChange,
  type,
  placeholder,
  required,
  minLength,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type: string
  placeholder?: string
  required?: boolean
  minLength?: number
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-black uppercase tracking-[0.14em] text-[#756B63] dark:text-white/45">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type={type}
        placeholder={placeholder}
        required={required}
        minLength={minLength}
        className="h-11 w-full rounded-2xl border border-[#DED4C7] bg-[#FFFDF8] px-4 text-sm font-semibold text-[#251F1A] outline-none transition placeholder:text-[#B7AEA5] focus:border-[#7C5CFF]/50 focus:ring-2 focus:ring-[#7C5CFF]/15 dark:border-white/10 dark:bg-[#141414] dark:text-white dark:placeholder:text-white/30"
      />
    </label>
  )
}

export default function StudentLoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  )
}
