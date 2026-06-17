import type { SherlockEvidence } from "../types"
import { fetchJsonWithTimeout } from "../collector-utils"

type BraveSearchResponse = {
  web?: {
    results?: Array<{
      title?: string
      url?: string
      description?: string
      age?: string
      profile?: { name?: string }
    }>
  }
}

type TavilySearchResponse = {
  query?: string
  results?: Array<{
    title?: string
    url?: string
    content?: string
    score?: number
    favicon?: string
  }>
  response_time?: string
  usage?: { credits?: number }
  request_id?: string
}

export function isSearchConfigured() {
  return Boolean(process.env.BRAVE_SEARCH_API_KEY || process.env.TAVILY_API_KEY)
}

export async function collectSearch(query: string): Promise<SherlockEvidence[]> {
  if (process.env.BRAVE_SEARCH_API_KEY) {
    return collectBraveSearch(query, process.env.BRAVE_SEARCH_API_KEY)
  }

  if (process.env.TAVILY_API_KEY) {
    return collectTavilySearch(query, process.env.TAVILY_API_KEY)
  }

  return [
    {
      id: `ev-search-disabled-${slug(query)}`,
      sourceType: "untrusted_search_hit",
      sourceName: "Search API",
      retrievedAt: new Date().toISOString(),
      summary: "Search collection skipped because no approved search API key is configured.",
      details: ["Set BRAVE_SEARCH_API_KEY or TAVILY_API_KEY to enable this collector."],
      reliability: "untrusted_search_hit",
      normalizedJson: { query, disabled: true },
    },
  ]
}

async function collectBraveSearch(query: string, apiKey: string): Promise<SherlockEvidence[]> {
  const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=5`
  const result = await fetchJsonWithTimeout<BraveSearchResponse>(url, {
    rateLimitKey: "brave-search",
    rateLimit: 10,
    allowedHostnames: ["api.search.brave.com"],
    headers: { "X-Subscription-Token": apiKey },
  })

  if (!result.ok) {
    return [
      {
        id: `ev-search-unavailable-${slug(query)}`,
        sourceType: "untrusted_search_hit",
        sourceName: "Brave Search API",
        sourceUrl: url,
        retrievedAt: result.retrievedAt,
        summary: "Brave Search API collection failed.",
        details: [result.error],
        reliability: "untrusted_search_hit",
        normalizedJson: { query, provider: "brave", error: result.error },
      },
    ]
  }

  const results = result.data.web?.results ?? []
  return [
    {
      id: `ev-search-${slug(query)}`,
      sourceType: "untrusted_search_hit",
      sourceName: "Brave Search API",
      sourceUrl: result.sourceUrl,
      retrievedAt: result.retrievedAt,
      rawSnapshotRef: result.rawSnapshotRef,
      summary: `Brave Search returned ${results.length} result${results.length === 1 ? "" : "s"}. Fetch and normalize a result before treating it as evidence.`,
      details: results.map((entry) => `${entry.title ?? "Untitled"} - ${entry.url ?? "no url"}`),
      reliability: "untrusted_search_hit",
      normalizedJson: {
        query,
        provider: "brave",
        results: results.map((entry) => ({
          title: entry.title,
          url: entry.url,
          description: entry.description,
          age: entry.age,
          sourceName: entry.profile?.name,
        })),
      },
    },
  ]
}

async function collectTavilySearch(query: string, apiKey: string): Promise<SherlockEvidence[]> {
  const url = "https://api.tavily.com/search"
  const result = await fetchJsonWithTimeout<TavilySearchResponse>(url, {
    method: "POST",
    body: {
      query,
      search_depth: "basic",
      max_results: 5,
      include_answer: false,
      include_raw_content: false,
      include_images: false,
      include_usage: true,
    },
    rateLimitKey: "tavily-search",
    rateLimit: 20,
    allowedHostnames: ["api.tavily.com"],
    headers: { Authorization: `Bearer ${apiKey}` },
  })

  if (!result.ok) {
    return [
      {
        id: `ev-tavily-search-unavailable-${slug(query)}`,
        sourceType: "untrusted_search_hit",
        sourceName: "Tavily Search API",
        sourceUrl: url,
        retrievedAt: result.retrievedAt,
        summary: "Tavily Search API collection failed.",
        details: [result.error],
        reliability: "untrusted_search_hit",
        normalizedJson: { query, provider: "tavily", error: result.error },
      },
    ]
  }

  const results = result.data.results ?? []
  return [
    {
      id: `ev-tavily-search-${slug(query)}`,
      sourceType: "untrusted_search_hit",
      sourceName: "Tavily Search API",
      sourceUrl: result.sourceUrl,
      retrievedAt: result.retrievedAt,
      rawSnapshotRef: result.rawSnapshotRef,
      summary: `Tavily returned ${results.length} result${results.length === 1 ? "" : "s"}. Fetch and normalize a result before treating it as evidence.`,
      details: results.map((entry) => `${entry.title ?? "Untitled"} - ${entry.url ?? "no url"}`),
      reliability: "untrusted_search_hit",
      normalizedJson: {
        query,
        provider: "tavily",
        credits: result.data.usage?.credits,
        requestId: result.data.request_id,
        results: results.map((entry) => ({
          title: entry.title,
          url: entry.url,
          description: entry.content,
          providerRelevance: entry.score,
          favicon: entry.favicon,
        })),
      },
    },
  ]
}

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) || "query"
}
