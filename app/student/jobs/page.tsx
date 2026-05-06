"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import {
  ArrowUp,
  Bookmark,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  ExternalLink,
  Globe2,
  MapPin,
  Radar,
  Search,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { OmniLogo } from "@/components/omni-logo"
import { cn } from "@/lib/utils"
import airbnbLogo from "../../../logos_new/normalized/airbnb.png"
import altoSystemsLogo from "../../../logos_new/normalized/alto_systems.png"
import amazonLogo from "../../../logos_new/normalized/amazon.png"
import appleLogo from "../../../logos_new/normalized/apple.png"
import atlassianLogo from "../../../logos_new/normalized/atlassian.png"
import beaconCloudLogo from "../../../logos_new/normalized/beacon_cloud.png"
import canvaLogo from "../../../logos_new/normalized/canva.png"
import doordashLogo from "../../../logos_new/normalized/doordash.png"
import googleLogo from "../../../logos_new/normalized/google.png"
import googleCloudLogo from "../../../logos_new/normalized/google_cloud.png"
import helioAiLogo from "../../../logos_new/normalized/helio_ai.png"
import meridianBioLogo from "../../../logos_new/normalized/meridian_bio.png"
import metaLogo from "../../../logos_new/normalized/meta.png"
import microsoftLogo from "../../../logos_new/normalized/microsoft.png"
import netflixLogo from "../../../logos_new/normalized/netflix.png"
import northstarLabsLogo from "../../../logos_new/normalized/northstar_labs.png"
import orbitCommerceLogo from "../../../logos_new/normalized/orbit_commerce.png"
import stacklineStudioLogo from "../../../logos_new/normalized/stackline_studio.png"
import stripeLogo from "../../../logos_new/normalized/stripe.png"
import uberLogo from "../../../logos_new/normalized/uber.png"
import vantaflowLogo from "../../../logos_new/normalized/vantaflow.png"

type JobRole = {
  id: string
  monogram: string
  company: string
  logo?: CompanyLogoId
  logoUrl?: string
  companyType?: "startup" | "mnc"
  posted: string
  location: string
  type: string
  title: string
  tags: string[]
  why: string
  salary: string
  fit: number
  industry: string
  teamSize: string
  hq: string
  brief: string
  requirements: string[]
  sourceUrl: string
}

type CompanyLogoId =
  | "northstar"
  | "orbit"
  | "vantaflow"
  | "stackline"
  | "beacon"
  | "helio"
  | "alto"
  | "meridian"
  | "googleCloud"
  | "google"
  | "meta"
  | "amazon"
  | "apple"
  | "netflix"
  | "microsoft"
  | "doordash"
  | "stripe"
  | "canva"
  | "atlassian"
  | "airbnb"
  | "uber"

type ChatMessage = {
  id: string
  sender: "acolumbus" | "user"
  text: string
  actions?: string[]
  state?: "thinking"
}

type FilterId = "all" | "remote" | "full-time" | "internship" | "startup" | "mnc" | "high-fit" | "company"
type SearchMode = "default" | "backend-profile" | "faang-backend" | "google-intern" | "startup-remote" | "mnc-product"

const SOURCES = "RemoteOK - HN Who's Hiring - GitHub Jobs Archive - Adzuna - Company career pages"
const JOB_SCROLLBAR =
  "[scrollbar-gutter:stable] [scrollbar-width:thin] [scrollbar-color:#D7CEC2_transparent] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:border-2 [&::-webkit-scrollbar-thumb]:border-transparent [&::-webkit-scrollbar-thumb]:bg-[#CFC5B8] [&::-webkit-scrollbar-thumb]:bg-clip-padding hover:[&::-webkit-scrollbar-thumb]:bg-[#FFB176] dark:[scrollbar-color:rgba(255,255,255,0.18)_transparent] dark:[&::-webkit-scrollbar-thumb]:bg-white/18 dark:hover:[&::-webkit-scrollbar-thumb]:bg-orange-300/45"

const FILTERS: { id: FilterId; label: string }[] = [
  { id: "all", label: "All" },
  { id: "remote", label: "Remote" },
  { id: "full-time", label: "Full-time" },
  { id: "internship", label: "Internship" },
  { id: "startup", label: "Startups" },
  { id: "mnc", label: "MNC" },
  { id: "high-fit", label: "90%+ Match" },
  { id: "company", label: "By Company" },
]

const QUICK_PROMPTS = [
  "Find me backend roles based on my experience and profile",
  "Backend roles at FAANG companies",
  "Intern roles at Google, any roles",
  "Remote startup backend roles with Python and SQL",
  "MNC product engineering roles in Sydney",
]

const LOCAL_COMPANY_LOGOS: Partial<Record<CompanyLogoId, string>> = {
  airbnb: airbnbLogo.src,
  alto: altoSystemsLogo.src,
  amazon: amazonLogo.src,
  apple: appleLogo.src,
  atlassian: atlassianLogo.src,
  beacon: beaconCloudLogo.src,
  canva: canvaLogo.src,
  doordash: doordashLogo.src,
  google: googleLogo.src,
  googleCloud: googleCloudLogo.src,
  helio: helioAiLogo.src,
  meridian: meridianBioLogo.src,
  meta: metaLogo.src,
  microsoft: microsoftLogo.src,
  netflix: netflixLogo.src,
  northstar: northstarLabsLogo.src,
  orbit: orbitCommerceLogo.src,
  stackline: stacklineStudioLogo.src,
  stripe: stripeLogo.src,
  uber: uberLogo.src,
  vantaflow: vantaflowLogo.src,
}

