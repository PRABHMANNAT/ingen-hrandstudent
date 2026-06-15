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

// ---------------------------------------------------------------------------
// Default student profile template
// ---------------------------------------------------------------------------
// Every student profile follows the same section structure so the workspace
// always looks coherent. Pass per-student data in; the helper returns the
// canonical section list ready to be seeded.
//
// Each item supports an optional `proofs: [{ kind, url }]` array — GitHub
// repos, DOI links, portfolio URLs, etc. — which the verifier can later
// confirm against external sources.
function studentSections({
  education = [],
  experience = [],
  projects = [],
  openSource = [],
  skills = [],
  leadership = [],
  awards = [],
  conferences = [],
  gallery = [],
} = {}) {
  return [
    { type: "education", title: "Education", items: education },
    { type: "experience", title: "Experience", items: experience },
    { type: "projects", title: "Featured Projects", items: projects },
    { type: "projects", title: "Open Source Contributions", items: openSource },
    { type: "skills", title: "Technical Skills", items: skills },
    { type: "social-work", title: "Leadership & Community", items: leadership },
    { type: "hackathons", title: "Awards & Achievements", items: awards },
    { type: "certifications", title: "Conferences & Events", items: conferences },
    { type: "gallery", title: "Events & Gallery", items: gallery },
  ].filter((s) => s.items.length > 0)
}

