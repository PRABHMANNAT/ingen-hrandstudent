"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import { motion } from "framer-motion"
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  BadgeCheck,
  BarChart3,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  ChevronUp,
  Cpu,
  Download,
  ExternalLink,
  FileCheck2,
  GraduationCap,
  Github,
  Linkedin,
  MapPin,
  Network,
  Play,
  RotateCcw,
  Save,
  ShieldCheck,
  Sparkles,
  Upload,
  Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { OmniLogo } from "@/components/omni-logo"
import { cn } from "@/lib/utils"

type Skill = {
  name: string
  score: number
  tone: "mint" | "lavender" | "coral" | "peach" | "yellow" | "blue"
}

type Project = {
  id: string
  title: string
  subtitle: string
  description: string
  image: string
  tags: string[]
  action: string
  proofScore: number
}

type ExperienceItem = {
  company: string
  role: string
  duration: string
  location: string
  logo: "microsoft" | "ibm" | "nexus" | "doordash"
  description: string
  bullets: string[]
  tags: string[]
}

type EvidenceBox = {
  title: string
  label: string
  description: string
  icon: "backend" | "systems" | "ai" | "leadership"
  tags: string[]
}

type ChecklistItem = {
  label: string
  status: "complete" | "generated" | "updated"
}

type ProfileState = {
  targetRole: string
  tagline: string
  skills: Skill[]
  projects: Project[]
  insights: string[]
  checklist: ChecklistItem[]
  keywords: string[]
  talkingPoints: string[]
  roleFitSummary: string
  experiences: ExperienceItem[]
  evidenceBoxes: EvidenceBox[]
  readiness: {
    frontend: number
    backend: number
    aiProduct: number
  }
}

const PHOTO_FILES = {
  avatar: "PROFILE-PHOTO.png",
  proofOne: "WhatsApp Image 2026-05-05 at 4.40.54 AM.jpeg",
  proofTwo: "WhatsApp Image 2026-05-05 at 4.40.55 AM.jpeg",
  proofThree: "WhatsApp Image 2026-05-05 at 4.41.01 AM (1).jpeg",
  proofFour: "WhatsApp Image 2026-05-05 at 4.41.01 AM.jpeg",
  introVideo: "WhatsApp Video 2026-05-05 at 4.40.55 AM.mp4",
}

const mediaUrl = (name: string) => `/api/student-media?name=${encodeURIComponent(name)}`

const BASE_SKILLS: Skill[] = [
  { name: "React", score: 93, tone: "mint" },
  { name: "TypeScript", score: 91, tone: "lavender" },
  { name: "Python", score: 88, tone: "blue" },
  { name: "CRM", score: 78, tone: "peach" },
  { name: "REST APIs", score: 84, tone: "coral" },
  { name: "SQL", score: 80, tone: "yellow" },
]

const DOORDASH_BACKEND_SKILLS: Skill[] = [
  { name: "REST APIs", score: 94, tone: "coral" },
  { name: "Python", score: 91, tone: "blue" },
  { name: "SQL", score: 89, tone: "yellow" },
  { name: "Go", score: 84, tone: "mint" },
  { name: "Redis", score: 82, tone: "peach" },
  { name: "Docker", score: 80, tone: "lavender" },
  { name: "TypeScript", score: 86, tone: "lavender" },
  { name: "React", score: 78, tone: "mint" },
]

const AI_PRODUCT_SKILLS: Skill[] = [
  { name: "Python", score: 92, tone: "blue" },
  { name: "AI UX", score: 90, tone: "lavender" },
  { name: "React", score: 89, tone: "mint" },
  { name: "TypeScript", score: 88, tone: "lavender" },
  { name: "REST APIs", score: 86, tone: "coral" },
  { name: "Evaluation", score: 82, tone: "yellow" },
  { name: "SQL", score: 80, tone: "blue" },
]

const PROJECTS: Project[] = [
  {
    id: "ingen-hr",
    title: "Ingen HR",
    subtitle: "AI recruiting workspace",
    description: "Built a proof-first hiring dashboard with candidate ranking, intake flows, and recruiter-facing evidence cards.",
    image: mediaUrl(PHOTO_FILES.proofOne),
    tags: ["Next.js", "React", "AI UX"],
    action: "View proof",
    proofScore: 96,
  },
  {
    id: "recent-events",
    title: "Recent Events",
    subtitle: "Discovery and calendar product",
    description: "Shipped event browsing, saved collections, and responsive listing experiences with clear search flows.",
    image: mediaUrl(PHOTO_FILES.proofTwo),
    tags: ["TypeScript", "Search", "UI"],
    action: "View project",
    proofScore: 91,
  },
  {
    id: "bayjah",
    title: "Bayjah",
    subtitle: "Commerce storefront prototype",
    description: "Created a polished ecommerce flow with product proof cards, checkout states, and campaign-ready visuals.",
    image: mediaUrl(PHOTO_FILES.proofThree),
    tags: ["React", "Commerce", "CSS"],
    action: "View case study",
    proofScore: 88,
  },
  {
    id: "crm-toolkit",
    title: "Customer CRM Toolkit",
    subtitle: "Sales operations dashboard",
    description: "Modeled customer pipelines, account notes, and reporting widgets for small business relationship management.",
    image: mediaUrl(PHOTO_FILES.proofFour),
    tags: ["CRM", "SQL", "APIs"],
    action: "View proof",
    proofScore: 84,
  },
]

const INTRO_SLIDES = [
  {
    label: "Meet Veer - I build AI products that actually ship.",
    duration: "0:42",
    type: "video",
    source: mediaUrl(PHOTO_FILES.introVideo),
    poster: mediaUrl(PHOTO_FILES.proofTwo),
  },
  {
    label: "Project walkthrough - evidence-led hiring surfaces.",
    duration: "0:31",
    type: "image",
    source: mediaUrl(PHOTO_FILES.proofOne),
  },
  {
    label: "Interview focus - product judgment and API fluency.",
    duration: "0:28",
    type: "image",
    source: mediaUrl(PHOTO_FILES.proofThree),
  },
] as const

const QUICK_COMMANDS = [
  "Update my profile for backend role at DoorDash",
  "Add experience section based on what you know about me",
  "Show leadership and NEXUS society proof",
  "Prepare my profile for AI product internships",
]

const EXPERIENCE_ITEMS: ExperienceItem[] = [
  {
    company: "Microsoft",
    role: "Software Engineering Intern",
    duration: "Jul 2025 - Dec 2025 - 6 months",
    location: "Sydney, Australia",
    logo: "microsoft",
    description: "Contributed to internal dashboard workflows, API integration QA, and sprint-ready engineering notes.",
    bullets: [
      "Improved a React dashboard surface with clearer loading and error states.",
      "Partnered with backend engineers to validate API contracts and edge cases.",
      "Documented release notes that helped reviewers trace product changes faster.",
    ],
    tags: ["React", "API QA", "Azure", "TypeScript"],
  },
  {
    company: "IBM",
    role: "Software Developer Intern",
    duration: "Jan 2026 - Mar 2026 - 3 months",
    location: "Remote / Sydney",
    logo: "ibm",
    description: "Supported early-career engineering work across backend service checks and candidate-ready project proof.",
    bullets: [
      "Mapped Python service tasks into small, testable tickets.",
      "Built SQL-backed reporting notes for recruiter and mentor review.",
      "Prepared interview stories around reliability, debugging, and ownership.",
    ],
    tags: ["Python", "SQL", "REST", "Reliability"],
  },
  {
    company: "NEXUS Society Sydney",
    role: "Society Leader",
    duration: "Apr 2026 - May 2026 - 2 months",
    location: "University of Sydney",
    logo: "nexus",
    description: "Led student product sessions, demo reviews, and peer feedback loops for AI career tooling.",
    bullets: [
      "Organized roadmap and profile-building workshops for student members.",
      "Reviewed project demos and translated feedback into practical next steps.",
      "Coordinated mentor-style sessions around internships, portfolios, and proof.",
    ],
    tags: ["Leadership", "Community", "AI product", "Mentoring"],
  },
]

