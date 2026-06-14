"use client"

import React, { useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowUp } from "lucide-react"
import PMSidebar from "@/app/pm/components/PMSidebar"
import StudentSidebar from "@/app/student/components/StudentSidebar"
import { OmniLogo } from "@/components/omni-logo"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const SUGGESTIONS = [
  "Alex Rivera",
  "Senior Rust Engineer",
  "Find backend candidates with Kubernetes",
  "github.com/alexrivera",
  "Data analyst with SQL dashboards",
]

export default function GlobalWorkspaceShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isStudentPage = pathname.startsWith("/student")
  const isSherlockPage = pathname.startsWith("/analyse-profile") || pathname.startsWith("/interviews") || pathname.startsWith("/interview-pack") || pathname.startsWith("/chat") || pathname.startsWith("/job-brief") || pathname.startsWith("/pm") || pathname.startsWith("/settings") || isStudentPage

  // Auth pages render full-screen without the app chrome (sidebar / search panel).
  const isBarePage = pathname === "/student/login" || pathname.startsWith("/auth")
  if (isBarePage) {
    return <div className="h-screen w-full overflow-auto">{children}</div>
  }

  return (
    <div className="chat-surface pm-command-surface h-screen min-w-0 overflow-hidden bg-[var(--chat-bg)] text-[var(--chat-text)] font-sans [--pm-chart-grid:rgba(36,31,24,0.10)] [--pm-chart-axis:rgba(36,31,24,0.58)] [--pm-chart-muted:rgba(36,31,24,0.42)] [--pm-chart-cursor:rgba(36,31,24,0.05)] [--pm-tooltip-bg:rgba(255,250,242,0.96)] [--pm-tooltip-border:#ded2c2] [--pm-tooltip-text:#241f18] dark:[--pm-chart-grid:rgba(255,255,255,0.06)] dark:[--pm-chart-axis:rgba(255,255,255,0.45)] dark:[--pm-chart-muted:rgba(255,255,255,0.28)] dark:[--pm-chart-cursor:rgba(255,255,255,0.05)] dark:[--pm-tooltip-bg:rgba(0,0,0,0.80)] dark:[--pm-tooltip-border:rgba(255,255,255,0.10)] dark:[--pm-tooltip-text:#ffffff]">
      <div className="flex h-full min-w-0 overflow-hidden">
        {isStudentPage ? <StudentSidebar /> : <PMSidebar />}
        {!isSherlockPage && <AristotleSearchPanel />}
        <div className="flex h-full min-w-0 flex-1 overflow-auto [&>*]:min-w-0 [&>*]:flex-1">
          {children}
        </div>
      </div>
      <style jsx global>{`
        .chat-surface {
          --chat-bg: #f7f3ec;
          --chat-panel: rgba(250, 247, 241, 0.78);
          --chat-text: #241f18;
          --chat-text-soft: rgba(36, 31, 24, 0.82);
          --chat-muted: rgba(36, 31, 24, 0.54);
          --chat-subtle: rgba(36, 31, 24, 0.34);
          --chat-border: rgba(116, 96, 72, 0.2);
          --chat-input: rgba(255, 252, 247, 0.94);
          --chat-chip: rgba(36, 31, 24, 0.055);
          --chat-chip-hover: rgba(226, 97, 18, 0.1);
          --chat-placeholder: rgba(36, 31, 24, 0.34);
          --chat-accent: #df5f12;
          --chat-accent-hover: #c94f0b;
          --chat-accent-glow: rgba(223, 95, 18, 0.28);
          --chat-focus: rgba(223, 95, 18, 0.34);
          --chat-loader: #1f2937;
        }

        .dark .chat-surface {
          --chat-bg: #050505;
          --chat-panel: rgba(5, 5, 5, 0.7);
          --chat-text: #ffffff;
          --chat-text-soft: rgba(255, 255, 255, 0.8);
          --chat-muted: rgba(255, 255, 255, 0.4);
          --chat-subtle: rgba(255, 255, 255, 0.25);
          --chat-border: rgba(255, 255, 255, 0.06);
          --chat-input: #0a0a0a;
          --chat-chip: rgba(255, 255, 255, 0.05);
          --chat-chip-hover: rgba(255, 107, 0, 0.1);
          --chat-placeholder: rgba(255, 255, 255, 0.2);
          --chat-accent: #ff6b00;
          --chat-accent-hover: #ff7f22;
          --chat-accent-glow: rgba(255, 107, 0, 0.34);
          --chat-focus: rgba(255, 107, 0, 0.4);
          --chat-loader: #ffffff;
        }

        .pm-command-surface {
          --pm-bg: #f7f3ec;
          --pm-panel: rgba(250, 247, 241, 0.78);
          --pm-card: rgba(255, 250, 242, 0.94);
          --pm-text: #241f18;
          --pm-text-soft: rgba(36, 31, 24, 0.82);
          --pm-muted: rgba(36, 31, 24, 0.58);
          --pm-subtle: rgba(36, 31, 24, 0.38);
          --pm-border: rgba(116, 96, 72, 0.2);
          --pm-input: rgba(255, 252, 247, 0.94);
          --pm-chip: rgba(36, 31, 24, 0.055);
          --pm-chip-hover: rgba(226, 97, 18, 0.1);
          --pm-placeholder: rgba(36, 31, 24, 0.34);
          --pm-accent: #df5f12;
          --pm-accent-hover: #c94f0b;
          --pm-accent-glow: rgba(223, 95, 18, 0.28);
          --pm-focus: rgba(223, 95, 18, 0.34);
          --pm-loader: #1f2937;
          --pm-tooltip-bg: rgba(255, 250, 242, 0.96);
        }

        .dark .pm-command-surface {
          --pm-bg: #050505;
          --pm-panel: rgba(5, 5, 5, 0.7);
          --pm-card: rgba(10, 10, 10, 0.92);
          --pm-text: #ffffff;
          --pm-text-soft: rgba(255, 255, 255, 0.82);
          --pm-muted: rgba(255, 255, 255, 0.5);
          --pm-subtle: rgba(255, 255, 255, 0.28);
          --pm-border: rgba(255, 255, 255, 0.06);
          --pm-input: #0a0a0a;
          --pm-chip: rgba(255, 255, 255, 0.05);
          --pm-chip-hover: rgba(255, 107, 0, 0.1);
          --pm-placeholder: rgba(255, 255, 255, 0.2);
          --pm-accent: #ff6b00;
          --pm-accent-hover: #ff7f22;
          --pm-accent-glow: rgba(255, 107, 0, 0.34);
          --pm-focus: rgba(255, 107, 0, 0.4);
          --pm-loader: #ffffff;
          --pm-tooltip-bg: rgba(0, 0, 0, 0.8);
        }

        .artifact-toolbar-btn {
          display: inline-flex;
          height: 2.25rem;
          align-items: center;
          justify-content: center;
          gap: 0.45rem;
          border-radius: 999px;
          border: 1px solid var(--pm-border);
          background: var(--pm-chip);
          padding: 0 0.85rem;
          color: var(--pm-muted);
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
          font-size: 0.72rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          transition: color 180ms ease, background 180ms ease, border-color 180ms ease, transform 180ms ease;
        }

        .artifact-toolbar-btn:hover {
          color: var(--pm-text);
          background: var(--pm-chip-hover);
          border-color: var(--pm-focus);
          transform: translateY(-1px);
        }
      `}</style>
    </div>
  )
}

