# Student Profile Build — Status & Handoff

Context for any AI agent / developer picking this up. Last updated: 2026-06-15.

## What we're building
Turn the student **"Profile"** page (`/student/notes`) into a fully functional product:
an AI chat assistant ("Aristotle", left ~40%) that edits a **proof-backed candidate
profile** (right ~60%) made of a fixed header block + dynamically added sections.
The profile can later be exported to multiple resume formats. Students sign up → land
on `/student`; recruiters → land on `/` (home).

## Tech stack
- **Next.js 16** (App Router, Turbopack), **React 19**, TypeScript (build errors ignored in `next.config.mjs`).
- **Supabase** all-in-one: Postgres + Auth + Storage (`@supabase/supabase-js`, `@supabase/ssr`).
- **OpenAI** `gpt-4o-mini` (text + vision) for the AI agent. Existing helper `lib/openai.ts`.
- Package manager: **pnpm**. Dev server: `npx next dev -p 5176` (port 5176 is intentional — OAuth callbacks).
- Note: Next 16 renamed middleware → **`proxy.ts`** (function must be `proxy`).

## Locked product decisions (chosen by the user)
- DB/storage/auth: **Supabase all-in-one** (Supabase Auth, NOT NextAuth).
- LinkedIn: **OAuth (linkedin_oidc)** — returns only name/email/photo, NOT work history.
  Rich data comes from the resume/chat pipeline instead.
- Auth: full email/password signup + login, both roles, role-based redirect.
- LLM provider: **OpenAI** (user-supplied key).

## Environment / config
- Secrets live in `.env.local` (git-ignored). Keys: `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, `OPENAI_MODEL`.
- The auth/data layer **no-ops if Supabase keys are absent** (`lib/supabase/config.ts` →
  `isSupabaseConfigured()`), so the app still runs without a project.
- Supabase project IS live & configured. SQL migration applied, demo users seeded,
  Email provider enabled.
- Setup steps: `docs/SETUP-SUPABASE.md`. Schema: `supabase/migrations/0001_init.sql`.
  Seed: `node scripts/seed.mjs`.
- Git: every change is pushed to remote **`ui-testing`** → https://github.com/PRABHMANNAT/new-ingen-ui-testing.git
  (the original `origin` = ingen-hrandstudent is NOT kept in sync).

## Demo logins (password `Password123!` for all)
| Role | Email | Profile |
|---|---|---|
| student | kumar@demo.ingen.test | Kumar Dhananjaya Shivanna (real details TBD by user) |
| student | aisha@demo.ingen.test | Aisha Khan |
| recruiter | recruiter@demo.ingen.test | Riya Recruiter |

## Data model (Postgres, RLS enabled)
- `profiles` (1 per auth user): id=auth.uid, role, full_name, email, headline, about,
  tags[], avatar_url, target_role. Auto-created on signup via trigger `handle_new_user`.
- `sections` (profile_id, type, title, position) — type ∈ education/experience/projects/
  research/hackathons/social-work/certifications/skills/custom.
- `items` (section_id, title, body, meta jsonb {images:[]}, position).
- `proofs` (item_id, kind github|doi|image|link|file, url, file_path, status
  verified|partial|unverified, confidence, extracted jsonb).
- `chat_messages` (profile_id, role user|assistant, content, attachments jsonb).
- RLS: authenticated users can READ any profile/section/item/proof (recruiters view
  candidates); WRITE only their own. Chat is private to owner.
- Storage bucket `profile-media` (public read; per-user folder write: `<auth.uid>/...`).

## Phase status

### ✅ Phase 0 — Foundation (auth + DB + demo login)
- Supabase clients (`lib/supabase/{config,client,server,types}.ts`), `lib/auth.ts`.
- `proxy.ts`: gates `/student/*` behind auth, role-based redirects.
- `app/auth/callback/route.ts`: OAuth + email-confirm code exchange.
- `app/student/login/page.tsx`: email/password signup+login + role selector +
  LinkedIn button (renders bare via `global-workspace-shell.tsx` `isBarePage`).
- SQL migration, seed script, setup doc.
- Verified: all 3 demo logins authenticate with correct roles; `/student/*` redirects when unauthenticated.

### ✅ Phase 1 — Profile reads real per-user data
- Killed the old 1540-line mock (`buildProfile()` + localStorage).
- `lib/profile/queries.ts` `getCurrentProfile()` loads header + nested sections/items/proofs.
- `app/student/notes/page.tsx` = server component (redirects to login if unauth; setup hint if unconfigured).
- `app/student/notes/actions.ts`: server actions (updateHeader, add/delete/rename Section,
  add/update/delete Item, signOut) — all `revalidatePath('/student/notes')`.
- `app/student/notes/profile-workspace.tsx`: fixed header block (avatar/name/headline/tags/
  about + inline edit) + dynamic sections with manual add/edit/delete.
- Verified live in browser: Kumar's seeded data renders; add/delete section round-trips to DB.

### ✅ Phase 2 — Aristotle is a real AI agent
- `lib/llm/aristotle.ts` `planProfileEdits()`: sends message + profile context + image
  attachments (multimodal) to OpenAI → structured JSON plan (update_header / create_section /
  add_item with images + proofs).
- `app/api/student/aristotle/route.ts`: authenticated; applies the plan under RLS
  (resolves/creates sections, inserts items + proofs + gallery images), persists chat turn.
- `profile-workspace.tsx` AristotlePanel = real chat: history bubbles, ChatGPT-style image
  attach → Supabase Storage upload → vision, quick commands, `router.refresh()` on applied>0,
  renders `item.meta.images`. `queries.getRecentChat()` loads history.
- Verified live: "add Skills section (Java/Spring Boot/Docker/K8s) + update headline" worked
  end-to-end; storage upload + vision on a real photo confirmed separately.
- ⚠️ Proofs are inserted with status **`unverified`** — actual verification is Phase 3.

### ⬜ Phase 3 — Proof engine (NEXT)
Verify the proofs attached in Phase 2. Reuse existing infra:
- GitHub repo links → `app/api/github` + `lib/github.ts` (confirm repo/owner, pull stars/lang).
- Research/DOI/paper links → `app/api/verify-link` + `lib/link-verifier.ts` (reachable + metadata + author cross-check).
- Hackathon/award/cert images → GPT-vision validates each + extracts event/date/placement.
- Set `proofs.status` (verified/partial/unverified) + `confidence` + `extracted`; show badges
  (component already renders them) and rollups like "5 claimed, 4 verified".
- No new credentials needed.

### ⬜ Phase 4 — LinkedIn connect block
Static block atop the profile. OAuth fills identity (name/email/avatar). Needs a LinkedIn
Developer app wired into Supabase Auth providers (button already exists on login page).

### ⬜ Phase 5 — Multi-format resume export
One data model → templates: US (1-page, no photo), Indian (photo, detailed), Japanese
Rirekisho (formal), Australian (detailed + referees), Skills-based. Server-side HTML→PDF.

### ⬜ Phase 6 — Recruiter home wiring + polish
Recruiter side (`/`, currently redirects to `/pm`), empty states, error handling.

## Key gotchas
- `proxy.ts` (not `middleware.ts`) in Next 16; export fn named `proxy`.
- `cookies()` is async in Next 16 (`lib/supabase/server.ts` awaits it).
- `.env.local` changes: Next dev usually hot-reloads, but restart the dev server to be safe.
- Controlled React inputs: browser automation `computer:type` is unreliable; use `form_input` with refs.
- The recruiter/home and other `/pm`, `/analyse-profile` etc. areas are pre-existing demo
  surfaces — out of scope for the student profile work unless Phase 6.