const ROLES: JobRole[] = [
  {
    id: "northstar-labs",
    monogram: "NL",
    company: "Northstar Labs",
    logo: "northstar",
    companyType: "startup",
    posted: "2h ago",
    location: "Remote",
    type: "Full-time",
    title: "Frontend Engineer",
    tags: ["React", "Next.js", "TypeScript", "CSS"],
    why: "Strong match for product UI, component systems, and TypeScript-heavy SaaS work.",
    salary: "$78-96K",
    fit: 96,
    industry: "EdTech SaaS",
    teamSize: "58 employees",
    hq: "Remote-first",
    brief:
      "Northstar Labs builds learning infrastructure for cohort-based education teams. The role sits close to product and asks for a frontend engineer who can ship polished learning workflows across dashboards, content tools, and student-facing surfaces.",
    requirements: [
      "1+ year building React applications",
      "Strong CSS and component systems fluency",
      "Comfort with API integration and product QA",
      "Portfolio or shipped work that shows interface judgment",
    ],
    sourceUrl: "https://remoteok.com",
  },
  {
    id: "orbit-commerce",
    monogram: "OC",
    company: "Orbit Commerce",
    logo: "orbit",
    companyType: "startup",
    posted: "5h ago",
    location: "Remote",
    type: "Full-time",
    title: "Frontend Developer",
    tags: ["Next.js", "React", "TypeScript", "Tailwind"],
    why: "Next.js commerce UI work lines up with your app-shell and product interface projects.",
    salary: "$70-88K",
    fit: 93,
    industry: "Commerce tooling",
    teamSize: "42 employees",
    hq: "Remote - US/EU overlap",
    brief:
      "Orbit Commerce helps small marketplace teams launch storefront workflows with analytics and inventory integrations. This frontend seat focuses on fast-moving product surfaces, checkout experiments, and internal merchant tools.",
    requirements: [
      "Experience with Next.js app routes",
      "Comfort building accessible form-heavy interfaces",
      "Strong TypeScript fundamentals",
      "Ability to tune loading states and frontend performance",
    ],
    sourceUrl: "https://news.ycombinator.com",
  },
  {
    id: "vantaflow",
    monogram: "VF",
    company: "VantaFlow",
    logo: "vantaflow",
    companyType: "startup",
    posted: "1d ago",
    location: "Remote",
    type: "Full-time",
    title: "React Engineer",
    tags: ["React", "TypeScript", "Design Systems"],
    why: "High fit for reusable components, dashboard polish, and product-minded UI execution.",
    salary: "$76-94K",
    fit: 91,
    industry: "Workflow automation",
    teamSize: "73 employees",
    hq: "Remote-first",
    brief:
      "VantaFlow builds workflow software for finance and operations teams. The role is ideal for a React engineer who can turn dense processes into calm, repeatable product flows.",
    requirements: [
      "Production React experience",
      "Component architecture and design-token familiarity",
      "Comfort with complex tables, filters, and workflows",
      "Clear communication with product and design partners",
    ],
    sourceUrl: "https://www.adzuna.com",
  },
  {
    id: "stackline-studio",
    monogram: "SS",
    company: "Stackline Studio",
    logo: "stackline",
    companyType: "startup",
    posted: "1d ago",
    location: "Remote",
    type: "Full-time",
    title: "Product Engineer",
    tags: ["React", "Node", "SQL", "TypeScript"],
    why: "Broad product engineering role rewards both interface judgment and backend integration.",
    salary: "$82-102K",
    fit: 90,
    industry: "Product studio",
    teamSize: "26 employees",
    hq: "Remote - EST overlap",
    brief:
      "Stackline Studio ships early-stage SaaS products for funded teams. Engineers work across discovery, prototype polish, production features, and customer feedback loops.",
    requirements: [
      "Full-stack TypeScript comfort",
      "Experience shipping product features quickly",
      "SQL fundamentals",
      "Ability to own ambiguous product problems",
    ],
    sourceUrl: "https://remoteok.com",
  },
  {
    id: "beacon-cloud",
    monogram: "BC",
    company: "Beacon Cloud",
    logo: "beacon",
    companyType: "mnc",
    posted: "2d ago",
    location: "Hybrid - Bengaluru",
    type: "Full-time",
    title: "UI Engineer",
    tags: ["React", "CSS", "TypeScript"],
    why: "UI systems and dashboard implementation match your current product workspace experience.",
    salary: "$18-24K",
    fit: 88,
    industry: "Cloud infrastructure",
    teamSize: "120 employees",
    hq: "Bengaluru",
    brief:
      "Beacon Cloud makes deployment and monitoring tools for infrastructure teams. The UI engineer will refine dashboards, usage charts, billing flows, and developer-facing onboarding.",
    requirements: [
      "React and modern CSS experience",
      "Dashboard or admin UI experience",
      "Comfort working with REST APIs",
      "Attention to interaction states and empty states",
    ],
    sourceUrl: "https://github.com",
  },
  {
    id: "helio-ai",
    monogram: "HA",
    company: "Helio AI",
    logo: "helio",
    companyType: "startup",
    posted: "3d ago",
    location: "Remote",
    type: "Internship",
    title: "Machine Learning Intern",
    tags: ["Python", "ML", "Data", "APIs"],
    why: "Good exploratory fit if you want applied ML work with product-adjacent datasets.",
    salary: "$1,200/month",
    fit: 84,
    industry: "Applied AI",
    teamSize: "34 employees",
    hq: "Remote - APAC friendly",
    brief:
      "Helio AI builds small business automation models for document classification and workflow routing. The internship supports dataset preparation, evaluation notebooks, and lightweight model-serving experiments.",
    requirements: [
      "Python scripting ability",
      "Basic ML workflow familiarity",
      "Comfort reading datasets and model outputs",
      "Clear experiment notes and reproducible notebooks",
    ],
    sourceUrl: "https://www.adzuna.com",
  },
  {
    id: "alto-systems",
    monogram: "AS",
    company: "Alto Systems",
    logo: "alto",
    companyType: "mnc",
    posted: "4d ago",
    location: "Hybrid - Sydney",
    type: "Full-time",
    title: "Backend Engineer",
    tags: ["Python", "APIs", "Postgres"],
    why: "Backend API and data-modeling work fits a candidate targeting product infrastructure roles.",
    salary: "$85-105K",
    fit: 81,
    industry: "B2B infrastructure",
    teamSize: "86 employees",
    hq: "Sydney",
    brief:
      "Alto Systems helps operations teams automate internal approvals and compliance workflows. Backend engineers own service APIs, data models, and integration reliability.",
    requirements: [
      "Python backend experience",
      "REST API and database fundamentals",
      "Comfort debugging production issues",
      "Interest in workflow and integration systems",
    ],
    sourceUrl: "https://news.ycombinator.com",
  },
  {
    id: "meridian-bio",
    monogram: "MB",
    company: "Meridian Bio",
    logo: "meridian",
    companyType: "mnc",
    posted: "5d ago",
    location: "Hybrid - Melbourne",
    type: "Internship",
    title: "Data Analyst Intern",
    tags: ["SQL", "Python", "Dashboards"],
    why: "Useful fit for analytics practice, SQL repetition, and stakeholder-facing reporting.",
    salary: "$1,500/month",
    fit: 76,
    industry: "Biotech operations",
    teamSize: "210 employees",
    hq: "Melbourne",
    brief:
      "Meridian Bio supports lab operations with internal analytics and forecasting tools. The internship focuses on SQL reporting, operational dashboards, and data-quality checks.",
    requirements: [
      "SQL query experience",
      "Basic Python or spreadsheet automation",
      "Comfort turning questions into metrics",
      "Interest in healthcare or lab operations",
    ],
    sourceUrl: "https://www.adzuna.com",
  },
]

type StagedRoleInput = Omit<JobRole, "posted" | "brief" | "requirements" | "sourceUrl"> &
  Partial<Pick<JobRole, "posted" | "brief" | "requirements" | "sourceUrl">>

