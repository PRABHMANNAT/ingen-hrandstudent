"use client"

import { createBrowserClient } from "@supabase/ssr"
import { getSupabaseEnv } from "./config"

// Browser-side Supabase client. Used inside client components (login page,
// Aristotle chat, etc.). Safe to call repeatedly — createBrowserClient memoizes.
export function createClient() {
  const { url, anonKey } = getSupabaseEnv()
  return createBrowserClient(url, anonKey)
}