const DOORDASH_EVIDENCE: EvidenceBox[] = [
  {
    title: "Marketplace backend alignment",
    label: "DoorDash backend",
    description: "Positions Veer around delivery-scale APIs, ordering workflows, low-latency data access, and operational reliability.",
    icon: "backend",
    tags: ["Orders", "APIs", "Postgres", "Redis"],
  },
  {
    title: "Reliability talking track",
    label: "Interview angle",
    description: "Adds a concise story around debugging, idempotent updates, API contracts, queue-style thinking, and customer-impact tradeoffs.",
    icon: "systems",
    tags: ["Idempotency", "Queues", "Monitoring"],
  },
]

const AI_PRODUCT_EVIDENCE: EvidenceBox[] = [
  {
    title: "AI workflow proof",
    label: "Product AI",
    description: "Frames projects as practical AI tools with clear prompts, verification steps, and recruiter-facing evidence.",
    icon: "ai",
    tags: ["AI UX", "Evaluation", "Prompt flows"],
  },
  {
    title: "Shipping discipline",
    label: "Execution",
    description: "Highlights working demos, scoped product decisions, and documented iteration rather than only experimental prototypes.",
    icon: "systems",
    tags: ["Demos", "QA", "Iteration"],
  },
]

const LEADERSHIP_EVIDENCE: EvidenceBox[] = [
  {
    title: "NEXUS society leadership",
    label: "Leadership signal",
    description: "Adds a student leadership narrative around organizing sessions, reviewing peer projects, and turning feedback into action.",
    icon: "leadership",
    tags: ["Community", "Mentoring", "Workshops"],
  },
  {
    title: "Recruiter communication",
    label: "Soft skills",
    description: "Moves communication, ownership, and stakeholder translation into visible proof for interviews and screening calls.",
    icon: "systems",
    tags: ["Ownership", "Communication", "Review"],
  },
]

function orderProjects(ids: string[]) {
  return ids.map((id) => PROJECTS.find((project) => project.id === id)).filter((project): project is Project => Boolean(project))
}

function reorderSkills(priority: string[]) {
  const prioritized = priority
    .map((name) => BASE_SKILLS.find((skill) => skill.name.toLowerCase() === name.toLowerCase()))
    .filter((skill): skill is Skill => Boolean(skill))
  const rest = BASE_SKILLS.filter((skill) => !priority.some((name) => name.toLowerCase() === skill.name.toLowerCase()))
  return [...prioritized, ...rest]
}

