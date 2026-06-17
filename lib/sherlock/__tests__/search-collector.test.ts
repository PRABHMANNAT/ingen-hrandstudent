import { afterEach, describe, expect, it, vi } from "vitest"
import { clearCollectorCache } from "../collector-utils"
import { assertSherlockEvidenceOnlyOutput } from "../guardrails"

describe("Sherlock search collector", () => {
  const originalBrave = process.env.BRAVE_SEARCH_API_KEY
  const originalTavily = process.env.TAVILY_API_KEY

  afterEach(() => {
    process.env.BRAVE_SEARCH_API_KEY = originalBrave
    process.env.TAVILY_API_KEY = originalTavily
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    clearCollectorCache()
  })

  it("uses Tavily when Brave is not configured", async () => {
    process.env.BRAVE_SEARCH_API_KEY = ""
    process.env.TAVILY_API_KEY = "tvly-test"
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          query: "Jane Doe GitHub",
          results: [{ title: "Jane Doe portfolio", url: "https://example.com", content: "Portfolio summary", score: 0.7 }],
          usage: { credits: 1 },
          request_id: "req-test",
        }),
        { status: 200 },
      ),
    )
    vi.stubGlobal("fetch", fetchMock)

    const { collectSearch } = await import("../collectors/search")
    const evidence = await collectSearch("Jane Doe GitHub")

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.tavily.com/search",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer tvly-test" }),
      }),
    )
    expect(evidence[0]).toMatchObject({
      sourceName: "Tavily Search API",
      reliability: "untrusted_search_hit",
      normalizedJson: expect.objectContaining({ provider: "tavily", credits: 1 }),
    })
    expect(assertSherlockEvidenceOnlyOutput(evidence)).toEqual({ ok: true })
  })
})
