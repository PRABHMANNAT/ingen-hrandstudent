// Hand-written row types for the profile data model (Phase 0 schema).
// Kept manual for now; can be swapped for generated types via `supabase gen types`.

export type AppRole = "student" | "recruiter"
export type ProofStatus = "verified" | "partial" | "unverified"
export type ProofKind = "github" | "doi" | "image" | "link" | "file"

export type ProfileRow = {
  id: string
  role: AppRole
  full_name: string
  email: string | null
  headline: string
  about: string
  tags: string[]
  avatar_url: string | null
  target_role: string
  created_at: string
  updated_at: string
}

export type SectionRow = {
  id: string
  profile_id: string
  type: string
  title: string
  position: number
  created_at: string
}

export type ItemRow = {
  id: string
  section_id: string
  title: string
  body: string
  meta: Record<string, unknown>
  position: number
  created_at: string
}

export type ProofRow = {
  id: string
  item_id: string
  kind: ProofKind
  url: string | null
  file_path: string | null
  status: ProofStatus
  confidence: number
  extracted: Record<string, unknown>
  created_at: string
}

export type ChatMessageRow = {
  id: string
  profile_id: string
  role: "user" | "assistant"
  content: string
  attachments: unknown[]
  created_at: string
}

// A fully hydrated profile (header + nested sections/items/proofs).
export type SectionWithItems = SectionRow & {
  items: (ItemRow & { proofs: ProofRow[] })[]
}

export type FullProfile = ProfileRow & {
  sections: SectionWithItems[]
}