function buildProfile(prompt = ""): ProfileState {
  const lower = prompt.toLowerCase()
  const wantsExperience =
    lower.includes("experience") ||
    lower.includes("intern") ||
    lower.includes("microsoft") ||
    lower.includes("whatever") ||
    lower.includes("know about me")
  const wantsLeadership = lower.includes("leadership") || lower.includes("society") || lower.includes("nexus")
  const wantsDoorDash = lower.includes("doordash") || (lower.includes("backend") && lower.includes("delivery"))
  const wantsAIProduct = lower.includes("ai product") || lower.includes("llm") || (lower.includes("ai") && lower.includes("internship"))

  if (wantsDoorDash) {
    return {
      targetRole: "Backend Software Engineer Intern - DoorDash",
      tagline: "I build reliable API workflows for marketplace products where speed, correctness, and customer impact matter.",
      skills: DOORDASH_BACKEND_SKILLS,
      projects: orderProjects(["crm-toolkit", "ingen-hr", "recent-events", "bayjah"]),
      insights: [
        "Backend role narrative focused on marketplace APIs",
        "REST, SQL, Redis, Docker, and Go moved into the top skill stack",
        "2 backend evidence boxes added for screening calls",
        "Backend readiness: strong",
        "Frontend readiness: useful support signal",
      ],
      checklist: baseChecklist("updated", wantsExperience),
      keywords: ["DoorDash", "marketplace APIs", "Postgres", "Redis", "service reliability", "order workflows"],
      talkingPoints: [
        "Explain how order-style workflows need idempotent updates and clear API contracts.",
        "Use the CRM toolkit to describe schema design, reporting queries, and backend data flow.",
        "Connect Ingen HR to service reliability: ranking, persistence, state changes, and review trails.",
      ],
      roleFitSummary:
        "The profile now leads with backend service readiness for DoorDash-style marketplace systems, with API reliability, SQL, Redis, Docker, and ownership signals made visible.",
      experiences: wantsExperience ? EXPERIENCE_ITEMS : [],
      evidenceBoxes: DOORDASH_EVIDENCE,
      readiness: { frontend: 82, backend: 88, aiProduct: 80 },
    }
  }

  if (
    wantsExperience &&
    !wantsLeadership &&
    !wantsAIProduct &&
    !lower.includes("backend") &&
    !lower.includes("api") &&
    !lower.includes("python") &&
    !lower.includes("frontend") &&
    !lower.includes("data") &&
    !lower.includes("crm")
  ) {
    return {
      targetRole: "Software Development Engineer I - IBM",
      tagline: "I combine internship-ready engineering habits, product judgment, and visible proof across APIs, dashboards, and AI workflows.",
      skills: [
        { name: "Python", score: 90, tone: "blue" },
        { name: "TypeScript", score: 89, tone: "lavender" },
        { name: "REST APIs", score: 88, tone: "coral" },
        { name: "React", score: 86, tone: "mint" },
        { name: "SQL", score: 84, tone: "yellow" },
        { name: "Leadership", score: 82, tone: "peach" },
      ],
      projects: orderProjects(["ingen-hr", "crm-toolkit", "recent-events", "bayjah"]),
      insights: [
        "3 experience entries added",
        "Internship, backend, and leadership signals are now visible",
        "4 verified project proofs",
        "Backend readiness: stronger with experience context",
        "Frontend readiness: strong",
      ],
      checklist: baseChecklist("updated", true),
      keywords: ["Microsoft", "IBM", "NEXUS Society", "internship proof", "API QA", "leadership"],
      talkingPoints: [
        "Describe Microsoft internship work through dashboard quality, API checks, and release notes.",
        "Use IBM internship work to show Python, SQL, debugging, and reliability ownership.",
        "Position NEXUS Society leadership as evidence of communication, initiative, and peer mentoring.",
      ],
      roleFitSummary:
        "The profile now includes an experience layer that gives recruiters a faster path from education and projects to practical workplace signals.",
      experiences: EXPERIENCE_ITEMS,
      evidenceBoxes: LEADERSHIP_EVIDENCE,
      readiness: { frontend: 90, backend: 82, aiProduct: 86 },
    }
  }

  if (wantsLeadership) {
    return {
      targetRole: "Student Product Lead - NEXUS Society Sydney",
      tagline: "I lead student builders through practical AI product work, demo feedback, and recruiter-ready proof.",
      skills: [
        { name: "Leadership", score: 92, tone: "peach" },
        { name: "AI UX", score: 88, tone: "lavender" },
        { name: "React", score: 86, tone: "mint" },
        { name: "Communication", score: 85, tone: "yellow" },
        { name: "TypeScript", score: 84, tone: "blue" },
        { name: "Project QA", score: 82, tone: "coral" },
      ],
      projects: orderProjects(["ingen-hr", "recent-events", "bayjah", "crm-toolkit"]),
      insights: [
        "Leadership proof promoted",
        "NEXUS Society story added to recruiter evidence",
        "Communication and mentoring signals surfaced",
        "Backend readiness: growing",
        "Frontend readiness: strong",
      ],
      checklist: baseChecklist("updated", true),
      keywords: ["NEXUS Society", "student leadership", "mentoring", "demo review", "AI career tooling"],
      talkingPoints: [
        "Explain how you organized students around concrete product outcomes.",
        "Describe how you reviewed demos and turned feedback into next steps.",
        "Use leadership proof to support ownership and communication in interviews.",
      ],
      roleFitSummary:
        "The profile now gives leadership equal weight with technical proof, making Veer look credible for roles that value ownership, communication, and initiative.",
      experiences: [EXPERIENCE_ITEMS[2]],
      evidenceBoxes: LEADERSHIP_EVIDENCE,
      readiness: { frontend: 88, backend: 72, aiProduct: 88 },
    }
  }

  if (wantsAIProduct || lower.includes("ml") || lower.includes("machine learning")) {
    return {
      targetRole: "AI Product Engineer Intern",
      tagline: "I prototype AI product workflows that connect model behavior, user trust, and practical shipping constraints.",
      skills: AI_PRODUCT_SKILLS,
      projects: orderProjects(["ingen-hr", "recent-events", "crm-toolkit", "bayjah"]),
      insights: [
        "AI product proof moved to the top",
        "Prompt workflow and evaluation signals added",
        "Python and API skills boosted",
        "Backend readiness: growing",
        "AI product readiness: strong",
      ],
      checklist: baseChecklist("updated", wantsExperience),
      keywords: ["AI UX", "LLM workflows", "evaluation", "Python", "model integration", "product QA"],
      talkingPoints: [
        "Explain how Aristotle-style workflows guide recruiters through structured decisions.",
        "Discuss AI output verification, trust, and where human review stays in the loop.",
        "Show where model responses become saved profile, job, or roadmap artifacts.",
      ],
      roleFitSummary:
        "AI tailoring centers the profile around productized AI workflows, practical model integration, evaluation thinking, and recruiter-facing trust signals.",
      experiences: wantsExperience ? EXPERIENCE_ITEMS : [],
      evidenceBoxes: AI_PRODUCT_EVIDENCE,
      readiness: { frontend: 88, backend: 74, aiProduct: 93 },
    }
  }

  if (lower.includes("backend") || lower.includes("api") || lower.includes("python")) {
    return {
      targetRole: "Backend Engineer Intern - API Platform",
      tagline: "I turn product requirements into reliable APIs, data models, and shipped user workflows.",
      skills: reorderSkills(["Python", "REST APIs", "SQL", "TypeScript", "React", "CRM"]),
      projects: orderProjects(["ingen-hr", "crm-toolkit", "recent-events", "bayjah"]),
      insights: [
        "Backend narrative moved to the front",
        "API and SQL proof promoted",
        "4 verified project proofs",
        "Backend readiness: growing",
        "Frontend readiness: strong",
      ],
      checklist: baseChecklist("updated", wantsExperience),
      keywords: ["REST APIs", "Postgres", "service design", "integration QA", "backend fundamentals"],
      talkingPoints: [
        "Explain the API contract behind Ingen HR.",
        "Discuss SQL reporting decisions in the CRM toolkit.",
        "Show how frontend states were backed by service responses.",
      ],
      roleFitSummary: "Backend positioning now leads with Python, REST APIs, SQL, and reliability proof while keeping frontend strength visible.",
      experiences: wantsExperience ? EXPERIENCE_ITEMS : [],
      evidenceBoxes: DOORDASH_EVIDENCE.slice(0, 1),
      readiness: { frontend: 86, backend: 78, aiProduct: 82 },
    }
  }

  if (lower.includes("data") || lower.includes("analyst") || lower.includes("sql")) {
    return {
      targetRole: "Product Analyst Intern - SaaS",
      tagline: "I connect product questions to usable dashboards, clean SQL, and recruiter-readable evidence.",
      skills: reorderSkills(["SQL", "Python", "CRM", "TypeScript", "React", "REST APIs"]),
      projects: orderProjects(["crm-toolkit", "recent-events", "ingen-hr", "bayjah"]),
      insights: [
        "2 analytics-ready project narratives",
        "SQL proof moved into top skill row",
        "4 verified project proofs",
        "Backend readiness: growing",
        "Frontend readiness: strong",
      ],
      checklist: baseChecklist("updated", wantsExperience),
      keywords: ["SQL", "dashboarding", "product metrics", "CRM analytics", "data QA"],
      talkingPoints: [
        "Walk through how CRM metrics map to recruiter needs.",
        "Describe a dashboard decision that changed the product flow.",
        "Explain how SQL proof supports analyst readiness.",
      ],
      roleFitSummary:
        "The profile now frames Veer as a product-minded analyst with enough engineering depth to automate and validate data workflows.",
      experiences: wantsExperience ? EXPERIENCE_ITEMS : [],
      evidenceBoxes: [],
      readiness: { frontend: 80, backend: 70, aiProduct: 77 },
    }
  }

  if (lower.includes("frontend") || lower.includes("react") || lower.includes("typescript") || lower.includes("ui")) {
    return {
      targetRole: "Frontend Engineer - React Product UI",
      tagline: "I build polished React interfaces with strong component judgment, API awareness, and product follow-through.",
      skills: reorderSkills(["React", "TypeScript", "REST APIs", "Python", "SQL", "CRM"]),
      projects: orderProjects(["ingen-hr", "recent-events", "bayjah", "crm-toolkit"]),
      insights: [
        "4 frontend-heavy proof cards",
        "React and TypeScript remain top-ranked",
        "12 public repos with UI depth",
        "Backend readiness: growing",
        "Frontend readiness: strong",
      ],
      checklist: baseChecklist("updated", wantsExperience),
      keywords: ["React", "TypeScript", "component systems", "responsive UI", "product QA"],
      talkingPoints: [
        "Describe the interaction model in Ingen HR.",
        "Show how Recent Events handles search and saved states.",
        "Explain component reuse across dashboard surfaces.",
      ],
      roleFitSummary:
        "Frontend tailoring emphasizes shipped UI, component systems, responsive polish, and the ability to collaborate with backend APIs.",
      experiences: wantsExperience ? EXPERIENCE_ITEMS : [],
      evidenceBoxes: [],
      readiness: { frontend: 94, backend: 66, aiProduct: 86 },
    }
  }

  if (lower.includes("crm") || lower.includes("salesforce") || lower.includes("customer")) {
    return {
      targetRole: "CRM Product Intern - Customer Systems",
      tagline: "I build customer-facing tools that make account data easier to inspect, update, and act on.",
      skills: reorderSkills(["CRM", "SQL", "REST APIs", "React", "TypeScript", "Python"]),
      projects: orderProjects(["crm-toolkit", "ingen-hr", "recent-events", "bayjah"]),
      insights: [
        "CRM proof promoted to lead card",
        "SQL and API evidence moved up",
        "4 verified project proofs",
        "Backend readiness: growing",
        "Frontend readiness: strong",
      ],
      checklist: baseChecklist("updated", wantsExperience),
      keywords: ["CRM", "customer workflows", "account data", "pipeline reporting", "operations tooling"],
      talkingPoints: [
        "Explain how CRM data turns into account actions.",
        "Show the reporting flow in the CRM toolkit.",
        "Discuss tradeoffs between clean UI and dense customer data.",
      ],
      roleFitSummary:
        "CRM tailoring presents Veer as a product builder who can model customer workflows and ship usable operational interfaces.",
      experiences: wantsExperience ? EXPERIENCE_ITEMS : [],
      evidenceBoxes: [],
      readiness: { frontend: 84, backend: 72, aiProduct: 76 },
    }
  }

  return {
    targetRole: "Software Development Engineer I - IBM",
    tagline: "I build AI products, recruiter tools, and practical full-stack experiences that move from prototype to shipped product.",
    skills: BASE_SKILLS,
    projects: orderProjects(["ingen-hr", "recent-events", "bayjah", "crm-toolkit"]),
    insights: ["1 internship offer", "3 certifications", "4 verified project proofs", "Backend readiness: growing", "Frontend readiness: strong"],
    checklist: baseChecklist("generated", false),
    keywords: ["React", "TypeScript", "Python", "REST APIs", "product shipping"],
    talkingPoints: [
      "Connect Ingen HR to recruiter workflow outcomes.",
      "Explain how each project shows shipped judgment.",
      "Use the CRM toolkit to show data and API readiness.",
    ],
    roleFitSummary:
      "The profile is tuned for IBM SDE I with a balanced full-stack story, frontend strength, and enough backend proof to support early-career engineering interviews.",
    experiences: [],
    evidenceBoxes: [],
    readiness: { frontend: 92, backend: 70, aiProduct: 84 },
  }
}

