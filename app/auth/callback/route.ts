import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getRole, homePathForRole } from "@/lib/auth"

// Handles the OAuth (LinkedIn) and email-confirmation redirect: exchanges the
// `code` for a session, then routes the user to the right home by role.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next")

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      const destination = next || homePathForRole(getRole(user))
      return NextResponse.redirect(`${origin}${destination}`)
    }
  }

  return NextResponse.redirect(`${origin}/student/login?error=auth_callback_failed`)
}
