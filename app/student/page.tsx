"use client"

import React, { useMemo, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import {
  ArrowUp,
  Bookmark,
  BookOpen,
  Bot,
  Check,
  Download,
  ExternalLink,
  FileText,
  Maximize2,
  Minus,
  PanelLeftClose,
  PanelLeftOpen,
  Play,
  Plus,
  RotateCcw,
  Sparkles,
  X,
} from "lucide-react"
import { OmniLogo } from "@/components/omni-logo"
import { cn } from "@/lib/utils"

type TopicKind = "core" | "branch" | "milestone"
type ResourceType = "Articles" | "Videos" | "Documentation"
type ViewMode = "roadmap" | "pathway"
type RoadmapId = "frontend-engineer" | "data-analyst" | "ai-engineer"
type SavedArtifactId = string

type TopicNode = {
  id: string
  label: string
  group: string
  kind: TopicKind
  side: "left" | "center" | "right"
  x: number
  y: number
  w: number
  h: number
  targetId?: string
  hours: number
  difficulty: "Easy" | "Medium" | "Hard"
}

type Resource = {
  type: ResourceType
  title: string
  source: string
  description: string
  url: string
}

type RoadmapDefinition = {
  id: RoadmapId
  title: string
  roleName: string
  description: string
  canvasWidth: number
  canvasHeight: number
  estimatedHours: number
  duration: string
  nodes: TopicNode[]
  groups: { label: string; y: number }[]
}

type RoadmapCustomization = {
  expertise: string
  goal: string
  hoursPerWeek: string
}

type PathwayStage = {
  id: string
  eyebrow: string
  title: string
  summary: string
  x: number
  y: number
  w: number
  h: number
  tasks: string[]
  metric: string
  tone: "start" | "skill" | "proof" | "apply" | "interview" | "offer"
}

type JobPathwayDefinition = {
  id: SavedArtifactId
  title: string
  targetCompany: string
  targetRole: string
  description: string
  duration: string
  output: string
  canvasWidth: number
  canvasHeight: number
  stages: PathwayStage[]
}

const CANVAS_WIDTH = 1220
const FRONTEND_CANVAS_HEIGHT = 1520
const SPINE_X = 610
const CORE_X = 470
const BRANCH_LEFT_X = 58
const BRANCH_RIGHT_X = 872
const CORE_W = 280
const BRANCH_W = 300
const NODE_H = 44

const FRONTEND_TOPIC_NODES: TopicNode[] = [
  center("web-architecture", "Web Architecture", "Internet Fundamentals", 165, 12, "Medium"),
  center("network-protocols", "Network Protocols", "Internet Fundamentals", 255, 14, "Medium"),
  right("request-response", "Request response cycle", "Internet Fundamentals", 88, "web-architecture"),
  right("dns", "Domain name systems", "Internet Fundamentals", 143, "web-architecture"),
  right("http", "Hypertext transfer protocol", "Internet Fundamentals", 198, "web-architecture"),
  right("browsers", "Web browsers function", "Internet Fundamentals", 253, "web-architecture"),
  right("domain-hosting", "Domain hosting basics", "Internet Fundamentals", 308, "web-architecture"),
  right("browser-cache", "Browser cache mechanism", "Internet Fundamentals", 363, "web-architecture"),
  left("tcp", "Transmission control protocol", "Internet Fundamentals", 108, "network-protocols"),
  left("ip", "Internet protocol", "Internet Fundamentals", 163, "network-protocols"),
  left("ssl", "Secure socket layer", "Internet Fundamentals", 218, "network-protocols"),
  left("tls", "Transport layer security", "Internet Fundamentals", 273, "network-protocols"),
  left("urls", "Uniform resource locators", "Internet Fundamentals", 328, "network-protocols"),
  left("websocket", "Web socket communication", "Internet Fundamentals", 383, "network-protocols"),

  center("layout-systems", "Layout Systems", "Advanced CSS", 530, 18, "Medium"),
  center("styling-techniques", "Styling Techniques", "Advanced CSS", 620, 18, "Medium"),
  right("flexbox-props", "Flexbox properties", "Advanced CSS", 468, "layout-systems"),
  right("css-grid-layout", "CSS grid layout", "Advanced CSS", 523, "layout-systems"),
  right("positioning", "Positioning context", "Advanced CSS", 578, "layout-systems"),
  right("box-model", "Box model calculation", "Advanced CSS", 633, "layout-systems"),
  right("responsive", "Responsive design strategies", "Advanced CSS", 688, "layout-systems"),
  right("multicolumn", "CSS multicolumn layout", "Advanced CSS", 743, "layout-systems"),
  left("preprocessor", "Preprocessor variables", "Advanced CSS", 455, "styling-techniques"),
  left("custom-props", "CSS custom properties", "Advanced CSS", 510, "styling-techniques"),
  left("bem", "BEM methodology", "Advanced CSS", 565, "styling-techniques"),
  left("styled-components", "Styled components", "Advanced CSS", 620, "styling-techniques"),
  left("tailwind", "Tailwind utility classes", "Advanced CSS", 675, "styling-techniques"),
  left("css-modules", "CSS modules implementation", "Advanced CSS", 730, "styling-techniques"),

  center("language-core", "Language Core", "JavaScript Foundations", 895, 28, "Hard"),
  center("modern-syntax", "Modern Syntax", "JavaScript Foundations", 985, 22, "Medium"),
  right("scoping", "Variable scoping rules", "JavaScript Foundations", 820, "language-core"),
  right("conversion", "Data type conversion", "JavaScript Foundations", 875, "language-core"),
  right("control-flow", "Control flow statements", "JavaScript Foundations", 930, "language-core"),
  right("functions", "Function declaration patterns", "JavaScript Foundations", 985, "language-core"),
  right("prototype", "Prototype inheritance chain", "JavaScript Foundations", 1040, "language-core"),
  right("event-loop", "Event loop mechanism", "JavaScript Foundations", 1095, "language-core"),
  left("arrow-functions", "Arrow function expressions", "JavaScript Foundations", 810, "modern-syntax"),
  left("destructuring", "Destructuring assignment syntax", "JavaScript Foundations", 865, "modern-syntax"),
  left("spread", "Spread operator usage", "JavaScript Foundations", 920, "modern-syntax"),
  left("template", "Template literal strings", "JavaScript Foundations", 975, "modern-syntax"),
  left("modules", "Modules import export", "JavaScript Foundations", 1030, "modern-syntax"),

  center("react-foundations", "React Foundations", "Frontend Frameworks", 1190, 42, "Hard"),
  center("state-data", "State & Data Flow", "Frontend Frameworks", 1280, 30, "Hard"),
  right("components", "Component composition", "Frontend Frameworks", 1130, "react-foundations"),
  right("hooks", "Hooks and effects", "Frontend Frameworks", 1185, "react-foundations"),
  right("context", "Context boundaries", "Frontend Frameworks", 1240, "react-foundations"),
  right("error-boundaries", "Error boundary strategy", "Frontend Frameworks", 1295, "react-foundations"),
  left("router", "Nested route design", "Frontend Frameworks", 1145, "state-data"),
  left("reducers", "Reducer state modeling", "Frontend Frameworks", 1200, "state-data"),
  left("zustand", "Zustand stores", "Frontend Frameworks", 1255, "state-data"),
  left("tanstack", "TanStack Query cache", "Frontend Frameworks", 1310, "state-data"),
  center("frontend-checkpoint", "Frontend Frameworks Complete", "Frontend Frameworks", 1410, 0, "Medium", "milestone"),
]

const DATA_ANALYST_TOPIC_NODES: TopicNode[] = [
  center("da-introduction", "Introduction", "Data Analyst", 165, 8, "Easy"),
  right("da-what", "What is Data Analytics", "Data Analyst", 102, "da-introduction"),
  right("da-types", "Types of Data Analytics", "Data Analyst", 157, "da-introduction"),
  right("da-descriptive-type", "Descriptive Analytics", "Data Analyst", 235, "da-types"),
  right("da-diagnostic-type", "Diagnostic Analytics", "Data Analyst", 290, "da-types"),
  right("da-predictive-type", "Predictive Analytics", "Data Analyst", 345, "da-types"),
  right("da-prescriptive-type", "Prescriptive Analytics", "Data Analyst", 400, "da-types"),

  center("da-key-concepts", "Key Concepts of Data", "Strong Foundation", 330, 16, "Easy"),
  left("da-excel", "Analysis / Reporting with Excel", "Strong Foundation", 245, "da-key-concepts"),
  left("da-common-functions", "Common Excel Functions", "Strong Foundation", 300, "da-key-concepts"),
  left("da-lookup", "VLOOKUP / HLOOKUP", "Strong Foundation", 355, "da-key-concepts"),
  left("da-pivots", "Pivot Tables", "Strong Foundation", 410, "da-key-concepts"),
  left("da-charting", "Charting", "Strong Foundation", 465, "da-key-concepts"),
  right("da-collection-concept", "Collection", "Strong Foundation", 292, "da-key-concepts"),
  right("da-cleanup-concept", "Cleanup", "Strong Foundation", 347, "da-key-concepts"),
  right("da-exploration-concept", "Exploration", "Strong Foundation", 402, "da-key-concepts"),
  right("da-visualisation-concept", "Visualisation", "Strong Foundation", 457, "da-key-concepts"),

  center("da-sql", "Learn SQL", "Data Handling", 590, 28, "Medium"),
  left("da-selects", "SELECT, WHERE, ORDER BY", "Data Handling", 535, "da-sql"),
  left("da-joins", "Joins and Relationships", "Data Handling", 590, "da-sql"),
  left("da-aggregations", "GROUP BY and Aggregations", "Data Handling", 645, "da-sql"),
  right("da-programming", "Learn a Programming Language", "Data Handling", 535, "da-sql"),
  right("da-python-r", "Python or R", "Data Handling", 590, "da-sql"),
  right("da-libraries", "Data Manipulation Libraries", "Data Handling", 645, "da-sql"),

  center("da-collection", "Data Collection", "Data Handling", 790, 20, "Medium"),
  left("da-databases", "Databases", "Data Handling", 715, "da-collection"),
  left("da-csv", "CSV Files", "Data Handling", 770, "da-collection"),
  left("da-apis", "APIs", "Data Handling", 825, "da-collection"),
  left("da-scraping", "Web Scraping", "Data Handling", 880, "da-collection"),
  center("da-cleanup", "Data Cleanup", "Data Handling", 940, 24, "Medium"),
  right("da-missing", "Handling Missing Data", "Data Handling", 860, "da-cleanup"),
  right("da-duplicates", "Removing Duplicates", "Data Handling", 915, "da-cleanup"),
  right("da-pandas", "Pandas", "Data Handling", 970, "da-cleanup"),
  right("da-dplyr", "Dplyr", "Data Handling", 1025, "da-cleanup"),

  center("da-descriptive", "Descriptive Analysis", "Analysis Techniques", 1125, 22, "Medium"),
  left("da-dispersion", "Dispersion", "Analysis Techniques", 1035, "da-descriptive"),
  left("da-generating", "Generating Statistics", "Analysis Techniques", 1090, "da-descriptive"),
  left("da-distributions", "Visualizing Distributions", "Analysis Techniques", 1145, "da-descriptive"),
  center("da-statistical", "Statistical Analysis", "Analysis Techniques", 1290, 30, "Hard"),
  left("da-hypothesis", "Hypothesis Testing", "Analysis Techniques", 1235, "da-statistical"),
  left("da-correlation", "Correlation Analysis", "Analysis Techniques", 1290, "da-statistical"),
  left("da-regression", "Regression", "Analysis Techniques", 1345, "da-statistical"),
  right("da-decisions", "Data-driven Decisions", "Analysis Techniques", 1235, "da-statistical"),
  right("da-experiments", "A/B Testing", "Analysis Techniques", 1290, "da-statistical"),
  right("da-storytelling", "Data Storytelling", "Analysis Techniques", 1345, "da-statistical"),

  center("da-visualisation", "Data Visualisation", "Visualization", 1455, 28, "Medium"),
  right("da-tools", "Tableau / Power BI", "Visualization", 1390, "da-visualisation"),
  right("da-python-viz", "Matplotlib / Seaborn", "Visualization", 1445, "da-visualisation"),
  right("da-chart-types", "Bar, Line, Scatter, Heatmap", "Visualization", 1500, "da-visualisation"),
  center("da-machine-learning", "Machine Learning", "Advanced Topics", 1615, 28, "Hard"),
  left("da-supervised", "Supervised Learning", "Advanced Topics", 1530, "da-machine-learning"),
  left("da-unsupervised", "Unsupervised Learning", "Advanced Topics", 1585, "da-machine-learning"),
  left("da-model-eval", "Model Evaluation Techniques", "Advanced Topics", 1640, "da-machine-learning"),
  left("da-algorithms", "Decision Trees, KNN, K-Means", "Advanced Topics", 1695, "da-machine-learning"),
  right("da-big-data", "Big Data Technologies", "Advanced Topics", 1560, "da-machine-learning"),
  right("da-hadoop", "Hadoop / Spark", "Advanced Topics", 1615, "da-machine-learning"),
  right("da-parallel", "Parallel Processing", "Advanced Topics", 1670, "da-machine-learning"),

  center("da-portfolio", "Career Portfolio", "Launch", 1835, 18, "Medium", "milestone"),
  left("da-dashboard-project", "Dashboard Case Study", "Launch", 1780, "da-portfolio"),
  left("da-sql-project", "SQL Analysis Project", "Launch", 1835, "da-portfolio"),
  right("da-capstone", "Capstone Dataset", "Launch", 1780, "da-portfolio"),
  right("da-interview", "Interview Stories", "Launch", 1835, "da-portfolio"),
]

const AI_ENGINEER_TOPIC_NODES: TopicNode[] = [
  center("ai-introduction", "Introduction", "AI Engineer", 165, 8, "Easy"),
  right("ai-what", "What is an AI Engineer?", "AI Engineer", 90, "ai-introduction"),
  right("ai-roles", "Roles and Responsibilities", "AI Engineer", 145, "ai-introduction"),
  right("ai-impact", "Impact on Product Development", "AI Engineer", 200, "ai-introduction"),
  right("ai-vs-ml", "AI Engineer vs ML Engineer", "AI Engineer", 255, "ai-introduction"),
  left("ai-prereq", "Prerequisites: Frontend / Backend / Full-stack", "AI Engineer", 110, "ai-introduction"),

  center("ai-llms", "How LLMs Work", "Working With LLMs", 390, 22, "Medium"),
  left("ai-tokens", "Tokens and Context", "Working With LLMs", 325, "ai-llms"),
  left("ai-sampling", "Sampling Parameters", "Working With LLMs", 380, "ai-llms"),
  left("ai-temperature", "Temperature, Top-K, Top-P", "Working With LLMs", 435, "ai-llms"),
  right("ai-terminology", "Common Terminology", "Working With LLMs", 310, "ai-llms"),
  right("ai-embeddings-term", "Embeddings", "Working With LLMs", 365, "ai-llms"),
  right("ai-inference", "Inference and Training", "Working With LLMs", 420, "ai-llms"),
  right("ai-agents-term", "AI Agents and RAG", "Working With LLMs", 475, "ai-llms"),

  center("ai-prompt-context", "Prompt vs Context Engineering", "Prompting", 620, 24, "Medium"),
  left("ai-zero-shot", "Zero-Shot / Few-Shot", "Prompting", 535, "ai-prompt-context"),
  left("ai-react-cot", "ReAct and CoT", "Prompting", 590, "ai-prompt-context"),
  left("ai-function-calling", "Function Calling", "Prompting", 645, "ai-prompt-context"),
  left("ai-structured", "Structured Output", "Prompting", 700, "ai-prompt-context"),
  right("ai-context-memory", "External Memory", "Prompting", 535, "ai-prompt-context"),
  right("ai-rag-filters", "RAG and Dynamic Filters", "Prompting", 590, "ai-prompt-context"),
  right("ai-compaction", "Context Compaction", "Prompting", 645, "ai-prompt-context"),
  right("ai-isolation", "Context Isolation", "Prompting", 700, "ai-prompt-context"),

  center("ai-model-types", "Type of Models", "AI Models", 845, 18, "Medium"),
  right("ai-pretrained", "Pre-trained Models", "AI Models", 790, "ai-model-types"),
  right("ai-closed-open", "Closed vs Open Source Models", "AI Models", 845, "ai-model-types"),
  right("ai-self-hosted", "Self-Hosted Models", "AI Models", 900, "ai-model-types"),
  center("ai-choosing-model", "Choosing the Right Model", "AI Models", 1040, 22, "Medium"),
  left("ai-huggingface", "Hugging Face", "AI Models", 955, "ai-choosing-model"),
  left("ai-ollama", "Ollama / LM Studio / OpenRouter", "AI Models", 1010, "ai-choosing-model"),
  left("ai-apis", "OpenAI, Claude, Gemini APIs", "AI Models", 1065, "ai-choosing-model"),
  right("ai-closed-models", "Claude, Gemini, OpenAI", "AI Models", 970, "ai-choosing-model"),
  right("ai-open-models", "Llama, DeepSeek, Qwen, Gemma", "AI Models", 1025, "ai-choosing-model"),
  right("ai-cost-latency", "Cost, Latency, Quality Tradeoffs", "AI Models", 1080, "ai-choosing-model"),

  center("ai-embeddings", "What are Embeddings", "Embeddings & Vector Databases", 1245, 20, "Medium"),
  right("ai-semantic", "Semantic Search", "Embeddings & Vector Databases", 1185, "ai-embeddings"),
  right("ai-classification", "Data Classification", "Embeddings & Vector Databases", 1240, "ai-embeddings"),
  right("ai-recommendations", "Recommendation Systems", "Embeddings & Vector Databases", 1295, "ai-embeddings"),
  center("ai-embedding-models", "Embedding Models", "Embeddings & Vector Databases", 1410, 18, "Medium"),
  right("ai-openai-emb", "OpenAI / Gemini / Cohere", "Embeddings & Vector Databases", 1360, "ai-embedding-models"),
  right("ai-open-emb", "Sentence Transformers / Jina", "Embeddings & Vector Databases", 1415, "ai-embedding-models"),
  center("ai-vector-db", "Vector Databases", "Embeddings & Vector Databases", 1575, 24, "Medium"),
  left("ai-chroma", "Chroma / Pinecone / Weaviate", "Embeddings & Vector Databases", 1490, "ai-vector-db"),
  left("ai-faiss", "FAISS / LanceDB / Qdrant", "Embeddings & Vector Databases", 1545, "ai-vector-db"),
  left("ai-supabase", "Supabase / MongoDB Atlas", "Embeddings & Vector Databases", 1600, "ai-vector-db"),
  left("ai-similarity", "Indexing and Similarity Search", "Embeddings & Vector Databases", 1655, "ai-vector-db"),

  center("ai-rag", "What are RAGs?", "RAGs", 1780, 26, "Hard"),
  right("ai-rag-usecases", "RAG Use Cases", "RAGs", 1695, "ai-rag"),
  right("ai-rag-chunking", "Chunking", "RAGs", 1750, "ai-rag"),
  right("ai-rag-retrieval", "Retrieval Process", "RAGs", 1805, "ai-rag"),
  right("ai-rag-generation", "Generation and Evaluation", "RAGs", 1860, "ai-rag"),
  center("ai-agents", "AI Agents", "AI Agents", 1965, 28, "Hard"),
  left("ai-agent-sdks", "OpenAI Agents SDK / Claude Agent SDK", "AI Agents", 1900, "ai-agents"),
  left("ai-agent-builders", "Vertex AI Agent Builder / Google ADK", "AI Agents", 1955, "ai-agents"),
  right("ai-tools", "Tools, Memory, Planning", "AI Agents", 1925, "ai-agents"),
  right("ai-agent-evals", "Agent Evaluation", "AI Agents", 1980, "ai-agents"),

  center("ai-mcp", "Model Context Protocol", "MCP", 2145, 18, "Medium"),
  right("ai-mcp-host", "MCP Host / Client / Server", "MCP", 2080, "ai-mcp"),
  right("ai-mcp-layers", "Data Layer / Transport Layer", "MCP", 2135, "ai-mcp"),
  right("ai-mcp-build", "Build MCP Client and Server", "MCP", 2190, "ai-mcp"),
  center("ai-safety", "AI Safety and Ethics", "Safety", 2320, 22, "Hard"),
  left("ai-injection", "Prompt Injection Attacks", "Safety", 2240, "ai-safety"),
  left("ai-privacy", "Security and Privacy Concerns", "Safety", 2295, "ai-safety"),
  left("ai-bias", "Bias and Fairness", "Safety", 2350, "ai-safety"),
  left("ai-moderation", "Moderation and Adversarial Testing", "Safety", 2405, "ai-safety"),

  center("ai-multimodal", "Multimodal AI", "Applications", 2505, 20, "Medium"),
  right("ai-image", "Image Understanding and Generation", "Applications", 2440, "ai-multimodal"),
  right("ai-video", "Video Understanding", "Applications", 2495, "ai-multimodal"),
  right("ai-audio", "Audio, Text-to-Speech, Speech-to-Text", "Applications", 2550, "ai-multimodal"),
  center("ai-tools-dev", "Development Tools", "Applications", 2685, 16, "Easy"),
  left("ai-coding-tools", "Claude Code / Gemini / Codex / Cursor", "Applications", 2620, "ai-tools-dev"),
  left("ai-vibe-tools", "Windsurf / Replit", "Applications", 2675, "ai-tools-dev"),
  right("ai-langchain", "LangChain / LlamaIndex", "Applications", 2635, "ai-tools-dev"),
  right("ai-deploy", "Ship an AI Product", "Applications", 2690, "ai-tools-dev"),
  center("ai-portfolio", "AI Engineer Portfolio", "Launch", 2860, 20, "Hard", "milestone"),
  left("ai-capstone", "RAG or Agent Capstone", "Launch", 2805, "ai-portfolio"),
  right("ai-case-study", "Evaluation Case Study", "Launch", 2805, "ai-portfolio"),
]

const ROADMAPS: Record<RoadmapId, RoadmapDefinition> = {
  "frontend-engineer": {
    id: "frontend-engineer",
    title: "Frontend Development",
    roleName: "Frontend Engineer",
    description: "Step by step guide to becoming a modern frontend developer.",
    canvasWidth: CANVAS_WIDTH,
    canvasHeight: FRONTEND_CANVAS_HEIGHT,
    estimatedHours: 420,
    duration: "12 months",
    nodes: FRONTEND_TOPIC_NODES,
    groups: [
      { label: "Internet Fundamentals", y: 120 },
      { label: "Advanced CSS", y: 475 },
      { label: "JavaScript Foundations", y: 785 },
      { label: "Frontend Frameworks", y: 1135 },
    ],
  },
  "data-analyst": {
    id: "data-analyst",
    title: "Data Analyst",
    roleName: "Data Analyst",
    description: "A practical roadmap for analytics, SQL, visualization, statistics, and portfolio proof.",
    canvasWidth: CANVAS_WIDTH,
    canvasHeight: 1940,
    estimatedHours: 360,
    duration: "9 months",
    nodes: DATA_ANALYST_TOPIC_NODES,
    groups: [
      { label: "Building a Strong Foundation", y: 225 },
      { label: "Mastering Data Handling", y: 730 },
      { label: "Data Analysis Techniques", y: 1090 },
      { label: "Advanced Topics", y: 1510 },
      { label: "Launch", y: 1765 },
    ],
  },
  "ai-engineer": {
    id: "ai-engineer",
    title: "AI Engineer",
    roleName: "AI Engineer",
    description: "A role roadmap for LLMs, agents, RAG, vector databases, safety, multimodal apps, and shipping.",
    canvasWidth: CANVAS_WIDTH,
    canvasHeight: 2960,
    estimatedHours: 520,
    duration: "14 months",
    nodes: AI_ENGINEER_TOPIC_NODES,
    groups: [
      { label: "Working With LLMs", y: 290 },
      { label: "AI Models", y: 760 },
      { label: "Embeddings & Vector Databases", y: 1160 },
      { label: "RAGs", y: 1710 },
      { label: "AI Safety and Ethics", y: 2270 },
      { label: "Other AI Applications", y: 2440 },
    ],
  },
}

const DOORDASH_BACKEND_PATHWAY: JobPathwayDefinition = {
  id: "doordash-backend-pathway",
  title: "Backend Developer at DoorDash - Pathway",
  targetCompany: "DoorDash",
  targetRole: "Backend Developer",
  description: "A job-focused pathway from backend proof to DoorDash interview readiness.",
  duration: "6-10 weeks",
  output: "Referral-ready packet + backend interview plan + DoorDash-specific project proof",
  canvasWidth: 960,
  canvasHeight: 980,
  stages: [
    {
      id: "target-calibration",
      eyebrow: "Target",
      title: "Backend Developer at DoorDash",
      summary: "Define the exact backend scope, recruiter keywords, and role proof you need before applying.",
      x: 42,
      y: 150,
      w: 260,
      h: 202,
      metric: "Role brief",
      tone: "start",
      tasks: ["Backend role scan", "Team and product areas", "Referral target list"],
    },
    {
      id: "backend-core",
      eyebrow: "Skill Base",
      title: "Backend Core Refresh",
      summary: "Tighten the fundamentals DoorDash-style backend screens usually expose.",
      x: 350,
      y: 150,
      w: 260,
      h: 202,
      metric: "2 weeks",
      tone: "skill",
      tasks: ["API design", "SQL and indexing", "Queues and caching"],
    },
    {
      id: "marketplace-domain",
      eyebrow: "Company Context",
      title: "DoorDash System Model",
      summary: "Map marketplace flows so projects and interviews sound relevant to delivery logistics.",
      x: 658,
      y: 150,
      w: 260,
      h: 202,
      metric: "Domain map",
      tone: "skill",
      tasks: ["Order lifecycle", "Dispatch and ETA", "Payments and support"],
    },
    {
      id: "portfolio-project",
      eyebrow: "Proof",
      title: "Order Lifecycle API",
      summary: "Build one focused backend project that mirrors a marketplace order workflow.",
      x: 658,
      y: 390,
      w: 260,
      h: 202,
      metric: "Capstone",
      tone: "proof",
      tasks: ["Idempotent create order", "Status webhooks", "Auth and audit log"],
    },
    {
      id: "reliability-proof",
      eyebrow: "Proof",
      title: "Reliability Add-on",
      summary: "Add production behavior so the project proves backend judgment, not just CRUD.",
      x: 350,
      y: 390,
      w: 260,
      h: 202,
      metric: "Systems proof",
      tone: "proof",
      tasks: ["Retries and dead letters", "Rate limits", "Metrics and tracing"],
    },
    {
      id: "application-packet",
      eyebrow: "Package",
      title: "Resume and GitHub Packet",
      summary: "Turn the project into recruiter-readable evidence for a DoorDash backend application.",
      x: 42,
      y: 390,
      w: 260,
      h: 202,
      metric: "Ready to send",
      tone: "apply",
      tasks: ["Backend bullets", "README architecture", "Demo screenshots"],
    },
    {
      id: "outreach-loop",
      eyebrow: "Apply",
      title: "Referral and Outreach Loop",
      summary: "Run a compact application motion with referrals, alumni, and targeted recruiter notes.",
      x: 42,
      y: 645,
      w: 260,
      h: 196,
      metric: "10 reaches",
      tone: "apply",
      tasks: ["Referral ask", "Recruiter note", "Application tracker"],
    },
    {
      id: "interview-loop",
      eyebrow: "Interview",
      title: "DoorDash Interview Loop Prep",
      summary: "Prepare for coding, system design, and behavioral stories using the same proof packet.",
      x: 350,
      y: 645,
      w: 260,
      h: 196,
      metric: "3 loops",
      tone: "interview",
      tasks: ["Coding patterns", "System design drills", "Ownership stories"],
    },
    {
      id: "offer-readiness",
      eyebrow: "Close",
      title: "Offer Readiness",
      summary: "Prepare team-fit questions, compensation range, and a 30/60/90 plan before the final call.",
      x: 658,
      y: 645,
      w: 260,
      h: 196,
      metric: "Decision ready",
      tone: "offer",
      tasks: ["Comp range", "Team questions", "First 90 days plan"],
    },
  ],
}

const QUICK_ROADMAP_IDS: RoadmapId[] = ["data-analyst", "ai-engineer", "frontend-engineer"]
const STUDENT_SCROLLBAR =
  "[scrollbar-gutter:stable] [scrollbar-width:thin] [scrollbar-color:#D7CEC2_transparent] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:border-2 [&::-webkit-scrollbar-thumb]:border-transparent [&::-webkit-scrollbar-thumb]:bg-[#CFC5B8] [&::-webkit-scrollbar-thumb]:bg-clip-padding hover:[&::-webkit-scrollbar-thumb]:bg-[#FFB176] dark:[scrollbar-color:rgba(255,255,255,0.18)_transparent] dark:[&::-webkit-scrollbar-thumb]:bg-white/18 dark:hover:[&::-webkit-scrollbar-thumb]:bg-orange-300/45"

const TABS: { id: ViewMode; label: string }[] = [
  { id: "roadmap", label: "Roadmap" },
  { id: "pathway", label: "Pathway" },
]

function roadmapIdForPrompt(prompt: string): RoadmapId {
  const text = prompt.toLowerCase()

  if (/\b(data|business|bi)\s*(analyst|analytics|analysis|intelligence)?\b/.test(text) || /\bsql\b/.test(text)) {
    return "data-analyst"
  }

  if (/\b(ai|artificial intelligence|llm|rag|agent|prompt engineering|vector database|embedding)\b/.test(text)) {
    return "ai-engineer"
  }

  return "frontend-engineer"
}

function isPathwayPrompt(prompt: string) {
  return /\b(pathway|path|plan|route|steps|get\s+(a\s+)?job|land\s+(a\s+)?job|hired|offer|interview|job\s+at|at\s+[a-z0-9&.\-\s]+)\b/i.test(prompt)
}

function center(
  id: string,
  label: string,
  group: string,
  y: number,
  hours: number,
  difficulty: TopicNode["difficulty"],
  kind: TopicKind = "core"
): TopicNode {
  return { id, label, group, kind, side: "center", x: CORE_X, y, w: CORE_W, h: NODE_H, hours, difficulty }
}

function left(id: string, label: string, group: string, y: number, targetId: string): TopicNode {
  return { id, label, group, kind: "branch", side: "left", x: BRANCH_LEFT_X, y, w: BRANCH_W, h: NODE_H, targetId, hours: 6, difficulty: "Medium" }
}

function right(id: string, label: string, group: string, y: number, targetId: string): TopicNode {
  return { id, label, group, kind: "branch", side: "right", x: BRANCH_RIGHT_X, y, w: BRANCH_W, h: NODE_H, targetId, hours: 6, difficulty: "Medium" }
}

function resourcesFor(node: TopicNode, roadmap: RoadmapDefinition): Resource[] {
  if (node.id === "http" || node.id === "web-architecture" || node.id === "request-response") {
    return [
      {
        type: "Articles",
        title: "A Complete Beginner's Guide",
        source: "freeCodeCamp",
        description: "Everything you need to get started with this topic, from fundamentals to hands-on projects.",
        url: "https://www.freecodecamp.org/news/complete-guide",
      },
      {
        type: "Articles",
        title: "Deep Dive: Core Concepts Explained",
        source: "Medium",
        description: "An in-depth walkthrough of the most important concepts and how they connect.",
        url: "https://medium.com/@dev/core-concepts",
      },
      {
        type: "Articles",
        title: "Practical Patterns & Anti-Patterns",
        source: "Dev.to",
        description: "Real-world patterns every developer should know, plus common mistakes to avoid.",
        url: "https://dev.to/patterns-guide",
      },
      {
        type: "Videos",
        title: "Crash Course in 100 Seconds",
        source: "YouTube - Fireship · 12:34",
        description: "Fast visual explanation before you read documentation.",
        url: "https://youtube.com/watch?v=example1",
      },
      {
        type: "Videos",
        title: "Build a Full Project From Scratch",
        source: "YouTube - Traversy Media · 1:24:00",
        description: "A practical build that uses the concept in a complete workflow.",
        url: "https://youtube.com/watch?v=example2",
      },
      {
        type: "Documentation",
        title: "MDN Web Docs - Reference",
        source: "developer.mozilla.org",
        description: "Reference docs and examples for browser behavior.",
        url: "https://developer.mozilla.org/en-US/docs/Web/HTTP",
      },
    ]
  }

  return [
    {
      type: "Articles",
      title: `${node.label} - Practical Guide`,
      source: "NEXUS curated",
      description: `A focused guide for understanding ${node.label} and where it fits in the ${roadmap.roleName} roadmap.`,
      url: "https://developer.mozilla.org/",
    },
    {
      type: "Videos",
      title: `${node.label} Crash Course`,
      source: "YouTube · 14:20",
      description: "A short video walkthrough with examples and common gotchas.",
      url: "https://youtube.com/",
    },
    {
      type: "Documentation",
      title: `${node.label} Reference`,
      source: "MDN / Official docs",
      description: "Reference material to keep open while practicing.",
      url: "https://developer.mozilla.org/",
    },
  ]
}

export default function StudentRoadmapPage() {
  const [query, setQuery] = useState("")
  const [isAristotleOpen, setIsAristotleOpen] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>("roadmap")
  const [activeRoadmapId, setActiveRoadmapId] = useState<RoadmapId>("frontend-engineer")
  const [activePathway, setActivePathway] = useState<JobPathwayDefinition>(DOORDASH_BACKEND_PATHWAY)
  const [pathwayStatus, setPathwayStatus] = useState("")
  const [pathwayError, setPathwayError] = useState("")
  const [generationKey, setGenerationKey] = useState(0)
  const [selectedNode, setSelectedNode] = useState<TopicNode | null>(null)
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set())
  const [savedArtifactIds, setSavedArtifactIds] = useState<Set<SavedArtifactId>>(new Set())
  const [zoom, setZoom] = useState(1)
  const [customization, setCustomization] = useState<RoadmapCustomization>({
    expertise: "",
    goal: "",
    hoursPerWeek: "",
  })
  const viewportRef = useRef<HTMLDivElement>(null)

  const activeRoadmap = ROADMAPS[activeRoadmapId]
  const activeArtifactId = viewMode === "pathway" ? activePathway.id : activeRoadmap.id
  const saved = savedArtifactIds.has(activeArtifactId)
  const progress = activeRoadmap.nodes.length ? Math.round((completedIds.size / activeRoadmap.nodes.length) * 100) : 0

  function updateCustomization(field: keyof RoadmapCustomization, value: string) {
    setCustomization((current) => ({ ...current, [field]: value }))
  }

  function generateRoadmap(nextRoadmapId: RoadmapId) {
    if (isGenerating) return
    setPathwayStatus("")
    setPathwayError("")
    setActiveRoadmapId(nextRoadmapId)
    setViewMode("roadmap")
    setSelectedNode(null)
    setCompletedIds(new Set())
    setZoom(1)
    viewportRef.current?.scrollTo({ left: 0, top: 0 })
    setGenerationKey((current) => current + 1)
    setIsGenerating(true)
    window.setTimeout(() => setIsGenerating(false), 1150)
  }

  async function generatePathway(prompt: string) {
    if (isGenerating) return

    const previousPathway = activePathway
    const draftPathway: JobPathwayDefinition = {
      ...DOORDASH_BACKEND_PATHWAY,
      id: "generating-job-pathway",
      title: "Generating Job Pathway",
      targetCompany: "Target company",
      targetRole: "Target role",
      description: "Aristotle is building a role-specific pathway from the prompt.",
      duration: "Generating",
      output: "Live generation in progress",
      stages: [],
    }

    setViewMode("pathway")
    setSelectedNode(null)
    setZoom(1)
    setGenerationKey((current) => current + 1)
    setPathwayError("")
    setPathwayStatus("Connecting to the pathway generator...")
    setActivePathway(draftPathway)
    setIsGenerating(true)
    viewportRef.current?.scrollTo({ left: 0, top: 0 })

    try {
      const response = await fetch("/api/student/pathway", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      })

      if (!response.ok || !response.body) {
        throw new Error("Pathway API request failed")
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() || ""

        for (const line of lines) {
          if (!line.trim()) continue
          const event = JSON.parse(line)

          if (event.type === "status") {
            setPathwayStatus(event.message || "Generating pathway...")
          }

          if (event.type === "meta") {
            setActivePathway((current) => ({
              ...current,
              id: `generating-${Date.now()}`,
              title: event.meta.title,
              targetCompany: event.meta.targetCompany,
              targetRole: event.meta.targetRole,
              description: event.meta.description,
              duration: event.meta.duration,
              output: event.meta.output,
            }))
            setPathwayStatus(`Building ${event.meta.targetRole} at ${event.meta.targetCompany}...`)
          }

          if (event.type === "stage") {
            setActivePathway((current) => {
              const stages = current.stages.some((stage) => stage.id === event.stage.id)
                ? current.stages.map((stage) => (stage.id === event.stage.id ? event.stage : stage))
                : [...current.stages, event.stage]
              const maxStageBottom = stages.reduce((max, stage) => Math.max(max, stage.y + stage.h), 0)

              return {
                ...current,
                canvasHeight: Math.max(920, maxStageBottom + 145),
                stages,
              }
            })
            setPathwayStatus(`Added stage: ${event.stage.title}`)
          }

          if (event.type === "final") {
            setActivePathway(event.pathway)
            setPathwayStatus("Pathway ready.")
          }

          if (event.type === "error") {
            throw new Error(event.message || "Pathway generation failed")
          }
        }
      }
    } catch (error) {
      console.error("[student-pathway] client_failed", error)
      setActivePathway(previousPathway)
      setPathwayStatus("")
      setPathwayError(error instanceof Error ? error.message : "Pathway generation failed")
    } finally {
      setIsGenerating(false)
    }
  }

  function changeViewMode(mode: ViewMode) {
    setViewMode(mode)
    setSelectedNode(null)
    setZoom(1)
    viewportRef.current?.scrollTo({ left: 0, top: 0 })
  }

  function runAristotle() {
    const prompt = query.trim()
    if (!prompt || isGenerating) return
    setQuery("")
    if (viewMode === "pathway" || isPathwayPrompt(prompt)) {
      void generatePathway(prompt)
      return
    }
    generateRoadmap(roadmapIdForPrompt(prompt))
  }

  function fitCanvasToViewport() {
    const viewport = viewportRef.current
    if (!viewport) return
    const canvasWidth = viewMode === "pathway" ? activePathway.canvasWidth : activeRoadmap.canvasWidth
    const nextZoom = Math.max(0.48, Math.min(1, (viewport.clientWidth - 40) / canvasWidth))
    setZoom(nextZoom)
    window.setTimeout(() => {
      viewport.scrollTo({ left: Math.max((canvasWidth * nextZoom - viewport.clientWidth) / 2, 0), top: 0, behavior: "smooth" })
    }, 0)
  }

  function resetCanvasView() {
    setZoom(1)
    viewportRef.current?.scrollTo({ left: 0, top: 0, behavior: "smooth" })
  }

  function openFullscreen() {
    viewportRef.current?.requestFullscreen?.()
  }

  function toggleNodeComplete(node: TopicNode) {
    setCompletedIds((current) => {
      const next = new Set(current)
      if (next.has(node.id)) next.delete(node.id)
      else next.add(node.id)
      return next
    })
  }

  function saveRoadmap() {
    const savedRoadmap =
      viewMode === "pathway"
        ? {
            id: activePathway.id,
            title: activePathway.title,
            savedAt: "Saved now",
            phases: activePathway.stages.length,
            nodes: activePathway.stages.length,
            hours: 0,
            duration: activePathway.duration,
            targetCompany: activePathway.targetCompany,
            targetRole: activePathway.targetRole,
            customization,
          }
        : {
            id: activeRoadmap.id,
            title: activeRoadmap.title,
            savedAt: "Saved now",
            phases: activeRoadmap.groups.length,
            nodes: activeRoadmap.nodes.length,
            hours: activeRoadmap.estimatedHours,
            duration: activeRoadmap.duration,
            customization,
          }
    const existing = JSON.parse(localStorage.getItem("nexus-student-saved-roadmaps") || "[]")
    localStorage.setItem("nexus-student-saved-roadmaps", JSON.stringify([savedRoadmap, ...existing]))
    setSavedArtifactIds((current) => new Set(current).add(activeArtifactId))
  }

  return (
    <main className="flex h-full min-w-0 flex-1 overflow-hidden bg-[#F6F2EA] text-[#241f18] dark:bg-[#050505] dark:text-white">
      {isAristotleOpen && (
        <AristotlePanel
          query={query}
          isGenerating={isGenerating}
          viewMode={viewMode}
          activeRoadmap={activeRoadmap}
          activeRoadmapId={activeRoadmapId}
          activePathway={activePathway}
          pathwayStatus={pathwayStatus}
          pathwayError={pathwayError}
          customization={customization}
          onQueryChange={setQuery}
          onSubmit={runAristotle}
          onQuickSelect={generateRoadmap}
          onCustomizationChange={updateCustomization}
          onClose={() => setIsAristotleOpen(false)}
        />
      )}

      {!isAristotleOpen && (
        <button
          type="button"
          onClick={() => setIsAristotleOpen(true)}
          className="absolute left-[112px] top-6 z-40 inline-flex h-10 items-center gap-2 rounded-full border border-[#DED4C7] bg-[#FFFDF8] px-4 text-[11px] font-black uppercase tracking-[0.14em] text-[#756B63] shadow-xl hover:text-[#FF8A1D]"
        >
          <PanelLeftOpen size={15} />
          Aristotle
        </button>
      )}

      <section className="relative flex h-full min-w-0 flex-1 flex-col overflow-hidden bg-[#F7F2EA] dark:bg-[#050505]">
        <TopHeader
          roadmap={activeRoadmap}
          progress={progress}
          completedCount={completedIds.size}
          viewMode={viewMode}
          pathway={activePathway}
          customization={customization}
          onViewModeChange={changeViewMode}
          onFullscreen={openFullscreen}
          onFitScreen={fitCanvasToViewport}
          onReset={resetCanvasView}
          onSave={saveRoadmap}
          saved={saved}
        />
        {viewMode === "roadmap" ? (
          <RoadmapShCanvas
            roadmap={activeRoadmap}
            generationKey={generationKey}
            isGenerating={isGenerating}
            zoom={zoom}
            viewportRef={viewportRef}
            completedIds={completedIds}
            selectedNode={selectedNode}
            onNodeClick={setSelectedNode}
            onToggleComplete={toggleNodeComplete}
          />
        ) : (
          <JobPathwayCanvas
            pathway={activePathway}
            generationKey={generationKey}
            isGenerating={isGenerating}
            status={pathwayStatus}
            zoom={zoom}
            viewportRef={viewportRef}
          />
        )}

        <AnimatePresence>
          {viewMode === "roadmap" && selectedNode && (
            <ResourceOverlay
              roadmap={activeRoadmap}
              node={selectedNode}
              completed={completedIds.has(selectedNode.id)}
              onToggleComplete={() => toggleNodeComplete(selectedNode)}
              onClose={() => setSelectedNode(null)}
            />
          )}
        </AnimatePresence>
      </section>
    </main>
  )
}