function legacyBuildProfile(prompt = ""): any {
  const lower = prompt.toLowerCase()

  if (lower.includes("backend") || lower.includes("api") || lower.includes("python")) {
    return {
      targetRole: "Backend Engineer Intern · API Platform",
      tagline: "I turn product requirements into reliable APIs, data models, and shipped user workflows.",
      skills: reorderSkills(["Python", "REST APIs", "SQL", "TypeScript", "React", "CRM"]),
      projects: orderProjects(["ingen-hr", "crm-toolkit", "recent-events", "bayjah"]),
      insights: ["1 internship-ready backend narrative", "3 certifications aligned to cloud/API work", "4 verified project proofs", "Backend readiness: growing", "Frontend readiness: strong"],
      checklist: baseChecklist("updated"),
      keywords: ["REST APIs", "Postgres", "service design", "integration QA", "backend fundamentals"],
      talkingPoints: ["Explain the API contract behind Ingen HR.", "Discuss SQL reporting decisions in the CRM toolkit.", "Show how frontend states were backed by service responses."],
      roleFitSummary: "Backend positioning now leads with Python, REST APIs, SQL, and reliability proof while keeping frontend strength visible.",
      readiness: { frontend: 86, backend: 74, aiProduct: 82 },
    }
  }

  if (lower.includes("data") || lower.includes("analyst") || lower.includes("sql")) {
    return {
      targetRole: "Product Analyst Intern · SaaS",
      tagline: "I connect product questions to usable dashboards, clean SQL, and recruiter-readable evidence.",
      skills: reorderSkills(["SQL", "Python", "CRM", "TypeScript", "React", "REST APIs"]),
      projects: orderProjects(["crm-toolkit", "recent-events", "ingen-hr", "bayjah"]),
      insights: ["2 analytics-ready project narratives", "SQL proof moved into top skill row", "4 verified project proofs", "Backend readiness: growing", "Frontend readiness: strong"],
      checklist: baseChecklist("updated"),
      keywords: ["SQL", "dashboarding", "product metrics", "CRM analytics", "data QA"],
      talkingPoints: ["Walk through how CRM metrics map to recruiter needs.", "Describe a dashboard decision that changed the product flow.", "Explain how SQL proof supports analyst readiness."],
      roleFitSummary: "The profile now frames Veer as a product-minded analyst with enough engineering depth to automate and validate data workflows.",
      readiness: { frontend: 80, backend: 68, aiProduct: 77 },
    }
  }

  if (lower.includes("frontend") || lower.includes("react") || lower.includes("typescript") || lower.includes("ui")) {
    return {
      targetRole: "Frontend Engineer · React Product UI",
      tagline: "I build polished React interfaces with strong component judgment, API awareness, and product follow-through.",
      skills: reorderSkills(["React", "TypeScript", "REST APIs", "Python", "SQL", "CRM"]),
      projects: orderProjects(["ingen-hr", "recent-events", "bayjah", "crm-toolkit"]),
      insights: ["4 frontend-heavy proof cards", "React and TypeScript remain top-ranked", "12 public repos with UI depth", "Backend readiness: growing", "Frontend readiness: strong"],
      checklist: baseChecklist("updated"),
      keywords: ["React", "TypeScript", "component systems", "responsive UI", "product QA"],
      talkingPoints: ["Describe the interaction model in Ingen HR.", "Show how Recent Events handles search and saved states.", "Explain component reuse across dashboard surfaces."],
      roleFitSummary: "Frontend tailoring emphasizes shipped UI, component systems, responsive polish, and the ability to collaborate with backend APIs.",
      readiness: { frontend: 94, backend: 66, aiProduct: 86 },
    }
  }

  if (lower.includes("ml") || lower.includes("machine learning") || lower.includes("ai")) {
    return {
      targetRole: "AI Product Engineer Intern",
      tagline: "I prototype AI product workflows that connect model behavior, user trust, and practical shipping constraints.",
      skills: reorderSkills(["Python", "React", "TypeScript", "REST APIs", "SQL", "CRM"]),
      projects: orderProjects(["ingen-hr", "recent-events", "crm-toolkit", "bayjah"]),
      insights: ["AI product proof moved to the top", "Python and API skills boosted", "4 verified project proofs", "Backend readiness: growing", "Frontend readiness: strong"],
      checklist: baseChecklist("updated"),
      keywords: ["AI UX", "Python", "prompt workflows", "evaluation notes", "model integration"],
      talkingPoints: ["Explain how Aristotle-style workflows guide recruiters.", "Discuss AI output verification and user trust.", "Show where model responses become product artifacts."],
      roleFitSummary: "AI tailoring centers the profile around productized AI workflows, practical model integration, and recruiter-facing trust signals.",
      readiness: { frontend: 88, backend: 70, aiProduct: 91 },
    }
  }

  if (lower.includes("crm") || lower.includes("salesforce") || lower.includes("customer")) {
    return {
      targetRole: "CRM Product Intern · Customer Systems",
      tagline: "I build customer-facing tools that make account data easier to inspect, update, and act on.",
      skills: reorderSkills(["CRM", "SQL", "REST APIs", "React", "TypeScript", "Python"]),
      projects: orderProjects(["crm-toolkit", "ingen-hr", "recent-events", "bayjah"]),
      insights: ["CRM proof promoted to lead card", "SQL and API evidence moved up", "4 verified project proofs", "Backend readiness: growing", "Frontend readiness: strong"],
      checklist: baseChecklist("updated"),
      keywords: ["CRM", "customer workflows", "account data", "pipeline reporting", "operations tooling"],
      talkingPoints: ["Explain how CRM data turns into account actions.", "Show the reporting flow in the CRM toolkit.", "Discuss tradeoffs between clean UI and dense customer data."],
      roleFitSummary: "CRM tailoring presents Veer as a product builder who can model customer workflows and ship usable operational interfaces.",
      readiness: { frontend: 84, backend: 72, aiProduct: 76 },
    }
  }

  return {
    targetRole: lower.includes("ibm") || lower.includes("sde") ? "Software Development Engineer I · IBM" : "Software Development Engineer I · IBM",
    tagline: "I build AI products, recruiter tools, and practical full-stack experiences that move from prototype to shipped product.",
    skills: BASE_SKILLS,
    projects: orderProjects(["ingen-hr", "recent-events", "bayjah", "crm-toolkit"]),
    insights: ["1 internship offer", "3 certifications", "4 verified project proofs", "Backend readiness: growing", "Frontend readiness: strong"],
    checklist: baseChecklist("generated"),
    keywords: ["React", "TypeScript", "Python", "REST APIs", "product shipping"],
    talkingPoints: ["Connect Ingen HR to recruiter workflow outcomes.", "Explain how each project shows shipped judgment.", "Use the CRM toolkit to show data and API readiness."],
    roleFitSummary: "The profile is tuned for IBM SDE I with a balanced full-stack story, frontend strength, and enough backend proof to support early-career engineering interviews.",
    readiness: { frontend: 92, backend: 70, aiProduct: 84 },
  }
}

function baseChecklist(status: ChecklistItem["status"], includeExperience = false): ChecklistItem[] {
  const items: ChecklistItem[] = [
    { label: "Education", status: "complete" },
    { label: "Technical skills", status: "complete" },
    { label: "Project proof", status: "complete" },
    { label: "Role fit summary", status },
    { label: "Interview talking points", status },
  ]

  if (includeExperience) {
    items.splice(3, 0, { label: "Experience section", status: "complete" })
  }

  return items
}

