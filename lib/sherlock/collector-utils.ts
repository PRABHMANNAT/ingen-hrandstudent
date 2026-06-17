import { createHash } from "node:crypto"
import { lookup } from "node:dns/promises"
import { isIP } from "node:net"

export type CollectorFetchResult<T> =
  | { ok: true; data: T; retrievedAt: string; rawSnapshotRef: string; sourceUrl: string; cacheStatus: "hit" | "miss" }
  | { ok: false; error: string; retrievedAt: string; sourceUrl: string; status?: number; rateLimited?: boolean; blocked?: boolean }

export type SourceUrlValidation =
  | { ok: true; url: URL; normalizedUrl: string; resolvedAddresses: string[] }
  | { ok: false; error: string; normalizedUrl?: string; blocked: true }

const DEFAULT_TIMEOUT_MS = 4500
const DEFAULT_CACHE_TTL_MS = 5 * 60_000
const MAX_JSON_BYTES = 500_000
const WINDOW_MS = 60_000
const bucket = new Map<string, { count: number; resetAt: number }>()
const responseCache = new Map<string, { expiresAt: number; result: CollectorFetchResult<unknown> }>()

const BLOCKED_HOSTNAMES = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1", "[::1]"])
const BLOCKED_HOST_SUFFIXES = [".local", ".internal", ".localhost", ".localdomain", ".lan", ".home"]
const SUSPICIOUS_PORTS = new Set([22, 23, 25, 110, 143, 445, 3306, 5432, 6379, 9200, 11211, 27017])
const SECRET_KEY_PATTERN = /(authorization|cookie|token|secret|api[-_]?key|password|subscription)/i

export function checkCollectorRateLimit(key: string, limit = 12): { ok: true } | { ok: false; retryAfterMs: number } {
  const now = Date.now()
  const current = bucket.get(key)
  if (!current || current.resetAt <= now) {
    bucket.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return { ok: true }
  }
  if (current.count >= limit) {
    return { ok: false, retryAfterMs: current.resetAt - now }
  }
  current.count += 1
  return { ok: true }
}

