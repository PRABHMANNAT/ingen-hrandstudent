import { redirect } from "next/navigation"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import { getCurrentProfile } from "@/lib/profile/queries"
import ProfileWorkspace from "./profile-workspace"
import ProfileUnconfigured from "./profile-unconfigured"

export const dynamic = "force-dynamic"

export default async function StudentNotesPage() {
  // Without Supabase keys there is no auth/data layer — show a setup hint
  // instead of crashing.
  if (!isSupabaseConfigured()) {
    return <ProfileUnconfigured />
  }

  const profile = await getCurrentProfile()
  if (!profile) {
    redirect("/student/login?next=/student/notes")
  }

  return <ProfileWorkspace profile={profile} />
}