export default function StudentNotesPage() {
  const [profile, setProfile] = useState<ProfileState>(() => buildProfile())
  const [inputValue, setInputValue] = useState("")
  const [avatarSrc, setAvatarSrc] = useState(mediaUrl(PHOTO_FILES.avatar))
  const [videoIndex, setVideoIndex] = useState(0)
  const [isTailoring, setIsTailoring] = useState(false)
  const [savedState, setSavedState] = useState<"idle" | "saved" | "exported">("idle")
  const [connections, setConnections] = useState({ linkedin: false, github: false })
  const timerRef = useRef<number | null>(null)

  const activeSlide = INTRO_SLIDES[videoIndex]
  const profileStrength = useMemo(
    () => Math.round((profile.readiness.frontend + profile.readiness.backend + profile.readiness.aiProduct) / 3),
    [profile]
  )

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current)
    }
  }, [])

  function runTailor(rawPrompt: string) {
    const prompt = rawPrompt.trim()
    if (!prompt || isTailoring) return

    if (timerRef.current) window.clearTimeout(timerRef.current)
    setInputValue("")
    setIsTailoring(true)
    setSavedState("idle")

    timerRef.current = window.setTimeout(() => {
      const nextProfile = buildProfile(prompt)
      setProfile(nextProfile)
      setIsTailoring(false)
    }, 900)
  }

  function resetProfile() {
    setProfile(buildProfile())
    setAvatarSrc(mediaUrl(PHOTO_FILES.avatar))
    setSavedState("idle")
  }

  function saveProfile() {
    localStorage.setItem("nexus-student-profile-v1", JSON.stringify(profile))
    setSavedState("saved")
  }

  function exportProfile() {
    const blob = new Blob([JSON.stringify(profile, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = "veer-virk-nexus-profile.json"
    anchor.click()
    URL.revokeObjectURL(url)
    setSavedState("exported")
  }

  function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    setAvatarSrc(URL.createObjectURL(file))
  }

  return (
    <main className="flex h-full min-w-0 flex-1 overflow-hidden bg-[#F5F1EA] text-[#251F1A] dark:bg-[#050505] dark:text-white">
      <AristotlePanel
        inputValue={inputValue}
        isTailoring={isTailoring}
        onInputChange={setInputValue}
        onSubmit={() => runTailor(inputValue)}
        onQuickCommand={runTailor}
      />

      <section className="relative h-full min-w-0 flex-1 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(36,31,24,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(36,31,24,0.035)_1px,transparent_1px)] bg-[size:38px_38px] dark:bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)]" />

        <div className="relative h-full overflow-y-auto px-8 py-8">
          <div className="mx-auto w-full max-w-[920px] pb-10">
            <ProfileToolbar
              savedState={savedState}
              profileStrength={profileStrength}
              connections={connections}
              onToggleConnection={(provider) => setConnections((current) => ({ ...current, [provider]: !current[provider] }))}
              onExport={exportProfile}
              onSave={saveProfile}
              onReset={resetProfile}
            />

            <div className="mt-5 flex flex-col gap-5">
              <ProfileHeaderCard profile={profile} avatarSrc={avatarSrc} onAvatarChange={handleAvatarChange} />
              <IntroVideoCard
                activeSlide={activeSlide}
                onPrevious={() => setVideoIndex((index) => (index === 0 ? INTRO_SLIDES.length - 1 : index - 1))}
                onNext={() => setVideoIndex((index) => (index + 1) % INTRO_SLIDES.length)}
              />
              <StatsRow />
              <RoleFitCard profile={profile} />
              <EvidenceBoxesSection boxes={profile.evidenceBoxes} />
              <ExperienceSection experiences={profile.experiences} />
              <VerifiedProofSection projects={profile.projects} />
              <EndorsementsSection />
              <RecruiterInsightsPanel profile={profile} profileStrength={profileStrength} />
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

function AristotlePanel({
  inputValue,
  isTailoring,
  onInputChange,
  onSubmit,
  onQuickCommand,
}: {
  inputValue: string
  isTailoring: boolean
  onInputChange: (value: string) => void
  onSubmit: () => void
  onQuickCommand: (value: string) => void
}) {
  return (
    <aside className="relative flex h-full w-[40%] min-w-[320px] max-w-[560px] shrink-0 flex-col border-r border-[#DED4C7]/70 bg-[#F5F1EA] px-7 py-8 dark:border-white/[0.06] dark:bg-[#0A0A0A]">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#DED4C733_1px,transparent_1px),linear-gradient(to_bottom,#DED4C733_1px,transparent_1px)] bg-[size:30px_30px] opacity-30 dark:opacity-10" />

      <div className="relative">
        <AristotleLogo active={isTailoring} />
        <p className="mt-7 text-[10px] font-black uppercase tracking-[0.34em] text-[#7C5CFF]">Aristotle</p>
        <h1 className="mt-3 text-2xl font-black tracking-[-0.06em] text-[#251F1A] dark:text-white">
          Who&apos;s the role you&apos;re tailoring for?
        </h1>
        <p className="mt-3 text-sm font-semibold leading-6 text-[#756B63] dark:text-white/50">
          Aristotle edits your candidate profile using recruiter signals. Ask for a role, company, or skill focus.
        </p>
      </div>

      <div className="relative mt-5 flex flex-wrap gap-2">
        {QUICK_COMMANDS.map((command) => (
          <button
            key={command}
            type="button"
            disabled={isTailoring}
            onClick={() => onQuickCommand(command)}
            className="rounded-full border border-[#DED4C7] bg-[#FFFDF8]/80 px-3 py-1.5 text-[11px] font-black text-[#756B63] transition hover:border-[#7C5CFF]/45 hover:bg-[#EEE9FF] hover:text-[#6B4EF6] disabled:pointer-events-none disabled:opacity-45 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/50 dark:hover:bg-[#7C5CFF]/15 dark:hover:text-[#C9BEFF]"
          >
            {command}
          </button>
        ))}
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit()
        }}
        className="relative mt-auto"
      >
        <div className="relative rounded-[22px] border border-[#DED4C7] bg-[#FFFDF8] shadow-[0_14px_36px_rgba(42,37,32,0.08)] dark:border-white/10 dark:bg-[#141414]">
          <input
            value={inputValue}
            onChange={(event) => onInputChange(event.target.value)}
            disabled={isTailoring}
            placeholder="Ex: update backend role at DoorDash"
            className="h-[58px] w-full rounded-[22px] bg-transparent px-4 pr-28 text-sm font-semibold text-[#251F1A] outline-none placeholder:text-[#B7AEA5] disabled:opacity-50 dark:text-white dark:placeholder:text-white/30"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isTailoring}
            className="absolute right-2 top-1/2 inline-flex h-10 -translate-y-1/2 items-center gap-1.5 rounded-full bg-[#7C5CFF] px-3 text-[10px] font-black uppercase tracking-[0.12em] text-white shadow-[0_12px_26px_rgba(124,92,255,0.28)] transition hover:bg-[#684AF0] disabled:pointer-events-none disabled:bg-[#DED4C7] disabled:shadow-none dark:disabled:bg-white/10"
            aria-label="Tailor profile"
          >
            Update
            <ArrowUp size={14} />
          </button>
        </div>
      </form>
    </aside>
  )
}