function AristotlePanel({
  query,
  isGenerating,
  viewMode,
  activeRoadmap,
  activeRoadmapId,
  activePathway,
  pathwayStatus,
  pathwayError,
  customization,
  onQueryChange,
  onSubmit,
  onQuickSelect,
  onCustomizationChange,
  onClose,
}: {
  query: string
  isGenerating: boolean
  viewMode: ViewMode
  activeRoadmap: RoadmapDefinition
  activeRoadmapId: RoadmapId
  activePathway: JobPathwayDefinition
  pathwayStatus: string
  pathwayError: string
  customization: RoadmapCustomization
  onQueryChange: (value: string) => void
  onSubmit: () => void
  onQuickSelect: (id: RoadmapId) => void
  onCustomizationChange: (field: keyof RoadmapCustomization, value: string) => void
  onClose: () => void
}) {
  return (
    <aside className="relative flex h-full w-[372px] shrink-0 flex-col overflow-hidden border-r border-[#DED4C7]/70 bg-[#F5F1EA] px-6 py-6 dark:border-white/[0.06] dark:bg-[#0A0A0A]">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#DED4C733_1px,transparent_1px),linear-gradient(to_bottom,#DED4C733_1px,transparent_1px)] bg-[size:30px_30px] opacity-30 dark:opacity-10" />
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 z-10 grid h-9 w-9 place-items-center rounded-full border border-[#DED4C7] bg-[#FFFDF8] text-[#7A7168] hover:text-[#FF8A1D] dark:border-white/10 dark:bg-white/[0.04]"
        aria-label="Toggle Aristotle chat"
      >
        <PanelLeftClose size={16} />
      </button>

      <div className="relative mt-8">
        <OmniLogo size={36} className="text-[#1F2A38] dark:text-white" />
        <p className="mt-8 text-[10px] font-black uppercase tracking-[0.34em] text-[#FF8A1D]">Aristotle</p>
        <h1 className="mt-3 text-[30px] font-black leading-[1.02] tracking-[-0.045em] text-[#241f18] dark:text-white">
          {viewMode === "pathway" ? "Build the job pathway." : "Build the role roadmap."}
        </h1>
        <p className="mt-3 text-sm font-semibold leading-6 text-[#756B63] dark:text-white/50">
          {viewMode === "pathway"
            ? "Describe the company and role. Aristotle streams a live pathway into the canvas."
            : "Pick a suggestion or describe a role to generate a guided visual roadmap."}
        </p>
      </div>

      <div className={cn("relative mt-7 min-h-0 flex-1 overflow-y-auto pr-2", STUDENT_SCROLLBAR)}>
        <QuickRoadmapSuggestions activeRoadmapId={activeRoadmapId} isGenerating={isGenerating} onSelect={onQuickSelect} />

        {isGenerating && (
          <div className="mt-5 overflow-hidden rounded-[18px] border border-[#DED4C7] bg-[#FFFDF8]/88 px-4 py-3 dark:border-white/10 dark:bg-white/[0.04]">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#FF8A1D]">
              <Sparkles size={14} />
              {viewMode === "pathway" ? "Generating pathway" : `Generating ${activeRoadmap.roleName}`}
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#EEE4D7]">
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: "120%" }}
                transition={{ duration: 0.95, ease: "easeInOut", repeat: Infinity }}
                className="h-full w-1/2 rounded-full bg-[#FF8A1D]"
              />
            </div>
          </div>
        )}

        {viewMode === "pathway" && (pathwayStatus || pathwayError || activePathway.stages.length > 0) && (
          <div className="mt-5 overflow-hidden rounded-[18px] border border-[#DED4C7] bg-[#FFFDF8]/88 px-4 py-3 dark:border-white/10 dark:bg-white/[0.04]">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#FF8A1D]">
              <Bot size={14} />
              Live pathway
            </div>
            <p className={cn("mt-3 text-sm font-black leading-5", pathwayError ? "text-[#D83A2E]" : "text-[#241f18] dark:text-white")}>
              {pathwayError || pathwayStatus || `${activePathway.targetRole} at ${activePathway.targetCompany}`}
            </p>
            <p className="mt-2 text-[11px] font-semibold leading-4 text-[#756B63] dark:text-white/45">
              {activePathway.stages.length ? `${activePathway.stages.length} stages on canvas` : "Waiting for first streamed stage"}
            </p>
          </div>
        )}

        <CustomizeRoadmap roadmap={activeRoadmap} customization={customization} onChange={onCustomizationChange} />
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit()
        }}
        className="relative mt-5"
      >
        <div className="relative rounded-[22px] border border-[#DED4C7] bg-[#FFFDF8] shadow-[0_14px_36px_rgba(42,37,32,0.08)] dark:border-white/10 dark:bg-[#141414]">
          <input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            disabled={isGenerating}
            placeholder={viewMode === "pathway" ? "Try: create a pathway to get a backend job at Microsoft" : "Try: Data Analyst or AI Engineer"}
            className="h-[58px] w-full rounded-[22px] bg-transparent px-4 pr-14 text-sm font-semibold text-[#241f18] outline-none placeholder:text-[#B7AEA5] disabled:opacity-50 dark:text-white dark:placeholder:text-white/30"
          />
          <button
            type="submit"
            disabled={!query.trim() || isGenerating}
            className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-[#FF8A1D] text-white shadow-[0_12px_26px_rgba(255,138,29,0.26)] transition hover:bg-[#E87308] disabled:pointer-events-none disabled:bg-[#DED4C7] disabled:shadow-none dark:disabled:bg-white/10"
            aria-label="Generate roadmap"
          >
            <ArrowUp size={17} />
          </button>
        </div>
      </form>
    </aside>
  )
}

