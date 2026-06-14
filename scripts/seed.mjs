// Seeds demo accounts + profiles using the Supabase service-role key.
//
//   1. Fill NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
//   2. Run the SQL in supabase/migrations/0001_init.sql first
//   3. node scripts/seed.mjs
//
// Re-running is safe: existing users are reused and their profile is reset.

import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { createClient } from "@supabase/supabase-js"

// --- tiny .env.local loader (avoids adding a dependency) --------------------
function loadEnvLocal() {
  try {
    const text = readFileSync(resolve(process.cwd(), ".env.local"), "utf8")
    for (const line of text.split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "")
    }
  } catch {
    /* no .env.local — rely on real env */
  }
}
loadEnvLocal()

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local")
  process.exit(1)
}

const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })

const DEMO_PASSWORD = "Password123!"

const USERS = [
  {
    email: "kumar@demo.ingen.test",
    role: "student",
    full_name: "Kumar Dhananjaya Shivanna",
    profile: {
      headline: "Aspiring Software Engineer · Backend & Distributed Systems",
      about: "Final-year CS student. Details to be attached later — placeholder profile for the demo.",
      tags: ["Java", "Spring Boot", "Distributed Systems", "PostgreSQL"],
      target_role: "Backend Engineer",
    },
    sections: [
      {
        type: "education",
        title: "Education",
        items: [{ title: "B.E. Computer Science", body: "University placeholder · 2022–2026", meta: { gpa: "" } }],
      },
      {
        type: "projects",
        title: "Projects",
        items: [{ title: "Sample Project", body: "Add a GitHub link to verify this project.", meta: {} }],
      },
    ],
  },
  {
    email: "aisha@demo.ingen.test",
    role: "student",
    full_name: "Aisha Khan",
    profile: {
      headline: "Frontend Engineer · React & Design Systems",
      about: "Different demo student so each login shows distinct data.",
      tags: ["React", "TypeScript", "Tailwind", "Figma"],
      target_role: "Frontend Engineer",
    },
    sections: [
      { type: "experience", title: "Experience", items: [{ title: "UI Intern", body: "Built component library.", meta: {} }] },
    ],
  },
  {
    email: "recruiter@demo.ingen.test",
    role: "recruiter",
    full_name: "Riya Recruiter",
    profile: { headline: "Talent Partner", about: "", tags: [], target_role: "" },
    sections: [],
  },
]

async function findUserByEmail(email) {
  // listUsers is paginated; demo set is tiny so first page is enough.
  const { data } = await admin.auth.admin.listUsers({ perPage: 200 })
  return data?.users?.find((u) => u.email === email) ?? null
}

async function upsertUser(spec) {
  let user = await findUserByEmail(spec.email)
  if (!user) {
    const { data, error } = await admin.auth.admin.createUser({
      email: spec.email,
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: { role: spec.role, full_name: spec.full_name },
    })
    if (error) throw error
    user = data.user
    console.log(`+ created ${spec.email}`)
  } else {
    await admin.auth.admin.updateUserById(user.id, {
      user_metadata: { role: spec.role, full_name: spec.full_name },
    })
    console.log(`= reused ${spec.email}`)
  }
  return user
}

async function resetProfile(userId, spec) {
  // Upsert the profile header (trigger may have already inserted a bare row).
  await admin.from("profiles").upsert({
    id: userId,
    role: spec.role,
    full_name: spec.full_name,
    email: spec.email,
    headline: spec.profile.headline ?? "",
    about: spec.profile.about ?? "",
    tags: spec.profile.tags ?? [],
    target_role: spec.profile.target_role ?? "",
  })

  // Wipe + re-create sections for a clean demo state.
  await admin.from("sections").delete().eq("profile_id", userId)
  let pos = 0
  for (const section of spec.sections ?? []) {
    const { data: sec, error } = await admin
      .from("sections")
      .insert({ profile_id: userId, type: section.type, title: section.title, position: pos++ })
      .select()
      .single()
    if (error) throw error
    let ipos = 0
    for (const item of section.items ?? []) {
      await admin.from("items").insert({
        section_id: sec.id,
        title: item.title ?? "",
        body: item.body ?? "",
        meta: item.meta ?? {},
        position: ipos++,
      })
    }
  }
}

async function main() {
  for (const spec of USERS) {
    const user = await upsertUser(spec)
    await resetProfile(user.id, spec)
    console.log(`  profile ready for ${spec.full_name}`)
  }
  console.log("\nDone. Demo logins (password for all): " + DEMO_PASSWORD)
  for (const u of USERS) console.log(`  ${u.role.padEnd(9)} ${u.email}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
