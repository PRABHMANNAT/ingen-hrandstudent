import { AlertCircle } from "lucide-react"

export default function ProfileUnconfigured() {
  return (
    <main className="flex h-full w-full items-center justify-center bg-[#F5F1EA] px-6 dark:bg-[#050505]">
      <div className="max-w-md rounded-[28px] border border-[#DED4C7]/70 bg-[#FFFDF8]/95 p-8 text-center shadow-[0_24px_60px_rgba(42,37,32,0.10)] dark:border-white/10 dark:bg-[#101010]/95">
        <AlertCircle className="mx-auto h-8 w-8 text-amber-500" />
        <h1 className="mt-4 text-lg font-black tracking-[-0.04em] text-[#251F1A] dark:text-white">Supabase not configured</h1>
        <p className="mt-2 text-sm font-semibold leading-6 text-[#756B63] dark:text-white/50">
          Add your Supabase keys to <code>.env.local</code> and restart the dev server to load real profile data. See{" "}
          <code>docs/SETUP-SUPABASE.md</code>.
        </p>
      </div>
    </main>
  )
}
