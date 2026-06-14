// Central place to read Supabase env + detect whether it is configured.
// When the keys are missing the whole auth/data layer no-ops so the rest of
// the app keeps running locally without a Supabase project.

export function getSupabaseEnv() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  }
}

export function isSupabaseConfigured(): boolean {
  const { url, anonKey } = getSupabaseEnv()
  return Boolean(url && anonKey)
}
