import { afterEach, describe, expect, it, vi } from "vitest"
import { clearCollectorCache, fetchJsonWithTimeout, validateSourceUrl } from "../collector-utils"

describe("Sherlock collector hardening utilities", () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    clearCollectorCache()
  })

  it("blocks localhost, private IPs, credentials, and suspicious ports", async () => {
    await expect(validateSourceUrl("http://localhost:3000")).resolves.toMatchObject({ ok: false, blocked: true })
    await expect(validateSourceUrl("http://169.254.169.254/latest/meta-data")).resolves.toMatchObject({ ok: false, blocked: true })
    await expect(validateSourceUrl("https://user:pass@example.com")).resolves.toMatchObject({ ok: false, blocked: true })
    await expect(validateSourceUrl("https://example.com:6379", { resolveDns: false })).resolves.toMatchObject({ ok: false, blocked: true })
  })

  it("enforces collector host allowlists", async () => {
    await expect(
      validateSourceUrl("https://api.search.brave.com/res/v1/web/search?q=test", {
        allowedHostnames: ["api.search.brave.com"],
        resolveDns: false,
      }),
    ).resolves.toMatchObject({ ok: true })

    await expect(
      validateSourceUrl("https://example.com/res/v1/web/search?q=test", {
        allowedHostnames: ["api.search.brave.com"],
        resolveDns: false,
      }),
    ).resolves.toMatchObject({ ok: false, blocked: true })
  })

  it("caches successful JSON collector responses by normalized URL", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }))
    vi.stubGlobal("fetch", fetchMock)

    const first = await fetchJsonWithTimeout<{ ok: boolean }>("https://example.com/data.json", {
      resolveDns: false,
      cacheTtlMs: 60_000,
    })
    const second = await fetchJsonWithTimeout<{ ok: boolean }>("https://example.com/data.json", {
      resolveDns: false,
      cacheTtlMs: 60_000,
    })

    expect(first).toMatchObject({ ok: true, cacheStatus: "miss" })
    expect(second).toMatchObject({ ok: true, cacheStatus: "hit" })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
