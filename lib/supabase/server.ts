import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { getSupabaseEnv } from "./config"

// Server-side Supabase client bound to the request cookies. Use inside Server
// Components, Route Handlers, and Server Actions. In Next 16 `cookies()` is async.
export async function createClient() {
  const cookieStore = await cookies()
  const { url, anonKey } = getSupabaseEnv()

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // Called from a Server Component where cookies are read-only — the
          // middleware refreshes the session instead, so this is safe to ignore.
        }
      },
    },
  })
}