function ProfileToolbar({
  savedState,
  profileStrength,
  connections,
  onToggleConnection,
  onExport,
  onSave,
  onReset,
}: {
  savedState: "idle" | "saved" | "exported"
  profileStrength: number
  connections: { linkedin: boolean; github: boolean }
  onToggleConnection: (provider: "linkedin" | "github") => void
  onExport: () => void
  onSave: () => void
  onReset: () => void
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-[28px] border border-[#DED4C7]/70 bg-[#FFFDF8]/80 px-5 py-4 shadow-[0_16px_40px_rgba(42,37,32,0.07)] backdrop-blur-xl dark:border-white/10 dark:bg-[#101010]/82">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.32em] text-[#8A8177] dark:text-white/35">Profile - V1.0</p>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h2 className="text-xl font-black tracking-[-0.05em] text-[#251F1A] dark:text-white">Recruiter-ready profile</h2>
          <span className="rounded-full bg-[#E7FFF4] px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#158A56] dark:bg-emerald-500/10 dark:text-emerald-300">
            {profileStrength}% ready
          </span>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <ConnectAccountButton
          icon={Linkedin}
          label={connections.linkedin ? "LinkedIn Connected" : "Connect LinkedIn"}
          active={connections.linkedin}
          tone="linkedin"
          onClick={() => onToggleConnection("linkedin")}
        />
        <ConnectAccountButton
          icon={Github}
          label={connections.github ? "GitHub Connected" : "Connect GitHub"}
          active={connections.github}
          tone="github"
          onClick={() => onToggleConnection("github")}
        />
        <ToolbarButton icon={Download} label={savedState === "exported" ? "Exported" : "Export"} onClick={onExport} />
        <ToolbarButton icon={Save} label={savedState === "saved" ? "Saved" : "Save"} onClick={onSave} />
        <ToolbarButton icon={RotateCcw} label="Reset" onClick={onReset} />
      </div>
    </div>
  )
}

function ProfileHeaderCard({
  profile,
  avatarSrc,
  onAvatarChange,
}: {
  profile: ProfileState
  avatarSrc: string
  onAvatarChange: (event: React.ChangeEvent<HTMLInputElement>) => void
}) {
  return (
    <motion.section
      layout
      className="rounded-[32px] border border-[#DED4C7]/70 bg-[#FFFDF8]/92 p-6 shadow-[0_20px_52px_rgba(42,37,32,0.09)] dark:border-white/10 dark:bg-[#101010]/92"
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <label className="group relative grid h-28 w-28 shrink-0 cursor-pointer place-items-center overflow-hidden rounded-full border-4 border-[#FFFDF8] bg-[#EEE8DF] shadow-[0_16px_42px_rgba(42,37,32,0.12)] dark:border-[#101010] dark:bg-white/[0.06]">
          <img src={avatarSrc} alt="Veer Virk profile" className="h-full w-full object-cover" />
          <span className="absolute inset-0 grid place-items-center bg-[#251F1A]/55 text-white opacity-0 transition group-hover:opacity-100">
            <Upload size={22} />
          </span>
          <input type="file" accept="image/*" className="sr-only" onChange={onAvatarChange} />
        </label>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-[#E7FFF4] px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#158A56] dark:bg-emerald-500/10 dark:text-emerald-300">
              <BadgeCheck size={13} />
              Verified by Aristotle
            </span>
            <span className="rounded-full bg-[#FFE8D8] px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#C45B22] dark:bg-orange-500/10 dark:text-orange-300">
              {profile.targetRole}
            </span>
          </div>
          <h1 className="mt-3 text-4xl font-black uppercase tracking-[-0.08em] text-[#251F1A] dark:text-white">Veer Virk</h1>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-[12px] font-bold text-[#756B63] dark:text-white/50">
            <span className="inline-flex items-center gap-1.5">
              <GraduationCap size={15} className="text-[#7C5CFF]" />
              Bachelor of Computer Science · University of Sydney
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin size={15} className="text-[#7C5CFF]" />
              Sydney, Australia
            </span>
            <span className="inline-flex items-center gap-1.5">
              <FileCheck2 size={15} className="text-[#7C5CFF]" />
              Graduating Nov 2026
            </span>
          </div>
        </div>
      </div>

      <blockquote className="mt-6 rounded-[24px] bg-[#F5F1EA] px-5 py-4 text-lg font-black leading-7 tracking-[-0.05em] text-[#382F29] dark:bg-white/[0.04] dark:text-white/78">
        “{profile.tagline}”
      </blockquote>

      <div className="my-5 h-px bg-[#DED4C7]/70 dark:bg-white/10" />

      <div className="flex flex-wrap gap-2">
        {profile.skills.map((skill) => (
          <SkillChip key={skill.name} skill={skill} />
        ))}
      </div>
    </motion.section>
  )
}

function IntroVideoCard({
  activeSlide,
  onPrevious,
  onNext,
}: {
  activeSlide: (typeof INTRO_SLIDES)[number]
  onPrevious: () => void
  onNext: () => void
}) {
  return (
    <section className="overflow-hidden rounded-[32px] border border-[#DED4C7]/70 bg-[#FFFDF8]/92 shadow-[0_20px_52px_rgba(42,37,32,0.08)] dark:border-white/10 dark:bg-[#101010]/92">
      <div className="relative aspect-video bg-[#251F1A]">
        {activeSlide.type === "video" ? (
          <video src={activeSlide.source} poster={activeSlide.poster} controls className="h-full w-full object-cover" />
        ) : (
          <img src={activeSlide.source} alt={activeSlide.label} className="h-full w-full object-cover" />
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-5 text-white">
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/14 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] backdrop-blur">
                <Play size={12} fill="currentColor" />
                Intro video
              </div>
              <p className="text-lg font-black tracking-[-0.05em]">{activeSlide.label}</p>
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-[11px] font-black text-[#251F1A]">{activeSlide.duration}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={onPrevious}
          className="absolute left-4 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-[#251F1A] shadow-xl transition hover:bg-white"
          aria-label="Previous intro slide"
        >
          <ArrowLeft size={17} />
        </button>
        <button
          type="button"
          onClick={onNext}
          className="absolute right-4 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-[#251F1A] shadow-xl transition hover:bg-white"
          aria-label="Next intro slide"
        >
          <ArrowRight size={17} />
        </button>
      </div>
    </section>
  )
}

function StatsRow() {
  const stats = [
    { label: "Hackathons", value: "04", tone: "bg-[#E7FFF4] text-[#158A56]" },
    { label: "Projects", value: "07", tone: "bg-[#EEE9FF] text-[#6B4EF6]" },
    { label: "Public repos", value: "12", tone: "bg-[#FFE8D8] text-[#C45B22]" },
    { label: "Certifications", value: "03", tone: "bg-[#FFF4B8] text-[#836600]" },
  ]

  return (
    <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-[26px] border border-[#DED4C7]/70 bg-[#FFFDF8]/92 p-4 shadow-[0_16px_40px_rgba(42,37,32,0.07)] dark:border-white/10 dark:bg-[#101010]/92"
        >
          <p className={cn("inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em]", stat.tone)}>
            {stat.label}
          </p>
          <p className="mt-4 text-4xl font-black tracking-[-0.08em] text-[#251F1A] dark:text-white">{stat.value}</p>
        </div>
      ))}
    </section>
  )
}

function RoleFitCard({ profile }: { profile: ProfileState }) {
  return (
    <section className="rounded-[32px] border border-[#DED4C7]/70 bg-[#FFFDF8]/92 p-5 shadow-[0_20px_52px_rgba(42,37,32,0.08)] dark:border-white/10 dark:bg-[#101010]/92">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#8A8177] dark:text-white/35">Role fit summary</p>
          <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-[#756B63] dark:text-white/55">{profile.roleFitSummary}</p>
        </div>
        <div className="rounded-[22px] bg-[#EEE9FF] px-4 py-3 text-center text-[#6B4EF6] dark:bg-[#7C5CFF]/12 dark:text-[#C9BEFF]">
          <p className="text-2xl font-black tracking-[-0.08em]">{profile.keywords.length}</p>
          <p className="text-[9px] font-black uppercase tracking-[0.16em]">signals</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {profile.keywords.map((keyword) => (
          <span
            key={keyword}
            className="rounded-full border border-[#DED4C7] bg-[#F5F1EA] px-3 py-1.5 text-[11px] font-black text-[#756B63] dark:border-white/10 dark:bg-white/[0.04] dark:text-white/50"
          >
            {keyword}
          </span>
        ))}
      </div>
    </section>
  )
}

function EvidenceBoxesSection({ boxes }: { boxes: EvidenceBox[] }) {
  if (!boxes.length) return null

  const iconMap: Record<EvidenceBox["icon"], React.ElementType> = {
    backend: Network,
    systems: Cpu,
    ai: Sparkles,
    leadership: Users,
  }

  return (
    <motion.section layout>
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#8A8177] dark:text-white/35">Recruiter evidence</p>
          <h2 className="mt-1 text-2xl font-black tracking-[-0.06em] text-[#251F1A] dark:text-white">Tailored signal boxes</h2>
        </div>
        <span className="hidden rounded-full bg-[#EEE9FF] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-[#6B4EF6] sm:inline-flex dark:bg-[#7C5CFF]/12 dark:text-[#C9BEFF]">
          {boxes.length} added
        </span>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {boxes.map((box) => {
          const Icon = iconMap[box.icon]
          return (
            <motion.article
              layout
              key={box.title}
              className="rounded-[28px] border border-[#DED4C7]/70 bg-[#FFFDF8]/92 p-5 shadow-[0_18px_46px_rgba(42,37,32,0.07)] dark:border-white/10 dark:bg-[#101010]/92"
            >
              <div className="flex items-start gap-4">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#EEE9FF] text-[#6B4EF6] dark:bg-[#7C5CFF]/14 dark:text-[#C9BEFF]">
                  <Icon size={19} />
                </span>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#7C5CFF]">{box.label}</p>
                  <h3 className="mt-1 text-lg font-black tracking-[-0.05em] text-[#251F1A] dark:text-white">{box.title}</h3>
                </div>
              </div>
              <p className="mt-4 text-sm font-semibold leading-6 text-[#756B63] dark:text-white/55">{box.description}</p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {box.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-[#F5F1EA] px-2.5 py-1 text-[10px] font-black text-[#756B63] dark:bg-white/[0.05] dark:text-white/45">
                    {tag}
                  </span>
                ))}
              </div>
            </motion.article>
          )
        })}
      </div>
    </motion.section>
  )
}

function ExperienceSection({ experiences }: { experiences: ExperienceItem[] }) {
  if (!experiences.length) return null

  return (
    <motion.section layout>
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#8A8177] dark:text-white/35">Experience</p>
          <h2 className="mt-1 text-2xl font-black tracking-[-0.06em] text-[#251F1A] dark:text-white">Work and leadership timeline</h2>
        </div>
        <span className="hidden rounded-full bg-[#E7FFF4] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-[#158A56] sm:inline-flex">
          {experiences.length} entries
        </span>
      </div>
      <div className="space-y-4">
        {experiences.map((experience) => (
          <motion.article
            layout
            key={`${experience.company}-${experience.role}`}
            className="rounded-[30px] border border-[#DED4C7]/70 bg-[#FFFDF8]/92 p-5 shadow-[0_18px_46px_rgba(42,37,32,0.08)] dark:border-white/10 dark:bg-[#101010]/92"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <CompanyLogo logo={experience.logo} company={experience.company} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#7C5CFF]">{experience.company}</p>
                    <h3 className="mt-1 text-xl font-black tracking-[-0.06em] text-[#251F1A] dark:text-white">{experience.role}</h3>
                  </div>
                  <div className="flex flex-col gap-2 text-[11px] font-black uppercase tracking-[0.12em] text-[#8A8177] dark:text-white/40 sm:items-end">
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays size={13} />
                      {experience.duration}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin size={13} />
                      {experience.location}
                    </span>
                  </div>
                </div>
                <p className="mt-3 text-sm font-semibold leading-6 text-[#756B63] dark:text-white/55">{experience.description}</p>
                <div className="mt-4 grid gap-2">
                  {experience.bullets.map((bullet) => (
                    <div key={bullet} className="flex gap-2 text-[12px] font-bold leading-5 text-[#756B63] dark:text-white/55">
                      <Check size={14} className="mt-0.5 shrink-0 text-[#158A56]" />
                      <span>{bullet}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {experience.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-[#F5F1EA] px-2.5 py-1 text-[10px] font-black text-[#756B63] dark:bg-white/[0.05] dark:text-white/45">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.article>
        ))}
      </div>
    </motion.section>
  )
}

function CompanyLogo({ logo, company }: { logo: ExperienceItem["logo"]; company: string }) {
  if (logo === "microsoft") {
    return (
      <span aria-label={`${company} logo`} className="grid h-14 w-14 shrink-0 grid-cols-2 gap-1 rounded-2xl bg-white p-3 shadow-[0_12px_28px_rgba(42,37,32,0.08)] dark:bg-white/90">
        <span className="bg-[#F25022]" />
        <span className="bg-[#7FBA00]" />
        <span className="bg-[#00A4EF]" />
        <span className="bg-[#FFB900]" />
      </span>
    )
  }

  if (logo === "ibm") {
    return (
      <span
        aria-label={`${company} logo`}
        className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[#0F62FE] text-[17px] font-black tracking-[0.12em] text-white shadow-[0_12px_28px_rgba(15,98,254,0.2)]"
      >
        IBM
      </span>
    )
  }

  if (logo === "doordash") {
    return (
      <span
        aria-label={`${company} logo`}
        className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[#FF3008] text-[17px] font-black tracking-[-0.04em] text-white shadow-[0_12px_28px_rgba(255,48,8,0.2)]"
      >
        DD
      </span>
    )
  }

  return (
    <span aria-label={`${company} logo`} className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[#EEE9FF] text-[#6B4EF6] shadow-[0_12px_28px_rgba(124,92,255,0.14)] dark:bg-[#7C5CFF]/14 dark:text-[#C9BEFF]">
      <OmniLogo size={24} />
    </span>
  )
}

function VerifiedProofSection({ projects }: { projects: Project[] }) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#8A8177] dark:text-white/35">Verified proof</p>
          <h2 className="mt-1 text-2xl font-black tracking-[-0.06em] text-[#251F1A] dark:text-white">Project evidence stack</h2>
        </div>
        <span className="hidden rounded-full bg-[#E7FFF4] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-[#158A56] sm:inline-flex">
          4 proofs
        </span>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </section>
  )
}

function ProjectCard({ project }: { project: Project }) {
  return (
    <motion.article
      layout
      className="overflow-hidden rounded-[28px] border border-[#DED4C7]/70 bg-[#FFFDF8]/92 shadow-[0_18px_46px_rgba(42,37,32,0.08)] dark:border-white/10 dark:bg-[#101010]/92"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-[#EEE8DF]">
        <img src={project.image} alt={project.title} className="h-full w-full object-cover transition duration-500 hover:scale-[1.04]" />
        <span className="absolute right-3 top-3 rounded-full bg-white/92 px-2.5 py-1 text-[10px] font-black text-[#251F1A] shadow-lg">
          {project.proofScore} proof
        </span>
      </div>
      <div className="p-4">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#7C5CFF]">{project.subtitle}</p>
        <h3 className="mt-1 text-xl font-black tracking-[-0.06em] text-[#251F1A] dark:text-white">{project.title}</h3>
        <p className="mt-2 text-[12px] font-semibold leading-5 text-[#756B63] dark:text-white/55">{project.description}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {project.tags.map((tag) => (
            <span key={tag} className="rounded-full bg-[#F5F1EA] px-2.5 py-1 text-[10px] font-black text-[#756B63] dark:bg-white/[0.05] dark:text-white/45">
              {tag}
            </span>
          ))}
        </div>
        <button className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#251F1A] px-4 py-2 text-[11px] font-black uppercase tracking-[0.12em] text-white transition hover:bg-[#7C5CFF] dark:bg-white dark:text-[#111] dark:hover:bg-[#C9BEFF]">
          {project.action}
          <ExternalLink size={13} />
        </button>
      </div>
    </motion.article>
  )
}

function EndorsementsSection() {
  const endorsements = [
    {
      quote: "Veer consistently turns vague product goals into interfaces that are easy to review and improve.",
      author: "John Doe",
      role: "Tutor",
    },
    {
      quote: "The strongest signal is follow-through: he documents decisions, ships working demos, and asks useful product questions.",
      author: "Maya Shah",
      role: "Project mentor",
    },
  ]

  return (
    <section>
      <p className="mb-3 text-[10px] font-black uppercase tracking-[0.3em] text-[#8A8177] dark:text-white/35">Endorsements</p>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {endorsements.map((endorsement) => (
          <article
            key={endorsement.author}
            className="rounded-[28px] border border-[#DED4C7]/70 bg-[#FFFDF8]/92 p-5 shadow-[0_18px_46px_rgba(42,37,32,0.07)] dark:border-white/10 dark:bg-[#101010]/92"
          >
            <p className="text-lg font-black leading-7 tracking-[-0.05em] text-[#251F1A] dark:text-white">“{endorsement.quote}”</p>
            <p className="mt-4 text-sm font-black text-[#251F1A] dark:text-white">{endorsement.author}</p>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#8A8177] dark:text-white/35">{endorsement.role}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

function RecruiterInsightsPanel({ profile, profileStrength }: { profile: ProfileState; profileStrength: number }) {
  return (
    <aside className="relative space-y-4">
      <div className="space-y-4">
        <InsightCard title="Recruiter insights" icon={BarChart3}>
          <div className="space-y-3">
            {profile.insights.map((insight) => (
              <div key={insight} className="flex gap-2 text-sm font-bold leading-5 text-[#756B63] dark:text-white/55">
                <ChevronUp size={15} className="mt-0.5 shrink-0 text-[#158A56]" />
                <span>{insight}</span>
              </div>
            ))}
          </div>
        </InsightCard>

        <InsightCard title="Recruiter checklist" icon={ShieldCheck}>
          <div className="space-y-3">
            {profile.checklist.map((item) => (
              <div key={item.label} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-[#E7FFF4] text-[#158A56] dark:bg-emerald-500/10 dark:text-emerald-300">
                    <Check size={14} />
                  </span>
                  <span className="text-sm font-black text-[#251F1A] dark:text-white">{item.label}</span>
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#8A8177] dark:text-white/35">{item.status}</span>
              </div>
            ))}
          </div>
        </InsightCard>

        <InsightCard title="Readiness meter" icon={BriefcaseBusiness}>
          <ReadinessBar label="Frontend" value={profile.readiness.frontend} />
          <ReadinessBar label="Backend" value={profile.readiness.backend} />
          <ReadinessBar label="AI product" value={profile.readiness.aiProduct} />
          <div className="mt-4 rounded-[22px] bg-[#EEE9FF] p-4 text-[#6B4EF6] dark:bg-[#7C5CFF]/12 dark:text-[#C9BEFF]">
            <p className="text-4xl font-black tracking-[-0.08em]">{profileStrength}%</p>
            <p className="text-[10px] font-black uppercase tracking-[0.18em]">overall recruiter readiness</p>
          </div>
        </InsightCard>

        <InsightCard title="Interview talking points" icon={BookOpen}>
          <div className="space-y-3">
            {profile.talkingPoints.map((point, index) => (
              <div key={point} className="flex gap-3 text-sm font-semibold leading-5 text-[#756B63] dark:text-white/55">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#F5F1EA] text-[10px] font-black text-[#7C5CFF] dark:bg-white/[0.05]">
                  {index + 1}
                </span>
                <span>{point}</span>
              </div>
            ))}
          </div>
        </InsightCard>
      </div>
    </aside>
  )
}

function AristotleLogo({ active }: { active: boolean }) {
  return (
    <div className="relative grid h-24 w-24 place-items-center">
      <motion.div
        animate={{ scale: active ? [1, 1.08, 1] : 1 }}
        transition={{ duration: 1.2, repeat: active ? Infinity : 0 }}
        className="grid place-items-center"
      >
        <OmniLogo size={36} className="text-[#7C5CFF] dark:text-[#C9BEFF]" />
      </motion.div>
    </div>
  )
}

function SkillChip({ skill }: { skill: Skill }) {
  const tones: Record<Skill["tone"], string> = {
    mint: "bg-[#E7FFF4] text-[#158A56]",
    lavender: "bg-[#EEE9FF] text-[#6B4EF6]",
    coral: "bg-[#FFE3E1] text-[#B94B42]",
    peach: "bg-[#FFE8D8] text-[#C45B22]",
    yellow: "bg-[#FFF4B8] text-[#836600]",
    blue: "bg-[#E6F2FF] text-[#2770B8]",
  }

  return (
    <span className={cn("rounded-full px-3 py-2 text-[11px] font-black uppercase tracking-[0.12em]", tones[skill.tone])}>
      {skill.name} {skill.score}%
    </span>
  )
}

function ToolbarButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ElementType
  label: string
  onClick: () => void
}) {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      className="h-10 rounded-full border-[#DED4C7] bg-[#FFFDF8]/70 px-4 text-[10px] font-black uppercase tracking-[0.16em] text-[#251F1A] hover:bg-[#EEE9FF] hover:text-[#6B4EF6] dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:hover:bg-[#7C5CFF]/15"
    >
      <Icon size={14} />
      {label}
    </Button>
  )
}

function ConnectAccountButton({
  icon: Icon,
  label,
  active,
  tone,
  onClick,
}: {
  icon: React.ElementType
  label: string
  active: boolean
  tone: "linkedin" | "github"
  onClick: () => void
}) {
  const activeClass =
    tone === "linkedin"
      ? "border-[#0A66C2]/35 bg-[#E7F1FF] text-[#0A66C2] dark:bg-[#0A66C2]/15 dark:text-[#80BFFF]"
      : "border-[#251F1A]/20 bg-[#251F1A] text-white dark:border-white/20 dark:bg-white dark:text-[#111]"
  const idleClass =
    tone === "linkedin"
      ? "border-[#DED4C7] bg-[#FFFDF8]/70 text-[#251F1A] hover:border-[#0A66C2]/35 hover:bg-[#E7F1FF] hover:text-[#0A66C2] dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:hover:bg-[#0A66C2]/15 dark:hover:text-[#80BFFF]"
      : "border-[#DED4C7] bg-[#FFFDF8]/70 text-[#251F1A] hover:border-[#251F1A]/25 hover:bg-[#251F1A] hover:text-white dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:hover:bg-white dark:hover:text-[#111]"

  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      className={cn(
        "h-10 rounded-full px-4 text-[10px] font-black uppercase tracking-[0.16em] transition",
        active ? activeClass : idleClass
      )}
    >
      <Icon size={14} />
      {label}
    </Button>
  )
}

function InsightCard({
  title,
  icon: Icon,
  children,
}: {
  title: string
  icon: React.ElementType
  children: React.ReactNode
}) {
  return (
    <section className="rounded-[28px] border border-[#DED4C7]/70 bg-[#FFFDF8]/86 p-5 shadow-[0_18px_46px_rgba(42,37,32,0.07)] dark:border-white/10 dark:bg-[#101010]/88">
      <div className="mb-4 flex items-center gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-[#EEE9FF] text-[#6B4EF6] dark:bg-[#7C5CFF]/14 dark:text-[#C9BEFF]">
          <Icon size={17} />
        </span>
        <h3 className="text-sm font-black tracking-[-0.03em] text-[#251F1A] dark:text-white">{title}</h3>
      </div>
      {children}
    </section>
  )
}

function ReadinessBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="mb-3">
      <div className="mb-1 flex items-center justify-between text-[11px] font-black uppercase tracking-[0.14em] text-[#756B63] dark:text-white/45">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[#EEE8DF] dark:bg-white/[0.08]">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="h-full rounded-full bg-[#7C5CFF]"
        />
      </div>
    </div>
  )
}
