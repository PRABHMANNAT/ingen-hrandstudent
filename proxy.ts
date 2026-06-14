import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { getSupabaseEnv, isSupabaseConfigured } from "@/lib/supabase/config"

const LOGIN_PATH = "/student/login"

export async function proxy(request: NextRequest) {
  // Until Supabase keys are configured, the auth layer is a no-op so the rest
  // of the app keeps working locally.
  if (!isSupabaseConfigured()) {
    return NextResponse.next()
  }

  let response = NextResponse.next({ request })
  const { url, anonKey } = getSupabaseEnv()

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname
  const role = (user?.user_metadata?.role ?? user?.app_metadata?.role) as string | undefined
  const isStudentArea = path.startsWith("/student") && path !== LOGIN_PATH

  // Gate the student workspace behind auth.
  if (isStudentArea && !user) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = LOGIN_PATH
    redirectUrl.searchParams.set("next", path)
    return NextResponse.redirect(redirectUrl)
  }

  // Already signed in but sitting on the login page → send to their home.
  if (path === LOGIN_PATH && user) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.searchParams.delete("next")
    redirectUrl.pathname = role === "recruiter" ? "/" : "/student"
    return NextResponse.redirect(redirectUrl)
  }

  return response
}

export const config = {
  // Run on everything except static assets and auth callback handling.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|auth/callback|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
}