function stagedRole(role: StagedRoleInput): JobRole {
  return {
    posted: "Live now",
    brief: `${role.company} has an open ${role.title} role. Columbus ranked it against Veer's profile, project proof, and preferred backend/product engineering trajectory.`,
    requirements: [
      "Strong fundamentals in APIs, data models, and product-facing engineering",
      "Ability to explain tradeoffs clearly during technical interviews",
      "Evidence of shipped projects, debugging, and ownership",
      "Comfort learning company-specific systems quickly",
    ],
    sourceUrl: "https://www.linkedin.com/jobs",
    ...role,
  }
}

const BACKEND_PROFILE_ROLES: JobRole[] = [
  stagedRole({
    id: "doordash-backend-profile",
    monogram: "DD",
    company: "DoorDash",
    logo: "doordash",
    companyType: "mnc",
    location: "Hybrid - Sydney",
    type: "Full-time",
    title: "Backend Engineer - Marketplace",
    tags: ["Python", "Go", "Postgres", "Redis"],
    why: "Best fit for Veer's backend prompt: API contracts, SQL proof, reliability talking points, and marketplace workflow interest.",
    salary: "$118-145K",
    fit: 96,
    industry: "Marketplace logistics",
    teamSize: "19,000+ employees",
    hq: "San Francisco / Sydney hub",
  }),
  stagedRole({
    id: "stripe-platform-profile",
    monogram: "ST",
    company: "Stripe",
    logo: "stripe",
    companyType: "mnc",
    location: "Remote",
    type: "Full-time",
    title: "API Platform Engineer",
    tags: ["APIs", "TypeScript", "Reliability", "Docs"],
    why: "Strong profile match for API design, product-quality docs, and clean integration thinking from Ingen HR and CRM Toolkit.",
    salary: "$125-158K",
    fit: 94,
    industry: "Financial infrastructure",
    teamSize: "7,000+ employees",
    hq: "Dublin / San Francisco",
  }),
  stagedRole({
    id: "atlassian-backend-profile",
    monogram: "AT",
    company: "Atlassian",
    logo: "atlassian",
    companyType: "mnc",
    location: "Remote - Australia",
    type: "Full-time",
    title: "Backend Product Engineer",
    tags: ["Java", "APIs", "Cloud", "SQL"],
    why: "Good match for Sydney availability, backend growth, and product workflow experience across dashboards and saved-state systems.",
    salary: "$105-132K",
    fit: 91,
    industry: "Team collaboration software",
    teamSize: "12,000+ employees",
    hq: "Sydney",
  }),
  stagedRole({
    id: "canva-backend-profile",
    monogram: "CA",
    company: "Canva",
    logo: "canva",
    companyType: "mnc",
    location: "Hybrid - Sydney",
    type: "Full-time",
    title: "Backend Engineer - Growth Platform",
    tags: ["Java", "SQL", "Experimentation", "APIs"],
    why: "Matches Veer's product-facing engineering story and Sydney profile, with room to show backend readiness through data and APIs.",
    salary: "$112-140K",
    fit: 90,
    industry: "Design productivity",
    teamSize: "5,000+ employees",
    hq: "Sydney",
  }),
  stagedRole({
    id: "uber-backend-profile",
    monogram: "UB",
    company: "Uber",
    logo: "uber",
    companyType: "mnc",
    location: "Hybrid - Sydney",
    type: "Full-time",
    title: "Backend Engineer - Mobility Systems",
    tags: ["Go", "Microservices", "SQL", "Kafka"],
    why: "Relevant for marketplace systems, operational reliability, and backend interview stories around scale and customer impact.",
    salary: "$120-150K",
    fit: 88,
    industry: "Mobility marketplace",
    teamSize: "30,000+ employees",
    hq: "San Francisco / Sydney hub",
  }),
]

const FAANG_BACKEND_ROLES: JobRole[] = [
  stagedRole({
    id: "google-backend-faang",
    monogram: "G",
    company: "Google",
    logo: "google",
    companyType: "mnc",
    location: "Sydney",
    type: "Full-time",
    title: "Software Engineer - Backend Infrastructure",
    tags: ["C++", "Go", "Distributed Systems", "APIs"],
    why: "Columbus ranks this as the top FAANG backend stretch: strong CS degree signal plus backend proof from APIs and data workflows.",
    salary: "$135-170K",
    fit: 91,
    industry: "Search, cloud, and AI platforms",
    teamSize: "180,000+ employees",
    hq: "Mountain View / Sydney",
  }),
  stagedRole({
    id: "meta-backend-faang",
    monogram: "M",
    company: "Meta",
    logo: "meta",
    companyType: "mnc",
    location: "Remote / Singapore",
    type: "Full-time",
    title: "Backend Software Engineer - Product Systems",
    tags: ["Hack", "GraphQL", "Ranking", "Systems"],
    why: "Good fit for product systems, ranking logic, and the recruiter workflow evidence in Veer's portfolio.",
    salary: "$132-168K",
    fit: 89,
    industry: "Social products and AI",
    teamSize: "70,000+ employees",
    hq: "Menlo Park",
  }),
  stagedRole({
    id: "amazon-backend-faang",
    monogram: "AZ",
    company: "Amazon",
    logo: "amazon",
    companyType: "mnc",
    location: "Sydney",
    type: "Full-time",
    title: "SDE I - Backend Services",
    tags: ["Java", "AWS", "DynamoDB", "APIs"],
    why: "Strongest early-career FAANG fit because SDE I expectations line up with projects, API fundamentals, and ownership stories.",
    salary: "$118-148K",
    fit: 93,
    industry: "Commerce and cloud",
    teamSize: "1.5M+ employees",
    hq: "Seattle / Sydney",
  }),
  stagedRole({
    id: "apple-backend-faang",
    monogram: "AP",
    company: "Apple",
    logo: "apple",
    companyType: "mnc",
    location: "Sydney",
    type: "Full-time",
    title: "Software Engineer - Services Platform",
    tags: ["Java", "Python", "Services", "Monitoring"],
    why: "Useful FAANG option if Veer wants reliability and services work with a polished product-quality bar.",
    salary: "$125-160K",
    fit: 87,
    industry: "Consumer devices and services",
    teamSize: "160,000+ employees",
    hq: "Cupertino",
  }),
  stagedRole({
    id: "netflix-backend-faang",
    monogram: "NX",
    company: "Netflix",
    logo: "netflix",
    companyType: "mnc",
    location: "Remote",
    type: "Full-time",
    title: "Backend Engineer - Content Platform",
    tags: ["Java", "Distributed Systems", "Data", "APIs"],
    why: "Lower-volume but high-upside fit for backend systems, product data, and reliability narratives.",
    salary: "$150-190K",
    fit: 84,
    industry: "Streaming entertainment",
    teamSize: "13,000+ employees",
    hq: "Los Gatos",
  }),
]