function AristotleSearchPanel() {
  const router = useRouter()
  const pathname = usePathname()
  const [query, setQuery] = useState("")
  const isSherlockPage = pathname.startsWith("/analyse-profile")

  const submitSearch = (event?: React.FormEvent) => {
    event?.preventDefault()
    const submittedQuery = query.trim()
    if (!submittedQuery) return
    localStorage.setItem("forge_global_search_query", submittedQuery)
    window.dispatchEvent(new CustomEvent("forge-global-search", { detail: { query: submittedQuery } }))
    router.push(pathname.startsWith("/analyse-profile") ? "/analyse-profile" : "/chat")
  }

  return (
    <aside className="relative hidden h-full w-[372px] shrink-0 flex-col border-r border-[var(--chat-border)] bg-[var(--chat-panel)] px-5 py-8 font-mono backdrop-blur-sm lg:flex 2xl:w-[420px]">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="flex h-full w-full flex-col"
      >
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-6 py-8">
          <OmniLogo size={72} className="chat-pulse-logo text-[#1f2937] dark:text-white" />
          <h1 className="max-w-[14ch] text-center text-2xl font-light tracking-tight text-[var(--chat-text-soft)]">
            Who&apos;s the one you&apos;re searching for?
          </h1>
        </div>

        <div className="mx-auto mt-auto w-full max-w-md space-y-4">
          {!isSherlockPage && (
            <div className="flex flex-wrap justify-center gap-3 opacity-0 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 fill-mode-forwards">
              {SUGGESTIONS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setQuery(tag)}
                  className="px-3 py-1.5 rounded-full bg-[var(--chat-chip)] text-xs text-[var(--chat-muted)] hover:text-[var(--chat-text)] hover:bg-[var(--chat-chip-hover)] hover:ring-1 hover:ring-[var(--chat-focus)] transition-all"
                >
                  {tag}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={submitSearch} className="w-full relative group">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Ex: Alex Rivera, github.com/alexrivera, Senior Rust Engineer"
              className="w-full bg-[var(--chat-input)] rounded-2xl text-lg xl:text-xl font-light text-[var(--chat-text)] placeholder:text-[var(--chat-placeholder)] px-6 py-4 pr-16 focus:outline-none focus:ring-1 focus:ring-[var(--chat-focus)] transition-all shadow-xl"
              aria-label="Search prompt"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Button
                type="submit"
                size="icon"
                disabled={!query.trim()}
                className={cn(
                  "rounded-lg w-10 h-10 transition-all duration-200",
                  query.trim()
                    ? "bg-[var(--chat-accent)] text-white hover:bg-[var(--chat-accent-hover)] shadow-[0_0_28px_var(--chat-accent-glow)]"
                    : "bg-[var(--chat-chip)] text-[var(--chat-placeholder)] hover:bg-[var(--chat-chip-hover)]"
                )}
                aria-label="Run search"
              >
                <ArrowUp className="w-5 h-5" />
              </Button>
            </div>
          </form>
        </div>
      </motion.div>
    </aside>
  )
}