function QuickRoadmapSuggestions({
  activeRoadmapId,
  isGenerating,
  onSelect,
}: {
  activeRoadmapId: RoadmapId
  isGenerating: boolean
  onSelect: (id: RoadmapId) => void
}) {
  return (
    <section>
      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#8A8177] dark:text-white/35">Quick suggestions</p>
      <div className="mt-3 space-y-2">
        {QUICK_ROADMAP_IDS.map((id) => {
          const roadmap = ROADMAPS[id]
          const active = id === activeRoadmapId

          return (
            <button
              key={id}
              type="button"
              disabled={isGenerating}
              onClick={() => onSelect(id)}
              className={cn(
                "group flex w-full items-center justify-between rounded-[16px] border px-3 py-3 text-left transition disabled:pointer-events-none disabled:opacity-60",
                active
                  ? "border-[#FF8A1D]/50 bg-[#FFE1C7] text-[#241f18] shadow-[0_12px_26px_rgba(255,138,29,0.12)]"
                  : "border-[#DED4C7] bg-[#FFFDF8]/82 text-[#4F463E] hover:border-[#FF8A1D]/45 hover:text-[#DF5F12] dark:border-white/10 dark:bg-white/[0.04] dark:text-white/70"
              )}
            >
              <span className="flex min-w-0 items-center gap-3">
                <span
                  className={cn(
                    "grid h-8 w-8 shrink-0 place-items-center rounded-full",
                    active ? "bg-[#FF8A1D] text-white" : "bg-[#F0E7DA] text-[#7A7168] group-hover:text-[#DF5F12]"
                  )}
                >
                  {active ? <Check size={15} /> : <Sparkles size={15} />}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-black">{roadmap.roleName}</span>
                  <span className="mt-0.5 block text-[11px] font-semibold text-[#756B63] dark:text-white/38">
                    {roadmap.estimatedHours}h / {roadmap.duration}
                  </span>
                </span>
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}

function CustomizeRoadmap({
  roadmap,
  customization,
  onChange,
}: {
  roadmap: RoadmapDefinition
  customization: RoadmapCustomization
  onChange: (field: keyof RoadmapCustomization, value: string) => void
}) {
  const expertiseOptions = [
    ["", "Select your expertise"],
    ["No experience", "No experience (just starting out)"],
    ["Beginner", "Beginner (less than 1 year of experience)"],
    ["Intermediate", "Intermediate (1-3 years of experience)"],
    ["Expert", "Expert (3-5 years of experience)"],
    ["Master", "Master (5+ years of experience)"],
  ]
  const goalOptions = [
    ["", "Select your goal"],
    ["Finding a job", "Finding a job"],
    ["Learning for fun", "Learning for fun"],
    ["Building a side project", "Building a side project"],
    ["Switching careers", "Switching careers"],
    ["Getting a promotion", "Getting a promotion"],
    ["Filling knowledge gaps", "Filling knowledge gaps"],
    ["Other", "Other"],
  ]

  return (
    <section className="mt-5 rounded-[18px] border border-[#DED4C7] bg-[#FFFDF8]/82 p-4 dark:border-white/10 dark:bg-white/[0.04]">
      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#8A8177] dark:text-white/35">Customize</p>
      <label className="mt-4 block text-[12px] font-black leading-5 text-[#2D3848] dark:text-white/78">
        Rate your expertise in {roadmap.roleName} Roadmap:
        <select
          value={customization.expertise}
          onChange={(event) => onChange("expertise", event.target.value)}
          className="mt-2 h-11 w-full rounded-xl border border-[#CBD3DE] bg-white px-3 text-sm font-semibold text-[#111827] outline-none focus:border-[#6B7280] dark:border-white/10 dark:bg-[#111] dark:text-white"
        >
          {expertiseOptions.map(([value, label]) => (
            <option key={label} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label className="mt-4 block text-[12px] font-black leading-5 text-[#2D3848] dark:text-white/78">
        What is your goal?
        <select
          value={customization.goal}
          onChange={(event) => onChange("goal", event.target.value)}
          className="mt-2 h-11 w-full rounded-xl border border-[#CBD3DE] bg-white px-3 text-sm font-semibold text-[#111827] outline-none focus:border-[#6B7280] dark:border-white/10 dark:bg-[#111] dark:text-white"
        >
          {goalOptions.map(([value, label]) => (
            <option key={label} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label className="mt-4 block text-[12px] font-black leading-5 text-[#2D3848] dark:text-white/78">
        Weekly study time
        <input
          value={customization.hoursPerWeek}
          onChange={(event) => onChange("hoursPerWeek", event.target.value)}
          placeholder="e.g. 10 hours per week"
          className="mt-2 h-11 w-full rounded-xl border border-[#CBD3DE] bg-white px-3 text-sm font-semibold text-[#111827] outline-none placeholder:text-[#98A2B3] focus:border-[#6B7280] dark:border-white/10 dark:bg-[#111] dark:text-white"
        />
      </label>
    </section>
  )
}

function TopHeader({
  roadmap,
  progress,
  completedCount,
  viewMode,
  pathway,
  customization,
  onViewModeChange,
  onFullscreen,
  onFitScreen,
  onReset,
  onSave,
  saved,
}: {
  roadmap: RoadmapDefinition
  progress: number
  completedCount: number
  viewMode: ViewMode
  pathway: JobPathwayDefinition
  customization: RoadmapCustomization
  onViewModeChange: (mode: ViewMode) => void
  onFullscreen: () => void
  onFitScreen: () => void
  onReset: () => void
  onSave: () => void
  saved: boolean
}) {
  const customizationChips = [customization.expertise, customization.goal, customization.hoursPerWeek].filter(Boolean)
  const isPathway = viewMode === "pathway"
  const title = isPathway ? pathway.title : `${roadmap.roleName} - Roadmap`
  const description = isPathway ? pathway.description : roadmap.description

  return (
    <header className="relative z-20 shrink-0 border-b border-[#DED4C7]/70 bg-[#FFFDF8]/94 px-6 py-4 backdrop-blur dark:border-white/10 dark:bg-[#0D0D0D]/92">
      <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-center 2xl:justify-between">
        <div className="min-w-0">
          <p className="font-mono text-sm font-black text-[#241f18] dark:text-white">{title}</p>
          <p className="mt-1 max-w-2xl text-xs font-semibold text-[#756B63]">{description}</p>
          {customizationChips.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {customizationChips.map((chip) => (
                <span key={chip} className="rounded-full border border-[#DED4C7] bg-[#F6F2EA] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-[#756B63]">
                  {chip}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-3 xl:flex-row xl:flex-wrap xl:items-center xl:justify-end">
          <div className="flex flex-wrap items-center gap-3">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onViewModeChange(tab.id)}
              className={cn(
                "rounded-full border px-4 py-2 text-[11px] font-black uppercase tracking-[0.13em] transition",
                viewMode === tab.id
                  ? "border-[#FF8A1D]/55 bg-[#FFE1C7] text-[#DF5F12] shadow-[0_10px_26px_rgba(255,138,29,0.14)]"
                  : "border-[#DED4C7] bg-[#FFFDF8] text-[#7A7168] hover:border-[#FF8A1D]/35 hover:text-[#DF5F12]"
              )}
            >
              {tab.label}
            </button>
          ))}
          <div className="flex flex-wrap gap-2 text-[11px] font-black uppercase tracking-[0.12em] text-[#6F675F]">
            {isPathway ? (
              <>
                <span>{pathway.stages.length} stages</span>
                <span>|</span>
                <span>{pathway.duration}</span>
                <span>|</span>
                <span>{pathway.targetCompany}</span>
                <span>|</span>
                <span>{pathway.targetRole}</span>
              </>
            ) : (
              <>
                <span>{progress}% complete</span>
                <span>|</span>
                <span>
                  {completedCount} of {roadmap.nodes.length} topics
                </span>
                <span>|</span>
                <span>
                  {roadmap.estimatedHours} hours / {roadmap.duration}
                </span>
                <span>|</span>
                <span>Updated just now</span>
              </>
            )}
          </div>
        </div>
          <CanvasChrome saved={saved} onFullscreen={onFullscreen} onFitScreen={onFitScreen} onReset={onReset} onSave={onSave} />
      </div>
      </div>
    </header>
  )
}

function RoadmapShCanvas({
  roadmap,
  generationKey,
  isGenerating,
  zoom,
  viewportRef,
  completedIds,
  selectedNode,
  onNodeClick,
  onToggleComplete,
}: {
  roadmap: RoadmapDefinition
  generationKey: number
  isGenerating: boolean
  zoom: number
  viewportRef: React.RefObject<HTMLDivElement | null>
  completedIds: Set<string>
  selectedNode: TopicNode | null
  onNodeClick: (node: TopicNode) => void
  onToggleComplete: (node: TopicNode) => void
}) {
  const nodeById = useMemo(() => new Map(roadmap.nodes.map((node) => [node.id, node])), [roadmap.nodes])
  const connectors = roadmap.nodes.filter((node) => node.targetId).map((node) => ({ node, target: nodeById.get(node.targetId || "") }))

  return (
    <div ref={viewportRef} className="relative min-h-0 flex-1 overflow-auto bg-[#F7F2EA]">
      <div
        className="relative mx-auto"
        style={{
          width: roadmap.canvasWidth * zoom,
          height: roadmap.canvasHeight * zoom,
        }}
      >
        <motion.div
          key={`${roadmap.id}-${generationKey}`}
          className="relative"
          initial={{ opacity: 0.65 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.28 }}
          style={{
            width: roadmap.canvasWidth,
            height: roadmap.canvasHeight,
            transform: `scale(${zoom})`,
            transformOrigin: "top left",
          backgroundImage: "radial-gradient(#D8CFC4 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      >
        <div className="absolute left-1/2 top-14 -translate-x-1/2 text-center">
          <h2 className="text-2xl font-semibold text-[#241f18]">{roadmap.title}</h2>
        </div>

        <svg className="absolute inset-0 h-full w-full" aria-hidden="true">
          <motion.line
            x1={SPINE_X}
            y1={105}
            x2={SPINE_X}
            y2={roadmap.canvasHeight - 80}
            stroke="#FF8A1D"
            strokeWidth="4"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.75, ease: "easeInOut" }}
          />
          {roadmap.groups.map((group) => (
            <text key={group.label} x={SPINE_X} y={group.y} textAnchor="middle" className="fill-[#241f18] text-[15px] font-semibold">
              {group.label}
            </text>
          ))}
          {connectors.map(({ node, target }) => {
            if (!target) return null
            const fromX = node.side === "left" ? node.x + node.w : node.x
            const fromY = node.y + node.h / 2
            const toX = node.side === "left" ? target.x : target.x + target.w
            const toY = target.y + target.h / 2
            const bendX = node.side === "left" ? target.x - 72 : target.x + target.w + 72
            return (
              <motion.path
                key={`${node.id}-${target.id}`}
                d={`M ${fromX} ${fromY} C ${bendX} ${fromY}, ${bendX} ${toY}, ${toX} ${toY}`}
                fill="none"
                stroke="#FF8A1D"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray="2 9"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.55, delay: 0.16, ease: "easeOut" }}
              />
            )
          })}
        </svg>

        {roadmap.nodes.map((node, index) => (
          <TopicBox
            key={`${generationKey}-${node.id}`}
            node={node}
            index={index}
            active={selectedNode?.id === node.id}
            completed={completedIds.has(node.id)}
            onClick={() => onNodeClick(node)}
            onToggleComplete={() => onToggleComplete(node)}
          />
        ))}

        <AnimatePresence>
          {isGenerating && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="absolute left-1/2 top-[92px] z-20 -translate-x-1/2 rounded-full border border-[#FF8A1D]/30 bg-[#FFFDF8]/92 px-4 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-[#DF5F12] shadow-[0_12px_28px_rgba(255,138,29,0.14)]"
            >
              Drawing roadmap
            </motion.div>
          )}
        </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}

function JobPathwayCanvas({
  pathway,
  generationKey,
  isGenerating,
  status,
  zoom,
  viewportRef,
}: {
  pathway: JobPathwayDefinition
  generationKey: number
  isGenerating: boolean
  status: string
  zoom: number
  viewportRef: React.RefObject<HTMLDivElement | null>
}) {
  const connectors = pathway.stages.slice(0, -1).map((stage, index) => {
    const next = pathway.stages[index + 1]
    return { from: stage, to: next }
  })

  return (
    <div ref={viewportRef} className="relative min-h-0 flex-1 overflow-auto bg-[#F7F2EA]">
      <div
        className="relative mx-auto"
        style={{
          width: pathway.canvasWidth * zoom,
          height: pathway.canvasHeight * zoom,
        }}
      >
        <motion.div
          key={`${pathway.id}-${generationKey}`}
          className="relative"
          initial={{ opacity: 0.72 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.28 }}
          style={{
            width: pathway.canvasWidth,
            height: pathway.canvasHeight,
            transform: `scale(${zoom})`,
            transformOrigin: "top left",
            backgroundImage: "radial-gradient(#D8CFC4 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }}
        >
          <div className="absolute left-1/2 top-10 -translate-x-1/2 text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#DF5F12]">
              {isGenerating ? "Live job pathway" : "Job pathway"}
            </p>
            <h2 className="mt-2 text-[25px] font-black leading-tight text-[#241f18]">{pathway.targetRole} at {pathway.targetCompany}</h2>
            <p className="mx-auto mt-2 max-w-[520px] text-sm font-semibold leading-5 text-[#756B63]">
              {isGenerating && status ? status : `${pathway.duration} plan from proof to interview loop`}
            </p>
          </div>

          <svg className="absolute inset-0 h-full w-full" aria-hidden="true">
            {connectors.map(({ from, to }, index) => {
              const fromX = from.x + from.w / 2
              const fromY = from.y + from.h / 2
              const toX = to.x + to.w / 2
              const toY = to.y + to.h / 2
              const midX = fromX + (toX - fromX) / 2
              const midY = fromY + (toY - fromY) / 2
              const sameRow = Math.abs(fromY - toY) < 20
              const d = sameRow
                ? `M ${fromX} ${fromY} C ${midX} ${fromY}, ${midX} ${toY}, ${toX} ${toY}`
                : `M ${fromX} ${fromY} C ${fromX} ${midY}, ${toX} ${midY}, ${toX} ${toY}`

              return (
                <motion.path
                  key={`${from.id}-${to.id}`}
                  d={d}
                  fill="none"
                  stroke="#FF8A1D"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray="8 10"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 0.9 }}
                  transition={{ duration: 0.52, delay: 0.08 + index * 0.08, ease: "easeOut" }}
                />
              )
            })}
          </svg>

          {pathway.stages.map((stage, index) => (
            <PathwayStageCard key={stage.id} stage={stage} index={index} />
          ))}

          {isGenerating && pathway.stages.length === 0 && (
            <div className="absolute left-1/2 top-[190px] w-[520px] -translate-x-1/2 rounded-[22px] border border-[#DED4C7] bg-[#FFFDF8]/90 p-5 text-center shadow-[0_18px_50px_rgba(42,37,32,0.08)]">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#FFE1C7] text-[#DF5F12]">
                <Sparkles size={18} />
              </div>
              <p className="mt-4 text-[11px] font-black uppercase tracking-[0.18em] text-[#DF5F12]">Streaming from API</p>
              <p className="mt-2 text-sm font-black text-[#241f18]">{status || "Waiting for the first pathway stage..."}</p>
            </div>
          )}

          <div className="absolute bottom-9 left-1/2 flex w-[780px] -translate-x-1/2 items-center justify-between rounded-[18px] border border-[#DED4C7] bg-[#FFFDF8]/88 px-5 py-4 shadow-[0_18px_50px_rgba(42,37,32,0.06)]">
            <span className="text-[11px] font-black uppercase tracking-[0.18em] text-[#756B63]">Output</span>
            <span className="text-sm font-black text-[#241f18]">{pathway.output}</span>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

function PathwayStageCard({ stage, index }: { stage: PathwayStage; index: number }) {
  const tone = {
    start: "border-[#2A2520] bg-[#241f18] text-[#FFFDF8]",
    skill: "border-[#2A2520] bg-[#FFF1D6] text-[#241f18]",
    proof: "border-[#2A2520] bg-[#FFB84D] text-[#241f18]",
    apply: "border-[#DED4C7] bg-[#FFFDF8] text-[#241f18]",
    interview: "border-[#FF8A1D] bg-[#FFE1C7] text-[#241f18]",
    offer: "border-[#00BFB0] bg-[#B7F4EA] text-[#006F66]",
  }[stage.tone]
  const mutedText = stage.tone === "start" ? "text-[#FFFDF8]/62" : "text-[#756B63]"

  return (
    <motion.section
      initial={{ opacity: 0, y: 10, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.28, delay: 0.12 + index * 0.06, ease: "easeOut" }}
      className={cn("absolute flex flex-col overflow-hidden rounded-[18px] border-2 p-4 shadow-[0_16px_38px_rgba(42,37,32,0.08)]", tone)}
      style={{ left: stage.x, top: stage.y, width: stage.w, height: stage.h }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className={cn("text-[9px] font-black uppercase tracking-[0.2em]", stage.tone === "start" ? "text-[#FFB84D]" : "text-[#DF5F12]")}>
            {stage.eyebrow}
          </p>
          <h3 className="mt-2 text-[15px] font-black leading-[1.15]">{stage.title}</h3>
        </div>
        <span className={cn("shrink-0 rounded-full px-2 py-1 text-[8px] font-black uppercase tracking-[0.1em]", stage.tone === "start" ? "bg-white/10 text-[#FFFDF8]" : "bg-[#FFFDF8]/72 text-[#756B63]")}>
          {stage.metric}
        </span>
      </div>
      <p className={cn("mt-2 text-[11px] font-semibold leading-4", mutedText)}>{stage.summary}</p>
      <div className="mt-auto grid grid-cols-1 gap-1.5 pt-3">
        {stage.tasks.map((task) => (
          <div key={task} className={cn("flex items-center gap-2 text-[9px] font-black leading-3", stage.tone === "start" ? "text-[#FFFDF8]/78" : "text-[#4F463E]")}>
            <Check size={11} className="shrink-0" />
            <span className="truncate">{task}</span>
          </div>
        ))}
      </div>
    </motion.section>
  )
}

function TopicBox({
  node,
  index,
  active,
  completed,
  onClick,
  onToggleComplete,
}: {
  node: TopicNode
  index: number
  active: boolean
  completed: boolean
  onClick: () => void
  onToggleComplete: () => void
}) {
  return (
    <motion.button
      type="button"
      layout
      initial={{ opacity: 0, scale: 0.92, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.28, delay: Math.min(index * 0.018, 0.72), ease: "easeOut" }}
      onClick={onClick}
      className={cn(
        "absolute rounded-md border-2 px-4 text-center font-mono text-[12px] font-black shadow-sm transition hover:-translate-y-0.5",
        node.kind === "core" && "border-[#2A2520] bg-[#FFB84D] text-[#241f18]",
        node.kind === "branch" && "border-[#2A2520] bg-[#FFF1D6] text-[#241f18]",
        node.kind === "milestone" && "border-[#2A2520] bg-[#241f18] text-[#FFFDF8]",
        completed && "border-[#00BFB0] bg-[#B7F4EA] text-[#006F66]",
        active && "ring-4 ring-[#FF8A1D]/25"
      )}
      style={{ left: node.x, top: node.y, width: node.w, height: node.h }}
    >
      {node.label}
      <span
        role="button"
        tabIndex={0}
        onClick={(event) => {
          event.stopPropagation()
          onToggleComplete()
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault()
            event.stopPropagation()
            onToggleComplete()
          }
        }}
        className="absolute -right-3 -top-3 grid h-6 w-6 place-items-center rounded-full border border-[#DED4C7] bg-[#FFFDF8] text-[#8A8177] shadow-sm hover:text-[#00AFA0]"
        aria-label={`Mark ${node.label} complete`}
      >
        {completed ? <Check size={14} /> : <Plus size={13} />}
      </span>
    </motion.button>
  )
}

function CanvasChrome({
  saved,
  onFullscreen,
  onFitScreen,
  onReset,
  onSave,
}: {
  saved: boolean
  onFullscreen: () => void
  onFitScreen: () => void
  onReset: () => void
  onSave: () => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <CanvasButton icon={Maximize2} label="Fullscreen" onClick={onFullscreen} />
      <CanvasButton icon={Minus} label="Fit Screen" onClick={onFitScreen} />
      <CanvasButton icon={RotateCcw} label="Reset" onClick={onReset} />
      <CanvasButton icon={Download} label="Export" onClick={() => window.print()} />
      <button
        type="button"
        onClick={onSave}
        className={cn(
          "inline-flex h-9 items-center gap-2 rounded-full px-3 text-[10px] font-black uppercase tracking-[0.13em] transition",
          saved ? "bg-[#B7F4EA] text-[#006F66]" : "bg-[#00BFB0] text-white hover:bg-[#00A99D]"
        )}
      >
        <Bookmark size={14} fill={saved ? "currentColor" : "none"} />
        {saved ? "Saved" : "Save"}
      </button>
    </div>
  )
}

function ResourceOverlay({
  roadmap,
  node,
  completed,
  onToggleComplete,
  onClose,
}: {
  roadmap: RoadmapDefinition
  node: TopicNode
  completed: boolean
  onToggleComplete: () => void
  onClose: () => void
}) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 z-40 bg-[#241f18]/20 backdrop-blur-[3px]"
        onClick={onClose}
      />
      <ResourceDrawer roadmap={roadmap} node={node} completed={completed} onToggleComplete={onToggleComplete} onClose={onClose} />
    </>
  )
}

function ResourceDrawer({
  roadmap,
  node,
  completed,
  onToggleComplete,
  onClose,
}: {
  roadmap: RoadmapDefinition
  node: TopicNode
  completed: boolean
  onToggleComplete: () => void
  onClose: () => void
}) {
  const grouped = useMemo(() => {
    return resourcesFor(node, roadmap).reduce<Record<ResourceType, Resource[]>>(
      (acc, resource) => {
        acc[resource.type].push(resource)
        return acc
      },
      { Articles: [], Videos: [], Documentation: [] }
    )
  }, [node, roadmap])

  return (
    <motion.aside
      initial={{ x: 460 }}
      animate={{ x: 0 }}
      exit={{ x: 460 }}
      transition={{ type: "spring", stiffness: 340, damping: 32 }}
      className="absolute inset-y-0 right-0 z-50 flex w-[448px] max-w-full flex-col bg-[#FFFDF8] shadow-2xl"
    >
      <div className="flex items-center justify-between border-b border-[#DED4C7] px-6 py-4">
        <h2 className="text-xl font-black tracking-[-0.04em] text-[#241f18]">Learn More: {node.label}</h2>
        <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg border border-[#DED4C7] text-[#7A7168] hover:text-[#241f18]">
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <button
          type="button"
          onClick={onToggleComplete}
          className={cn(
            "mb-6 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg text-[12px] font-black uppercase tracking-[0.12em]",
            completed ? "bg-[#B7F4EA] text-[#006F66]" : "bg-[#FF8A1D] text-white"
          )}
        >
          <Check size={15} />
          {completed ? "Completed" : "Mark progress"}
        </button>

        {(Object.keys(grouped) as ResourceType[]).map((section) => (
          <section key={section} className="mb-7">
            <div className="mb-3 flex items-center gap-2 text-[12px] font-black uppercase tracking-[0.22em] text-[#9A948C]">
              {section === "Articles" && <FileText size={14} />}
              {section === "Videos" && <Play size={14} />}
              {section === "Documentation" && <BookOpen size={14} />}
              {section}
            </div>
            <div className="space-y-3">
              {grouped[section].map((resource) => (
                <a
                  key={resource.title}
                  href={resource.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex gap-4 rounded-xl border border-[#E8DCCC] bg-white px-4 py-4 transition hover:border-[#FF8A1D]/45 hover:shadow-sm"
                >
                  <span
                    className={cn(
                      "grid h-10 w-10 shrink-0 place-items-center rounded-lg",
                      section === "Articles" && "bg-[#EEF2FF] text-[#4F46E5]",
                      section === "Videos" && "bg-[#FFF1F2] text-[#EF4444]",
                      section === "Documentation" && "bg-[#ECFDF5] text-[#10B981]"
                    )}
                  >
                    {section === "Articles" && <FileText size={18} />}
                    {section === "Videos" && <Play size={18} />}
                    {section === "Documentation" && <BookOpen size={18} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-black leading-5 text-[#241f18]">{resource.title}</span>
                    <span className="mt-0.5 block text-[12px] font-black text-[#7A7168]">{resource.source}</span>
                    <span className="mt-2 block text-sm font-medium leading-5 text-[#7A7168]">{resource.description}</span>
                    <span className="mt-2 flex items-center gap-1 truncate text-[12px] font-semibold text-[#94A3B8]">
                      {resource.url}
                      <ExternalLink size={12} />
                    </span>
                  </span>
                </a>
              ))}
            </div>
          </section>
        ))}
      </div>
    </motion.aside>
  )
}

function CanvasButton({ icon: Icon, label, onClick }: { icon: React.ElementType; label: string; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-9 items-center gap-2 rounded-full border border-[#DED4C7] bg-[#FFFDF8] px-3 text-[10px] font-black uppercase tracking-[0.13em] text-[#756B63] shadow-sm transition hover:border-[#FF8A1D]/35 hover:text-[#DF5F12]"
    >
      <Icon size={14} />
      {label}
    </button>
  )
}
