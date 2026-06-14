import type { User } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import type { AppRole } from "@/lib/supabase/types"

// Read the signed-in user (or null) on the server.
export async function getSessionUser(): Promise<User | null> {
  if (!isSupabaseConfigured()) return null
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

// Role is stored in the auth user metadata at signup so it is available in the
// JWT without a DB round-trip (used by middleware for redirects).
export function getRole(user: User | null): AppRole {
  const raw = (user?.user_metadata?.role ?? user?.app_metadata?.role) as string | undefined
  return raw === "recruiter" ? "recruiter" : "student"
}

// Where a user should land after auth, based on role.
export function homePathForRole(role: AppRole): string {
  return role === "recruiter" ? "/" : "/student"
}