const GOOGLE_INTERN_ROLES: JobRole[] = [
  stagedRole({
    id: "google-swe-intern",
    monogram: "G",
    company: "Google",
    logo: "google",
    companyType: "mnc",
    location: "Sydney",
    type: "Internship",
    title: "Software Engineering Intern",
    tags: ["C++", "Python", "Algorithms", "Systems"],
    why: "Best Google internship route based on Veer's CS degree, project proof, and backend/frontend balance.",
    salary: "$7,500/month",
    fit: 94,
    industry: "Search, cloud, and AI platforms",
    teamSize: "180,000+ employees",
    hq: "Mountain View / Sydney",
  }),
  stagedRole({
    id: "google-cloud-intern",
    monogram: "G",
    company: "Google Cloud",
    logo: "googleCloud",
    companyType: "mnc",
    location: "Remote / Sydney",
    type: "Internship",
    title: "Cloud Technical Intern",
    tags: ["Cloud", "APIs", "Python", "Docs"],
    why: "Good fit for API integration, technical writing, and recruiter-ready project documentation.",
    salary: "$6,800/month",
    fit: 89,
    industry: "Cloud infrastructure",
    teamSize: "180,000+ employees",
    hq: "Mountain View",
  }),
  stagedRole({
    id: "google-data-intern",
    monogram: "G",
    company: "Google",
    logo: "google",
    companyType: "mnc",
    location: "Sydney",
    type: "Internship",
    title: "Data Engineering Intern",
    tags: ["SQL", "Python", "Pipelines", "Dashboards"],
    why: "Matches Veer's CRM Toolkit and SQL evidence if he wants a data-heavy Google route.",
    salary: "$7,100/month",
    fit: 86,
    industry: "Data platforms",
    teamSize: "180,000+ employees",
    hq: "Mountain View / Sydney",
  }),
  stagedRole({
    id: "google-step-intern",
    monogram: "G",
    company: "Google",
    logo: "google",
    companyType: "mnc",
    location: "APAC",
    type: "Internship",
    title: "STEP Intern",
    tags: ["CS Fundamentals", "Mentorship", "Projects"],
    why: "Good backup route for structured early-career mentorship and interview practice.",
    salary: "$5,900/month",
    fit: 82,
    industry: "Software engineering education",
    teamSize: "180,000+ employees",
    hq: "Mountain View",
  }),
]

const STARTUP_REMOTE_ROLES: JobRole[] = [
  stagedRole({
    id: "airbnb-startup-remote",
    monogram: "AB",
    company: "Airbnb",
    logo: "airbnb",
    companyType: "mnc",
    location: "Remote",
    type: "Full-time",
    title: "Backend Product Engineer",
    tags: ["Ruby", "Java", "Search", "APIs"],
    why: "Marketplace product backend fit with strong user-flow and saved-state relevance.",
    salary: "$125-160K",
    fit: 88,
    industry: "Travel marketplace",
    teamSize: "7,000+ employees",
    hq: "San Francisco",
  }),
  stagedRole({
    id: "helio-backend-startup",
    monogram: "HA",
    company: "Helio AI",
    logo: "helio",
    companyType: "startup",
    location: "Remote",
    type: "Full-time",
    title: "Backend Engineer - AI Workflows",
    tags: ["Python", "FastAPI", "Postgres", "LLM"],
    why: "High fit for Python, AI product workflows, and backend ownership in a smaller team.",
    salary: "$88-112K",
    fit: 95,
    industry: "Applied AI",
    teamSize: "34 employees",
    hq: "Remote - APAC friendly",
  }),
  stagedRole({
    id: "orbit-backend-startup",
    monogram: "OC",
    company: "Orbit Commerce",
    logo: "orbit",
    companyType: "startup",
    location: "Remote",
    type: "Full-time",
    title: "Backend Engineer - Commerce APIs",
    tags: ["Node.js", "Postgres", "Payments", "APIs"],
    why: "Backend work maps to Veer's product dashboard and API integration proof.",
    salary: "$84-110K",
    fit: 92,
    industry: "Commerce tooling",
    teamSize: "42 employees",
    hq: "Remote",
  }),
  stagedRole({
    id: "stackline-backend-startup",
    monogram: "SS",
    company: "Stackline Studio",
    logo: "stackline",
    companyType: "startup",
    location: "Remote",
    type: "Full-time",
    title: "Full Stack Backend-Leaning Engineer",
    tags: ["TypeScript", "Node", "SQL", "APIs"],
    why: "Fastest match for broad project ownership, backend integration, and frontend support.",
    salary: "$90-118K",
    fit: 90,
    industry: "Product studio",
    teamSize: "26 employees",
    hq: "Remote - EST overlap",
  }),
]

const MNC_PRODUCT_ROLES: JobRole[] = [
  stagedRole({
    id: "microsoft-product-sydney",
    monogram: "MS",
    company: "Microsoft",
    logo: "microsoft",
    companyType: "mnc",
    location: "Sydney",
    type: "Full-time",
    title: "Product Software Engineer",
    tags: ["Azure", "TypeScript", "APIs", "Telemetry"],
    why: "Strong MNC path for Veer's profile because it connects product UI, service integration, and internship-style engineering proof.",
    salary: "$112-145K",
    fit: 93,
    industry: "Cloud and productivity software",
    teamSize: "220,000+ employees",
    hq: "Redmond / Sydney",
  }),
  stagedRole({
    id: "atlassian-product-sydney",
    monogram: "AT",
    company: "Atlassian",
    logo: "atlassian",
    companyType: "mnc",
    location: "Sydney",
    type: "Full-time",
    title: "Product Engineer - Collaboration",
    tags: ["React", "Java", "Cloud", "Experimentation"],
    why: "Sydney-based product engineering role with strong fit to dashboard, saved workflows, and recruiter-facing UX proof.",
    salary: "$108-136K",
    fit: 92,
    industry: "Team collaboration software",
    teamSize: "12,000+ employees",
    hq: "Sydney",
  }),
  stagedRole({
    id: "canva-product-sydney",
    monogram: "CA",
    company: "Canva",
    logo: "canva",
    companyType: "mnc",
    location: "Sydney",
    type: "Full-time",
    title: "Product Engineer - AI Creation",
    tags: ["React", "Java", "AI UX", "APIs"],
    why: "Very relevant for AI product polish, user-facing tools, and evidence-led interface work.",
    salary: "$115-150K",
    fit: 91,
    industry: "Design productivity",
    teamSize: "5,000+ employees",
    hq: "Sydney",
  }),
  stagedRole({
    id: "google-product-sydney",
    monogram: "G",
    company: "Google",
    logo: "google",
    companyType: "mnc",
    location: "Sydney",
    type: "Full-time",
    title: "Product Software Engineer - Workspace",
    tags: ["Java", "TypeScript", "APIs", "UX"],
    why: "High bar but strong match for product engineering once backend proof and interview prep are tightened.",
    salary: "$132-168K",
    fit: 86,
    industry: "Cloud and productivity platforms",
    teamSize: "180,000+ employees",
    hq: "Mountain View / Sydney",
  }),
]