export async function fetchJsonWithTimeout<T>(
  url: string,
  options: {
    timeoutMs?: number
    headers?: HeadersInit
    method?: "GET" | "POST"
    body?: unknown
    rateLimitKey?: string
    rateLimit?: number
    cacheTtlMs?: number
    allowedHostnames?: string[]
    resolveDns?: boolean
  } = {},
): Promise<CollectorFetchResult<T>> {
  const retrievedAt = new Date().toISOString()
  const validation = await validateSourceUrl(url, {
    allowedHostnames: options.allowedHostnames,
    resolveDns: options.resolveDns,
  })
  if (!validation.ok) {
    logCollectorEvent("warn", "collector_url_blocked", { url, error: validation.error })
    return {
      ok: false,
      error: validation.error,
      retrievedAt,
      sourceUrl: validation.normalizedUrl ?? url,
      blocked: true,
    }
  }

  const normalizedUrl = validation.normalizedUrl
  const rateLimitKey = options.rateLimitKey ?? validation.url.hostname
  const allowed = checkCollectorRateLimit(rateLimitKey, options.rateLimit ?? 12)
  if (!allowed.ok) {
    logCollectorEvent("warn", "collector_rate_limited", { rateLimitKey, retryAfterMs: allowed.retryAfterMs })
    return {
      ok: false,
      error: `Rate limited. Retry after ${Math.ceil(allowed.retryAfterMs / 1000)}s.`,
      retrievedAt,
      sourceUrl: normalizedUrl,
      rateLimited: true,
    }
  }

  const method = options.method ?? "GET"
  const serializedBody = options.body === undefined ? undefined : JSON.stringify(options.body)
  const cacheKey = `json:${method}:${normalizedUrl}:${serializedBody ? snapshotRef(serializedBody) : ""}`
  const cached = readCache<T>(cacheKey)
  if (cached) {
    logCollectorEvent("info", "collector_cache_hit", { sourceHost: validation.url.hostname, rateLimitKey })
    return { ...cached, retrievedAt, cacheStatus: "hit" }
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? DEFAULT_TIMEOUT_MS)

  try {
    logCollectorEvent("info", "collector_fetch_start", {
      sourceHost: validation.url.hostname,
      timeoutMs: options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
      cacheTtlMs: options.cacheTtlMs ?? DEFAULT_CACHE_TTL_MS,
    })

    const response = await fetch(normalizedUrl, {
      method,
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        ...(serializedBody ? { "Content-Type": "application/json" } : {}),
        "User-Agent": "Sherlock-Evidence-Collector/1.0",
        ...options.headers,
      },
      body: serializedBody,
    })
    const text = await response.text()
    clearTimeout(timeout)

    if (text.length > MAX_JSON_BYTES) {
      logCollectorEvent("warn", "collector_response_too_large", { sourceHost: validation.url.hostname, bytes: text.length })
      return {
        ok: false,
        error: "Response too large",
        retrievedAt,
        sourceUrl: response.url || normalizedUrl,
        status: response.status,
      }
    }

    const finalValidation = await validateSourceUrl(response.url || normalizedUrl, {
      allowedHostnames: options.allowedHostnames,
      resolveDns: options.resolveDns,
    })
    if (!finalValidation.ok) {
      logCollectorEvent("warn", "collector_redirect_blocked", { url: response.url, error: finalValidation.error })
      return {
        ok: false,
        error: `Redirect blocked: ${finalValidation.error}`,
        retrievedAt,
        sourceUrl: response.url || normalizedUrl,
        blocked: true,
      }
    }

    if (!response.ok) {
      logCollectorEvent("warn", "collector_fetch_http_error", { sourceHost: validation.url.hostname, status: response.status })
      return {
        ok: false,
        error: `HTTP ${response.status}`,
        retrievedAt,
        sourceUrl: response.url || normalizedUrl,
        status: response.status,
        rateLimited: response.status === 429,
      }
    }

    const data = JSON.parse(text) as T
    const result: CollectorFetchResult<T> = {
      ok: true,
      data,
      retrievedAt,
      sourceUrl: response.url || normalizedUrl,
      rawSnapshotRef: snapshotRef(text),
      cacheStatus: "miss",
    }
    writeCache(cacheKey, result, options.cacheTtlMs ?? DEFAULT_CACHE_TTL_MS)
    logCollectorEvent("info", "collector_fetch_complete", {
      sourceHost: validation.url.hostname,
      bytes: text.length,
      rawSnapshotRef: result.rawSnapshotRef,
    })
    return result
  } catch (error) {
    clearTimeout(timeout)
    const message = error instanceof Error ? (error.name === "AbortError" ? "Request timeout" : error.message) : "Unknown fetch error"
    logCollectorEvent("error", "collector_fetch_failed", { sourceHost: validation.url.hostname, error: message })
    return {
      ok: false,
      error: message,
      retrievedAt,
      sourceUrl: normalizedUrl,
    }
  }
}

export function snapshotRef(value: unknown) {
  const serialized = typeof value === "string" ? value : JSON.stringify(value)
  return `sha256:${createHash("sha256").update(serialized).digest("hex")}`
}

export function normalizeUrl(value: string): string | null {
  try {
    const url = new URL(value.startsWith("http") ? value : `https://${value}`)
    if (!["http:", "https:"].includes(url.protocol)) return null
    if (url.username || url.password) return null
    if (isPrivateHostname(url.hostname)) return null
    if (isSuspiciousPort(url)) return null
    return url.toString()
  } catch {
    return null
  }
}

export function isLinkedInUrl(value: string) {
  try {
    const url = new URL(value.startsWith("http") ? value : `https://${value}`)
    return url.hostname.toLowerCase().includes("linkedin.com")
  } catch {
    return value.toLowerCase().includes("linkedin.com")
  }
}

export async function validateSourceUrl(
  value: string,
  options: {
    allowedHostnames?: string[]
    resolveDns?: boolean
  } = {},
): Promise<SourceUrlValidation> {
  if (!value || typeof value !== "string") {
    return { ok: false, error: "Empty URL", blocked: true }
  }

  let url: URL
  try {
    url = new URL(value.startsWith("http") ? value : `https://${value}`)
  } catch {
    return { ok: false, error: "Invalid URL format", blocked: true }
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    return { ok: false, error: "Only HTTP/HTTPS URLs are allowed", normalizedUrl: url.toString(), blocked: true }
  }
  if (url.username || url.password) {
    return { ok: false, error: "URLs with credentials are not allowed", normalizedUrl: url.toString(), blocked: true }
  }
  if (isPrivateHostname(url.hostname)) {
    return { ok: false, error: "Private or internal host blocked by SSRF policy", normalizedUrl: url.toString(), blocked: true }
  }
  if (isSuspiciousPort(url)) {
    return { ok: false, error: "Suspicious network port blocked by SSRF policy", normalizedUrl: url.toString(), blocked: true }
  }

  if (options.allowedHostnames?.length) {
    const hostname = url.hostname.toLowerCase()
    const allowed = options.allowedHostnames.some((allowedHost) => hostname === allowedHost || hostname.endsWith(`.${allowedHost}`))
    if (!allowed) {
      return { ok: false, error: "Host is not on this collector allowlist", normalizedUrl: url.toString(), blocked: true }
    }
  }

  const resolvedAddresses = await resolvePublicAddresses(url.hostname, options.resolveDns !== false)
  if (!resolvedAddresses.ok) {
    return { ok: false, error: resolvedAddresses.error, normalizedUrl: url.toString(), blocked: true }
  }

  return { ok: true, url, normalizedUrl: url.toString(), resolvedAddresses: resolvedAddresses.addresses }
}