// ---------------------------------------------------------------------------
// Kumar Dhananjaya Shivanna — full populated profile (real data)
// ---------------------------------------------------------------------------
const KUMAR_SECTIONS = studentSections({
  education: [
    {
      title: "University of Sydney",
      body: "Key areas of study: Software Engineering and Cybersecurity.",
      meta: {
        school: "University of Sydney",
        domain: "sydney.edu.au",
        degree: "Master of Computer Science (Advanced Entry)",
        location: "Sydney, Australia",
        start: "2026",
        end: "2027",
      },
    },
    {
      title: "Maharaja Institute of Technology Thandavapura",
      body: "CGPA: 8.6/10.",
      meta: {
        school: "Maharaja Institute of Technology Thandavapura",
        domain: "mitt.ac.in",
        degree: "B.E. Computer Science",
        location: "Mysuru, India",
        gpa: "8.6/10",
      },
    },
  ],
  experience: [
    {
      title: "Examic EdTech Pvt. Ltd.",
      body:
        "Designed and developed a large-scale real-time assessment platform supporting 5,000+ concurrent users with sub-250ms telemetry latency using Azure, WebSockets, and event-driven architecture. Reduced operational overhead by 40% via automation, and improved API performance by 42% through database optimization.",
      meta: {
        company: "Examic EdTech",
        domain: "examic.in",
        role: "Associate Software Engineer",
        location: "Bengaluru, India",
        start: "2024-07",
        end: "2026-02",
      },
    },
    {
      title: "Kandra Digital Pvt. Ltd.",
      body:
        "Improved website performance and SEO using Next.js SSR — increased First Contentful Paint by 50%. Containerized applications using Docker and contributed to scalable production-ready web applications.",
      meta: {
        company: "Kandra Digital",
        domain: "kandradigital.com",
        role: "MERN Stack Developer Intern",
        location: "Bengaluru, India",
        start: "2024-02",
        end: "2024-07",
      },
    },
  ],
  projects: [
    {
      title: "PulseTrace",
      body:
        "Real-time observability platform tracking application performance and user experience. Processes millions of async events, ships a custom SDK, and a React dashboard for live analytics.",
      meta: {
        stack: ["Node.js", "Redis", "BullMQ", "PostgreSQL", "React", "TypeScript"],
        start: "2025-01",
        end: "2025-06",
        source: "https://github.com/kumardhananjaya",
      },
      proofs: [{ kind: "link", url: "https://github.com/kumardhananjaya" }],
    },
    {
      title: "Zero-Trust API Platform",
      body:
        "Secure API ecosystem with JWT-based authentication gateway, Policy Decision Point, RBAC + ABAC authorization, and a real-time visibility dashboard.",
      meta: {
        stack: ["NestJS", "PostgreSQL", "Redis", "Docker", "AWS"],
        start: "2024-09",
        end: "2024-12",
      },
    },
    {
      title: "NexusEdit",
      body:
        "Google Docs-style collaborative editor using CRDTs (Yjs). Conflict-free real-time editing, live cursor tracking, distributed sync, and a horizontally scalable backend.",
      meta: {
        stack: ["React", "Node.js", "Redis", "MongoDB", "Yjs"],
        start: "2024-05",
        end: "2024-08",
      },
    },
    {
      title: "The Ironclad Pipeline",
      body:
        "Enterprise-grade DevSecOps platform securing the entire SDLC with Zero-Trust principles. OPA Gatekeeper policy-as-code, SonarQube/Trivy/Gitleaks/Falco/Vault, runtime threat detection, and dynamic secret management.",
      meta: {
        stack: ["Kubernetes", "Docker", "Jenkins", "OPA Gatekeeper", "Falco", "Vault", "SonarQube", "Trivy", "Terraform"],
        start: "2024-01",
        end: "2024-04",
      },
    },
    {
      title: "Flux-Gate",
      body:
        "Distributed event-driven engine handling 100,000+ RPS with zero overselling and fault tolerance. Redis Lua atomic inventory, Kafka async order processing, rate limiting, waiting-room shaping.",
      meta: {
        stack: ["Node.js", "TypeScript", "Fastify", "Redis", "Kafka", "PostgreSQL", "Docker", "k6"],
        start: "2023-09",
        end: "2023-12",
      },
    },
  ],
  openSource: [
    {
      title: "Komodor",
      body:
        "Contributed to cloud-native Kubernetes tooling used by engineering teams globally. CLI configuration enhancements to reduce CI/CD latency, Helm deployment fixes, and improved deployment reliability.",
      meta: {
        company: "Komodor",
        domain: "komodor.com",
        role: "Open Source Contributor",
        start: "2024-03",
        end: "2024-09",
        source: "https://github.com/komodorio",
      },
      proofs: [{ kind: "link", url: "https://github.com/komodorio" }],
    },
  ],
  skills: [
    {
      title: "Programming Languages",
      body: "C++ · TypeScript · JavaScript · Python · Java · Go · SQL",
      meta: {},
    },
    {
      title: "Frontend",
      body: "React · Next.js · Redux Toolkit · Tailwind CSS · React Native",
      meta: {},
    },
    {
      title: "Backend",
      body: "Node.js · FastAPI · NestJS · PostgreSQL · MySQL · Redis · MongoDB · gRPC · WebSockets",
      meta: {},
    },
    {
      title: "Cloud & DevOps",
      body: "AWS · Azure · Docker · Kubernetes · Helm · GitHub Actions · CI/CD",
      meta: {},
    },
    {
      title: "AI & Machine Learning",
      body: "Agentic AI · LLM Integrations · Prompt Engineering · Model Context Protocol (MCP)",
      meta: {},
    },
  ],
  leadership: [
    {
      title: "President — ACES & Clusteroids Engineering Clubs",
      body:
        "Led technical communities focused on software engineering and innovation. Organized workshops, mentored junior developers, coordinated hackathons and coding competitions, and built partnerships with industry professionals.",
      meta: {},
    },
    {
      title: "Inter-College Hackathon Organizer",
      body:
        "Organized a 24-hour hackathon involving 500+ participants. Managed event planning and execution, coordinated sponsors and judges, led volunteer teams, and facilitated technical mentorship sessions.",
      meta: {},
    },
  ],
  awards: [
    {
      title: "Inter-College Web Development Competition",
      body: "First place in a multi-college web development competition.",
      meta: { event: "Inter-College Web Dev", place: "1st", date: "2023" },
    },
    {
      title: "HPE SWARM-IT National Hackathon",
      body: "Runner-up at the HPE SWARM-IT national hackathon.",
      meta: { event: "HPE SWARM-IT", domain: "hpe.com", place: "2nd", date: "2023" },
    },
    {
      title: "GND National Technical Symposium",
      body: "Best Idea recognition at the GND National Technical Symposium.",
      meta: { event: "GND Tech Symposium", domain: "gndec.ac.in", award: "Best Idea", date: "2022" },
    },
  ],
  conferences: [
    {
      title: "Civo Navigate Conference",
      body:
        "Participated in cloud-native and Kubernetes sessions. Key learnings: cloud-native architecture, Kubernetes best practices, platform engineering, and AI infrastructure trends.",
      meta: { event: "Civo Navigate", domain: "civo.com", date: "2024", location: "London, UK" },
    },
  ],
  gallery: [
    {
      title: "Civo Navigate · Cloud-Native Conference",
      body: "Engaging with the global cloud-native community — Kubernetes, platform engineering, and AI infrastructure tracks.",
      meta: {
        event: "Civo Navigate",
        domain: "civo.com",
        date: "2024",
        location: "London, UK",
        images: [
          "/photos/kumar/01.jpeg",
          "/photos/kumar/02.jpeg",
          "/photos/kumar/03.jpeg",
          "/photos/kumar/04.jpeg",
          "/photos/kumar/05.jpeg",
        ],
      },
    },
    {
      title: "Inter-College Hackathon · Organizing Team",
      body: "Coordinated a 24-hour hackathon with 500+ participants — sponsors, judges, volunteer teams, and technical mentorship.",
      meta: {
        event: "Inter-College Hackathon",
        date: "2023",
        location: "Mysuru, India",
        images: [
          "/photos/kumar/06.jpeg",
          "/photos/kumar/07.jpeg",
          "/photos/kumar/08.jpeg",
          "/photos/kumar/09.jpeg",
          "/photos/kumar/10.jpeg",
        ],
      },
    },
    {
      title: "ACES & Clusteroids Engineering Clubs",
      body: "Leading workshops, mentoring junior developers, and building partnerships with industry professionals as President of the engineering clubs.",
      meta: {
        event: "Engineering Clubs",
        date: "2022 – 2024",
        location: "Mysuru, India",
        images: [
          "/photos/kumar/11.jpeg",
          "/photos/kumar/12.jpeg",
          "/photos/kumar/13.jpeg",
          "/photos/kumar/14.jpeg",
          "/photos/kumar/15.jpeg",
          "/photos/kumar/16.jpeg",
        ],
      },
    },
  ],
})