const ROLE_SETS: Record<SearchMode, JobRole[]> = {
  default: ROLES.slice(0, 5),
  "backend-profile": BACKEND_PROFILE_ROLES,
  "faang-backend": FAANG_BACKEND_ROLES,
  "google-intern": GOOGLE_INTERN_ROLES,
  "startup-remote": STARTUP_REMOTE_ROLES,
  "mnc-product": MNC_PRODUCT_ROLES,
}

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function inferSearchMode(prompt: string): SearchMode {
  const lower = prompt.toLowerCase()
  if (lower.includes("google") && (lower.includes("intern") || lower.includes("any roles"))) return "google-intern"
  if (lower.includes("faang")) return "faang-backend"
  if (lower.includes("startup")) return "startup-remote"
  if (lower.includes("mnc") || lower.includes("product engineering")) return "mnc-product"
  if (lower.includes("backend") || lower.includes("experience") || lower.includes("profile")) return "backend-profile"
  return "default"
}

function getSearchLabel(mode: SearchMode) {
  const labels: Record<SearchMode, string> = {
    default: "general Columbus shortlist",
    "backend-profile": "backend roles matched to Veer's profile",
    "faang-backend": "FAANG backend shortlist",
    "google-intern": "Google internship routes",
    "startup-remote": "remote startup backend roles",
    "mnc-product": "MNC product engineering roles",
  }
  return labels[mode]
}

function getVisibleRoles(rolePool: JobRole[], filter: FilterId) {
  if (filter === "all") return rolePool
  if (filter === "remote") return rolePool.filter((role) => role.location.toLowerCase().includes("remote"))
  if (filter === "full-time") return rolePool.filter((role) => role.type === "Full-time")
  if (filter === "internship") return rolePool.filter((role) => role.type === "Internship")
  if (filter === "startup") return rolePool.filter((role) => role.companyType === "startup")
  if (filter === "mnc") return rolePool.filter((role) => role.companyType === "mnc")
  if (filter === "high-fit") return rolePool.filter((role) => role.fit >= 90)
  return rolePool.slice().sort((a, b) => a.company.localeCompare(b.company))
}

export default function StudentJobsPage() {
  const [inputValue, setInputValue] = useState("")
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [filter, setFilter] = useState<FilterId>("all")
  const [searchMode, setSearchMode] = useState<SearchMode>("default")
  const [selectedRole, setSelectedRole] = useState<JobRole | null>(null)
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const timersRef = useRef<number[]>([])

  const rolePool = ROLE_SETS[searchMode]
  const visibleRoles = useMemo(() => getVisibleRoles(rolePool, filter), [filter, rolePool])
  const searchLabel = getSearchLabel(searchMode)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => window.clearTimeout(timer))
    }
  }, [])

  function pushMessage(message: Omit<ChatMessage, "id">) {
    setMessages((current) => [...current, { ...message, id: uid(message.sender) }])
  }

  function runIntake(rawPrompt: string) {
    const prompt = rawPrompt.trim()
    if (!prompt || isSearching) return

    timersRef.current.forEach((timer) => window.clearTimeout(timer))
    timersRef.current = []
    setInputValue("")
    setIsSearching(true)
    setSelectedRole(null)
    setFilter("all")
    pushMessage({ sender: "user", text: prompt })
    const nextMode = inferSearchMode(prompt)
    const nextRoles = ROLE_SETS[nextMode]

    const searchingId = uid("searching")
    const rankingId = uid("ranking")

    timersRef.current.push(
      window.setTimeout(() => {
        setMessages((current) => [
          ...current,
          { id: searchingId, sender: "acolumbus", text: "Searching the web...", state: "thinking" },
        ])
      }, 280)
    )

    timersRef.current.push(
      window.setTimeout(() => {
        setMessages((current) => [
          ...current.filter((message) => message.id !== searchingId),
          { id: rankingId, sender: "acolumbus", text: "Ranking match and reading requirements...", state: "thinking" },
        ])
      }, 1300)
    )

    timersRef.current.push(
      window.setTimeout(() => {
        setMessages((current) => [
          ...current.filter((message) => message.id !== rankingId),
          {
            id: uid("done"),
            sender: "acolumbus",
            text: `I staged ${nextRoles.length} ${getSearchLabel(nextMode)} in the results panel. Select a company card to inspect match, requirements, and apply paths.`,
          },
        ])
        setSearchMode(nextMode)
        setFilter(
          prompt.toLowerCase().includes("intern")
            ? "internship"
            : prompt.toLowerCase().includes("startup")
              ? "startup"
              : prompt.toLowerCase().includes("mnc")
                ? "mnc"
                : "all"
        )
        setSelectedRole(nextRoles[0] ?? null)
        setIsSearching(false)
      }, 2400)
    )
  }

  function saveRole(role: JobRole) {
    setSavedIds((current) => new Set(current).add(role.id))
    const storageKey = "nexus-student-saved-roles"
    const existing = JSON.parse(localStorage.getItem(storageKey) || "[]") as JobRole[]
    const merged = [role, ...existing.filter((item) => item.id !== role.id)]
    localStorage.setItem(storageKey, JSON.stringify(merged))
  }

  return (
    <main className="flex h-full min-w-0 flex-1 overflow-hidden bg-[#F7F2EA] text-[#241f18] dark:bg-[#050505] dark:text-white">
      <CandidateIntakePanel
        messages={messages}
        inputValue={inputValue}
        isSearching={isSearching}
        messagesEndRef={messagesEndRef}
        onInputChange={setInputValue}
        onSubmit={() => runIntake(inputValue)}
        onPromptSelect={setInputValue}
      />

      <section className="relative flex h-full min-w-0 flex-1 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(36,31,24,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(36,31,24,0.035)_1px,transparent_1px)] bg-[size:40px_40px] dark:bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)]" />
        <ResultsFeed
          filter={filter}
          roles={visibleRoles}
          rolePoolCount={rolePool.length}
          searchLabel={searchLabel}
          selectedRoleId={selectedRole?.id ?? null}
          savedIds={savedIds}
          onFilterChange={setFilter}
          onSelect={setSelectedRole}
          onSave={saveRole}
        />
        <RoleDetailPane role={selectedRole} saved={selectedRole ? savedIds.has(selectedRole.id) : false} onSave={saveRole} />
      </section>
    </main>
  )
}

