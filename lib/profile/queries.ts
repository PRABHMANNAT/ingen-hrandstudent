import "server-only"
import { createClient } from "@/lib/supabase/server"
import type { ChatMessageRow, FullProfile, ProfileRow, SectionWithItems } from "@/lib/supabase/types"

// Recent Aristotle chat messages for the signed-in user, oldest first.
export async function getRecentChat(limit = 30): Promise<ChatMessageRow[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []
  const { data } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit)
  return ((data as ChatMessageRow[]) ?? []).slice().reverse()
}

// Loads the signed-in user's full profile (header + sections + items + proofs).
// Returns null if not signed in. Creates a bare profile row on the fly if the
// auth user somehow has none (defensive — the signup trigger normally makes it).
export async function getCurrentProfile(): Promise<FullProfile | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  let { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle<ProfileRow>()

  if (!profile) {
    const role = (user.user_metadata?.role as string) === "recruiter" ? "recruiter" : "student"
    const { data: created } = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        role,
        full_name: (user.user_metadata?.full_name as string) ?? "",
        email: user.email,
      })
      .select("*")
      .single<ProfileRow>()
    profile = created
  }

  if (!profile) return null

  const { data: sections } = await supabase
    .from("sections")
    .select("*, items(*, proofs(*))")
    .eq("profile_id", user.id)
    .order("position", { ascending: true })

  const hydrated: SectionWithItems[] = (sections ?? []).map((section) => ({
    ...section,
    items: ((section.items as SectionWithItems["items"]) ?? [])
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((item) => ({ ...item, proofs: item.proofs ?? [] })),
  }))

  return { ...profile, sections: hydrated }
}