// ---------------------------------------------------------------------------
// Aisha Khan — same template, different (placeholder) data
// ---------------------------------------------------------------------------
const AISHA_SECTIONS = studentSections({
  education: [
    {
      title: "Your University — Your Degree",
      body: "Add your dates, location, and key areas of study.",
      meta: {},
    },
  ],
  experience: [
    {
      title: "UI Intern — Add Company",
      body: "Built a component library and shipped polished design-system primitives across the product.",
      meta: {},
    },
  ],
  projects: [
    {
      title: "Design System Starter",
      body: "Add a short description of what you built, the stack, and links to a live demo or GitHub repo.",
      meta: { stack: ["React", "TypeScript", "Tailwind"] },
    },
  ],
  skills: [
    { title: "Frontend", body: "React · TypeScript · Tailwind · Storybook", meta: {} },
    { title: "Design", body: "Figma · Design Systems · Accessibility", meta: {} },
  ],
  leadership: [],
  awards: [],
  conferences: [],
})

const USERS = [
  {
    email: "kumar@demo.ingen.test",
    role: "student",
    full_name: "Kumar Dhananjaya Shivanna",
    profile: {
      headline: "Software Engineer · Full-Stack Developer · Cloud & AI Enthusiast",
      about:
        "Software engineer based in Sydney with experience spanning full-stack development, cloud infrastructure, microservices, DevOps, and modern web technologies. Passionate about solving challenging engineering problems and building products that create meaningful impact at scale.",
      tags: ["TypeScript", "Node.js", "React", "Kubernetes", "AWS", "Azure", "Distributed Systems"],
      target_role: "Software Engineer",
    },
    sections: KUMAR_SECTIONS,
  },
  {
    email: "aisha@demo.ingen.test",
    role: "student",
    full_name: "Aisha Khan",
    profile: {
      headline: "Frontend Engineer · React & Design Systems",
      about: "Different demo student so each login shows distinct data — same profile template, your content.",
      tags: ["React", "TypeScript", "Tailwind", "Figma"],
      target_role: "Frontend Engineer",
    },
    sections: AISHA_SECTIONS,
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
      const { data: insertedItem, error: itemErr } = await admin
        .from("items")
        .insert({
          section_id: sec.id,
          title: item.title ?? "",
          body: item.body ?? "",
          meta: item.meta ?? {},
          position: ipos++,
        })
        .select()
        .single()
      if (itemErr) throw itemErr
      for (const proof of item.proofs ?? []) {
        await admin.from("proofs").insert({
          item_id: insertedItem.id,
          kind: proof.kind,
          url: proof.url ?? null,
          status: "unverified",
        })
      }
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