function CandidateIntakePanel({
  messages,
  inputValue,
  isSearching,
  messagesEndRef,
  onInputChange,
  onSubmit,
  onPromptSelect,
}: {
  messages: ChatMessage[]
  inputValue: string
  isSearching: boolean
  messagesEndRef: React.RefObject<HTMLDivElement | null>
  onInputChange: (value: string) => void
  onSubmit: () => void
  onPromptSelect: (value: string) => void
}) {
  return (
    <aside className="relative flex h-full w-[382px] shrink-0 flex-col border-r border-[#DED4C7]/60 bg-[#F7F2EA] dark:border-white/[0.06] dark:bg-[#0A0A0A] 2xl:w-[410px]">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#DED4C733_1px,transparent_1px),linear-gradient(to_bottom,#DED4C733_1px,transparent_1px)] bg-[size:32px_32px] opacity-30 dark:opacity-10" />

      <div className="relative flex items-center gap-3 border-b border-[#DED4C7]/60 px-5 py-4 dark:border-white/[0.06]">
        <AcolumbusOrb active={isSearching} />
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.34em] text-[#8A8177] dark:text-white/40">
            COLUMBUS
          </p>
          <p className="text-[12px] font-bold tracking-[-0.03em] text-[#4E4944] dark:text-white/70">
            candidate intake
          </p>
        </div>
      </div>

      <div className={cn("relative flex-1 overflow-y-auto px-4 py-5 pr-2", JOB_SCROLLBAR)}>
        <div className="flex flex-col gap-4">
          <div className="rounded-[22px] border border-[#DED4C7]/70 bg-[#FFFDF8]/72 p-4 shadow-[0_12px_30px_rgba(42,37,32,0.06)] dark:border-white/10 dark:bg-white/[0.04]">
            <p className="mb-3 text-[10px] font-black uppercase tracking-[0.26em] text-[#8A8177] dark:text-white/35">
              Quick prompts
            </p>
            <div className="flex flex-wrap gap-2">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  disabled={isSearching}
                  onClick={() => onPromptSelect(prompt)}
                  className="rounded-full border border-[#DED4C7] bg-[#EEE8DF] px-3 py-1.5 text-left text-[11px] font-black leading-4 tracking-[-0.02em] text-[#6F675F] transition hover:border-[#FF6A00]/40 hover:bg-[#FFE1C7] hover:text-[#DF5F12] disabled:pointer-events-none disabled:opacity-45 dark:border-white/10 dark:bg-white/5 dark:text-white/60 dark:hover:border-orange-500/40 dark:hover:bg-orange-500/10 dark:hover:text-orange-300"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
          {messages.map((message) => (
            <ChatBubble key={message.id} message={message} disabled={isSearching} onAction={onPromptSelect} />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="relative border-t border-[#DED4C7]/60 p-4 dark:border-white/[0.06]">
        <form
          onSubmit={(event) => {
            event.preventDefault()
            onSubmit()
          }}
          className="relative"
        >
          <div className="relative rounded-[18px] bg-[#FFFDF8]/95 shadow-[0_8px_28px_rgba(42,37,32,0.12)] dark:bg-[#141414] dark:shadow-none">
            <input
              value={inputValue}
              onChange={(event) => onInputChange(event.target.value)}
              placeholder="Ex: Backend roles at FAANG companies"
              disabled={isSearching}
              className="h-[52px] w-full rounded-[18px] bg-transparent px-5 pr-14 text-[14px] tracking-[-0.03em] text-[#2A2520] outline-none placeholder:text-[#BDB6AE] disabled:opacity-50 dark:text-white dark:placeholder:text-white/30"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isSearching}
              className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-[#F7F2EA] text-[#BDB6AE] transition hover:bg-[#FF6A00] hover:text-white disabled:pointer-events-none dark:bg-white/10 dark:hover:bg-[#FF6A00]"
              aria-label="Search roles"
            >
              <ArrowUp size={16} />
            </button>
          </div>
        </form>
      </div>
    </aside>
  )
}

function ChatBubble({
  message,
  disabled,
  onAction,
}: {
  message: ChatMessage
  disabled: boolean
  onAction: (value: string) => void
}) {
  const isUser = message.sender === "user"

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className={isUser ? "flex justify-end" : "flex justify-start"}
    >
      <div className="max-w-[90%]">
        <div
          className={
            isUser
              ? "rounded-[20px] rounded-tr-md bg-[#2A2520] px-4 py-3 text-[12px] font-bold leading-5 tracking-[-0.03em] text-[#FFFDF8] dark:bg-white dark:text-[#2A2520]"
              : "rounded-[20px] rounded-tl-md border border-[#DED4C7] bg-[#FFFDF8]/95 px-4 py-3 text-[12px] font-bold leading-5 tracking-[-0.03em] text-[#6F675F] shadow-[0_4px_16px_rgba(42,37,32,0.07)] dark:border-white/10 dark:bg-[#141414] dark:text-white/70"
          }
        >
          <span>{message.text}</span>
          {message.state === "thinking" && <ThinkingDots />}
        </div>

        {message.actions && message.actions.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {message.actions.map((action) => (
              <button
                key={action}
                type="button"
                disabled={disabled}
                onClick={() => onAction(action)}
                className="rounded-full border border-[#DED4C7] bg-[#EEE8DF] px-3 py-1.5 text-[11px] font-black tracking-[-0.02em] text-[#6F675F] transition hover:border-[#FF6A00]/40 hover:bg-[#FFE1C7] hover:text-[#FF6A00] disabled:pointer-events-none disabled:opacity-45 dark:border-white/10 dark:bg-white/5 dark:text-white/60 dark:hover:border-orange-500/40 dark:hover:bg-orange-500/10 dark:hover:text-orange-300"
              >
                {action}
              </button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}

function ResultsFeed({
  filter,
  roles,
  rolePoolCount,
  searchLabel,
  selectedRoleId,
  savedIds,
  onFilterChange,
  onSelect,
  onSave,
}: {
  filter: FilterId
  roles: JobRole[]
  rolePoolCount: number
  searchLabel: string
  selectedRoleId: string | null
  savedIds: Set<string>
  onFilterChange: (filter: FilterId) => void
  onSelect: (role: JobRole) => void
  onSave: (role: JobRole) => void
}) {
  return (
    <div className="relative flex h-full min-w-[440px] flex-1 flex-col overflow-hidden border-r border-[#DED4C7]/60 dark:border-white/[0.06]">
      <div className="relative border-b border-[#DED4C7]/60 bg-[#FBF7EF]/70 px-6 py-5 backdrop-blur-xl dark:border-white/[0.06] dark:bg-[#0A0A0A]/70">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onFilterChange(item.id)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] transition",
                filter === item.id
                  ? "border-[#FF6A00]/60 bg-[#FF6A00] text-white shadow-[0_10px_26px_rgba(255,106,0,0.20)]"
                  : "border-[#DED4C7] bg-[#FFFDF8]/75 text-[#7A7168] hover:border-[#FF6A00]/35 hover:text-[#DF5F12] dark:border-white/10 dark:bg-white/[0.04] dark:text-white/50 dark:hover:text-orange-300"
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-[10px] font-black uppercase tracking-[0.34em] text-[#8A8177] dark:text-white/35">
              Job Discovery Section - Ingen
            </p>
            <h1 className="text-3xl font-black uppercase tracking-[-0.06em] text-[#241f18] dark:text-white">
              Columbus found {roles.length} roles
            </h1>
            <p className="mt-2 text-[12px] font-bold text-[#7A7168] dark:text-white/45">
              {searchLabel} - {rolePoolCount} staged before filters
            </p>
          </div>
          <div className="hidden items-center gap-2 rounded-full border border-[#DED4C7] bg-[#FFFDF8]/80 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#8A8177] dark:border-white/10 dark:bg-white/[0.04] dark:text-white/40 xl:flex">
            <Radar size={14} className="text-[#FF6A00]" />
            Scout active
          </div>
        </div>
      </div>

      <div className={cn("relative flex-1 overflow-y-auto px-5 py-5 pr-3", JOB_SCROLLBAR)}>
        <p className="mb-3 text-[10px] font-black uppercase tracking-[0.26em] text-[#8A8177] dark:text-white/35">
          Sources: {SOURCES}
        </p>
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {roles.map((role) => (
              <RoleCard
                key={role.id}
                role={role}
                active={selectedRoleId === role.id}
                saved={savedIds.has(role.id)}
                onSelect={() => onSelect(role)}
                onSave={() => onSave(role)}
              />
            ))}
          </AnimatePresence>
          {roles.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-[#DED4C7] bg-[#FFFDF8]/70 px-5 py-8 text-center dark:border-white/10 dark:bg-white/[0.04]">
              <p className="text-sm font-black tracking-[-0.03em] text-[#241f18] dark:text-white">No roles match this filter.</p>
              <p className="mt-2 text-[12px] font-semibold text-[#7A7168] dark:text-white/45">
                Switch filters or submit one of the quick prompts to rerun Columbus.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function CompanyLogo({ role, size = "md" }: { role: JobRole; size?: "md" | "lg" }) {
  const dimensions = size === "lg" ? "h-20 w-32 rounded-[22px]" : "h-14 w-24 rounded-[18px]"
  const logoUrl = role.logoUrl ?? getCompanyLogoUrl(role)

  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center overflow-hidden border border-[#DED4C7]/70 bg-white px-2.5 py-2 shadow-[0_10px_26px_rgba(42,37,32,0.08)] dark:border-white/10 dark:bg-white",
        dimensions
      )}
    >
      <img
        src={logoUrl}
        alt={`${role.company} logo`}
        loading="lazy"
        referrerPolicy="no-referrer"
        className="h-full w-full object-contain"
      />
    </span>
  )
}

function getCompanyLogoUrl(role: JobRole) {
  if (role.logo && LOCAL_COMPANY_LOGOS[role.logo]) return LOCAL_COMPANY_LOGOS[role.logo]
  return `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(role.company)}&backgroundColor=fff0c8,e9ddff,b7f4ea,ffe1c7&fontWeight=800`
}

function RoleCard({
  role,
  active,
  saved,
  onSelect,
  onSave,
}: {
  role: JobRole
  active: boolean
  saved: boolean
  onSelect: () => void
  onSave: () => void
}) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
    >
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          "w-full rounded-[22px] border bg-[#FFFDF8]/92 p-4 text-left shadow-[0_12px_34px_rgba(42,37,32,0.07)] transition hover:-translate-y-0.5 hover:border-[#FF6A00]/40 dark:bg-[#101010]/92 dark:shadow-none",
          active ? "border-[#FF6A00]/70 ring-2 ring-[#FF6A00]/15 dark:border-[#FF6A00]/70" : "border-[#DED4C7] dark:border-white/10"
        )}
      >
        <div className="flex items-start gap-3">
          <CompanyLogo role={role} />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-black tracking-[-0.04em] text-[#241f18] dark:text-white">{role.company}</p>
                  <span className="text-[10px] font-bold text-[#8A8177] dark:text-white/35">{role.posted}</span>
                </div>
                <h2 className="mt-1 text-lg font-black tracking-[-0.05em] text-[#241f18] dark:text-white">
                  {role.title}
                </h2>
              </div>
              <div className="rounded-full bg-[#FFE1C7] px-3 py-1 text-[11px] font-black text-[#DF5F12] dark:bg-orange-500/10 dark:text-orange-300">
                {role.fit}% Match
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <MetaChip icon={MapPin} label={role.location} />
              <MetaChip icon={BriefcaseBusiness} label={role.type} />
              {role.companyType ? <MetaChip icon={Building2} label={role.companyType === "mnc" ? "MNC" : "Startup"} /> : null}
              {role.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-[#EEE8DF]/90 px-2.5 py-1 text-[10px] font-bold text-[#7A7168] dark:bg-white/[0.06] dark:text-white/45"
                >
                  {tag}
                </span>
              ))}
            </div>
            <p className="mt-3 line-clamp-2 text-[12px] font-semibold leading-5 text-[#6F675F] dark:text-white/55">{role.why}</p>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-[13px] font-black tracking-[-0.03em] text-[#241f18] dark:text-white">{role.salary}</span>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  onSave()
                }}
                className={cn(
                  "grid h-8 w-8 place-items-center rounded-full transition",
                  saved
                    ? "bg-[#FF6A00] text-white"
                    : "bg-[#EEE8DF] text-[#8A8177] hover:bg-[#FFE1C7] hover:text-[#DF5F12] dark:bg-white/[0.06] dark:text-white/40"
                )}
                aria-label={`Save ${role.title} at ${role.company}`}
              >
                <Bookmark size={15} fill={saved ? "currentColor" : "none"} />
              </button>
            </div>
          </div>
        </div>
      </button>
    </motion.article>
  )
}

function RoleDetailPane({
  role,
  saved,
  onSave,
}: {
  role: JobRole | null
  saved: boolean
  onSave: (role: JobRole) => void
}) {
  return (
    <aside className="relative flex h-full w-[380px] shrink-0 flex-col overflow-hidden bg-[#FBF7EF]/80 backdrop-blur-xl dark:bg-[#080808]/90 2xl:w-[420px]">
      <AnimatePresence mode="wait">
        {!role ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.25 }}
            className="flex h-full flex-col items-center justify-center px-8 text-center"
          >
            <ScoutAnimation />
            <p className="mt-7 text-[10px] font-black uppercase tracking-[0.34em] text-[#8A8177] dark:text-white/35">
              Acolumbus online
            </p>
            <h2 className="mt-3 text-2xl font-black tracking-[-0.06em] text-[#241f18] dark:text-white">
              Start an intake to stage job dossiers.
            </h2>
            <p className="mt-3 max-w-[28ch] text-sm font-semibold leading-6 text-[#7A7168] dark:text-white/45">
              The scout will simulate scraping sources, rank roles, and prepare apply paths here.
            </p>
          </motion.div>
        ) : (
          <motion.div
            key={role.id}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.25 }}
            className="flex h-full flex-col"
          >
            <div className="border-b border-[#DED4C7]/60 p-6 dark:border-white/[0.06]">
              <div className="mb-5 inline-flex rounded-[24px] bg-[#FF6A00] px-4 py-3 text-2xl font-black tracking-[-0.06em] text-white shadow-[0_18px_40px_rgba(255,106,0,0.22)]">
                {role.fit}% Match
              </div>
              <div className="flex items-center gap-3">
                <CompanyLogo role={role} size="lg" />
                <div>
                  <p className="text-sm font-black tracking-[-0.04em] text-[#241f18] dark:text-white">{role.company}</p>
                  <h2 className="mt-1 text-3xl font-black tracking-[-0.07em] text-[#241f18] dark:text-white">{role.title}</h2>
                </div>
              </div>
              <p className="mt-2 text-lg font-black tracking-[-0.04em] text-[#DF5F12] dark:text-orange-300">{role.salary}</p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {[role.location, role.type, ...role.tags.slice(0, 2)].map((chip) => (
                  <span
                    key={chip}
                    className="rounded-full border border-[#DED4C7] bg-[#FFFDF8]/80 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-[#6F675F] dark:border-white/10 dark:bg-white/[0.05] dark:text-white/50"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </div>

            <div className={cn("flex-1 overflow-y-auto px-6 py-5 pr-4", JOB_SCROLLBAR)}>
              <DetailSection title="Role Brief">
                <p className="text-sm font-semibold leading-6 text-[#6F675F] dark:text-white/55">{role.brief}</p>
              </DetailSection>
              <DetailSection title="Requirements">
                <ul className="space-y-2">
                  {role.requirements.map((requirement) => (
                    <li key={requirement} className="flex gap-2 text-sm font-semibold leading-5 text-[#6F675F] dark:text-white/55">
                      <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-[#FF6A00]" />
                      <span>{requirement}</span>
                    </li>
                  ))}
                </ul>
              </DetailSection>
              <DetailSection title="Company Details">
                <div className="grid grid-cols-1 gap-2">
                  <FactRow icon={Building2} label="Industry" value={role.industry} />
                  <FactRow icon={Sparkles} label="Team Size" value={role.teamSize} />
                  <FactRow icon={Globe2} label="HQ/Location" value={role.hq} />
                </div>
              </DetailSection>
              <DetailSection title="Why It Matches">
                <p className="text-sm font-semibold leading-6 text-[#6F675F] dark:text-white/55">{role.why}</p>
              </DetailSection>
            </div>

            <div className="flex gap-3 border-t border-[#DED4C7]/60 p-5 dark:border-white/[0.06]">
              <Button
                type="button"
                variant="outline"
                onClick={() => onSave(role)}
                className="h-11 flex-1 rounded-full border-[#DED4C7] bg-[#FFFDF8]/75 text-[#241f18] hover:bg-[#FFE1C7] dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:hover:bg-white/[0.08]"
              >
                <Bookmark size={16} fill={saved ? "currentColor" : "none"} />
                {saved ? "Saved" : "Save"}
              </Button>
              <Button
                type="button"
                className="h-11 flex-1 rounded-full bg-[#FF6A00] text-white shadow-[0_14px_32px_rgba(255,106,0,0.22)] hover:bg-[#E05E00]"
                asChild
              >
                <a href={role.sourceUrl} target="_blank" rel="noreferrer">
                  Apply Now
                  <ExternalLink size={15} />
                </a>
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </aside>
  )
}

function AcolumbusOrb({ active }: { active: boolean }) {
  return (
    <div className="relative grid h-10 w-10 shrink-0 place-items-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: active ? 1.4 : 8, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 rounded-full border border-dashed border-[#FF6A00]/45"
      />
      <OmniLogo size={16} className="text-[#1F2A38] dark:text-white" />
    </div>
  )
}

function ScoutAnimation() {
  return (
    <div className="relative grid h-32 w-32 place-items-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 rounded-full border border-dashed border-[#FF6A00]/45"
      />
      <motion.div
        animate={{ scale: [0.88, 1.08, 0.88], opacity: [0.25, 0.7, 0.25] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        className="absolute h-24 w-24 rounded-full bg-[#FF6A00]/10"
      />
      <motion.div
        animate={{ rotate: [0, 18, -12, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="relative grid h-16 w-16 place-items-center rounded-3xl bg-[#FFFDF8] text-[#1F2A38] shadow-[0_18px_48px_rgba(42,37,32,0.14)] dark:bg-[#141414] dark:text-white"
      >
        <Search size={26} />
      </motion.div>
    </div>
  )
}

function ThinkingDots() {
  return (
    <span className="ml-2 inline-flex translate-y-0.5 gap-1">
      {[0, 1, 2].map((dot) => (
        <motion.span
          key={dot}
          animate={{ opacity: [0.25, 1, 0.25], y: [0, -2, 0] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: dot * 0.12 }}
          className="h-1.5 w-1.5 rounded-full bg-[#FF6A00]"
        />
      ))}
    </span>
  )
}

function MetaChip({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#EEE8DF]/90 px-2.5 py-1 text-[10px] font-bold text-[#7A7168] dark:bg-white/[0.06] dark:text-white/45">
      <Icon size={12} />
      {label}
    </span>
  )
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h3 className="mb-3 text-[10px] font-black uppercase tracking-[0.28em] text-[#8A8177] dark:text-white/35">{title}</h3>
      {children}
    </section>
  )
}

function FactRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[#DED4C7]/70 bg-[#FFFDF8]/70 px-3 py-3 dark:border-white/10 dark:bg-white/[0.04]">
      <Icon size={16} className="text-[#FF6A00]" />
      <div>
        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#8A8177] dark:text-white/35">{label}</p>
        <p className="text-[12px] font-black text-[#241f18] dark:text-white">{value}</p>
      </div>
    </div>
  )
}