export function logCollectorEvent(level: "info" | "warn" | "error", event: string, details: Record<string, unknown> = {}) {
  const payload = redactLogValue({
    ts: new Date().toISOString(),
    level,
    subsystem: "sherlock",
    event,
    ...details,
  })
  const line = JSON.stringify(payload)
  if (level === "error") {
    console.error(line)
  } else if (level === "warn") {
    console.warn(line)
  } else {
    console.info(line)
  }
}

export function clearCollectorCache() {
  responseCache.clear()
}

export function collectorCacheStats() {
  const now = Date.now()
  let active = 0
  for (const entry of responseCache.values()) {
    if (entry.expiresAt > now) active += 1
  }
  return { active, total: responseCache.size }
}

function readCache<T>(key: string): CollectorFetchResult<T> | null {
  const cached = responseCache.get(key)
  if (!cached) return null
  if (cached.expiresAt <= Date.now()) {
    responseCache.delete(key)
    return null
  }
  return cached.result as CollectorFetchResult<T>
}

function writeCache<T>(key: string, result: CollectorFetchResult<T>, ttlMs: number) {
  responseCache.set(key, { expiresAt: Date.now() + ttlMs, result: result as CollectorFetchResult<unknown> })
}

function isPrivateHostname(hostname: string) {
  const lower = hostname.toLowerCase()
  if (BLOCKED_HOSTNAMES.has(lower)) return true
  if (BLOCKED_HOST_SUFFIXES.some((suffix) => lower.endsWith(suffix))) return true
  if (isIP(lower)) return isPrivateIp(lower)
  return false
}

function isSuspiciousPort(url: URL) {
  if (!url.port) return false
  return SUSPICIOUS_PORTS.has(Number.parseInt(url.port, 10))
}

async function resolvePublicAddresses(hostname: string, shouldResolve: boolean): Promise<{ ok: true; addresses: string[] } | { ok: false; error: string }> {
  if (!shouldResolve) return { ok: true, addresses: [] }
  if (isIP(hostname)) return isPrivateIp(hostname) ? { ok: false, error: "Private IP blocked by SSRF policy" } : { ok: true, addresses: [hostname] }

  try {
    const records = await lookup(hostname, { all: true, verbatim: true })
    const addresses = records.map((record) => record.address)
    if (!addresses.length) return { ok: false, error: "Host did not resolve" }
    if (addresses.some(isPrivateIp)) return { ok: false, error: "Host resolves to a private network address" }
    return { ok: true, addresses }
  } catch {
    return { ok: false, error: "Host DNS resolution failed" }
  }
}

function isPrivateIp(address: string) {
  const normalized = address.toLowerCase()
  if (normalized === "::1" || normalized === "0:0:0:0:0:0:0:1") return true
  if (normalized.startsWith("fc") || normalized.startsWith("fd") || normalized.startsWith("fe80:")) return true
  if (normalized.startsWith("::ffff:")) return isPrivateIp(normalized.replace("::ffff:", ""))

  const parts = normalized.split(".").map((part) => Number.parseInt(part, 10))
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) return false
  const [a, b] = parts
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19))
  )
}

function redactLogValue(value: unknown): unknown {
  if (typeof value === "string") return value.replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, "Bearer [REDACTED]")
  if (!value || typeof value !== "object") return value
  if (Array.isArray(value)) return value.map(redactLogValue)
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
      key,
      SECRET_KEY_PATTERN.test(key) ? "[REDACTED]" : redactLogValue(entry),
    ]),
  )
}
