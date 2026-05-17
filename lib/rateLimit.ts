/**
 * In-memory rate limiter for serverless functions.
 *
 * Strategy: per-process Map keyed by "bucket:identifier" (e.g.
 * "scan:ip-12.34.56.78"). Each entry tracks a count + reset timestamp.
 * Counts expire automatically — no cleanup cron required.
 *
 * Trade-offs of in-memory vs Upstash/Redis:
 *   PROS
 *   - Zero extra infrastructure / env vars / latency
 *   - Works in any Vercel function tier
 *   - Sufficient for soft abuse prevention (the threat model is "one
 *     bored teenager curling /api/scan in a loop", not a distributed
 *     botnet)
 *   CONS
 *   - State is per-instance: a Vercel cold start resets the map. So
 *     attackers can technically slip a few extra calls through by
 *     triggering deploys. In practice deploys are rare and warm
 *     instances coalesce requests for ~5min.
 *   - State doesn't shard: if Vercel runs N concurrent instances of
 *     the function, each has its own counter. So the *effective*
 *     limit is ~N× the configured cap under sustained traffic. Still
 *     plenty for our threat model.
 *
 * When traffic justifies it (post-launch, after we see real abuse
 * patterns), swap in @upstash/ratelimit + Vercel KV. Same API
 * surface so call sites don't change. For now this keeps the launch
 * surface simple.
 */

interface Bucket {
  count: number
  resetAt: number
}

const store: Map<string, Bucket> = (globalThis as any).__ax_rl ??= new Map<string, Bucket>()

export interface RateLimitConfig {
  /** Max requests allowed per window. */
  limit: number
  /** Window length in milliseconds. */
  windowMs: number
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
  retryAfterSec?: number
}

/**
 * Check + consume a token for `id` in `bucket`. Returns whether the
 * request is allowed and how much budget is left.
 *
 *   const result = rateLimit('scan', ip, { limit: 3, windowMs: 86_400_000 })
 *   if (!result.allowed) return 429
 *
 * IMPORTANT: this mutates state on every call. Don't use it as a
 * "peek" — every call counts as one consumption. To peek, use
 * peekRateLimit() below.
 */
export function rateLimit(
  bucket: string,
  id: string,
  config: RateLimitConfig,
): RateLimitResult {
  const key = `${bucket}:${id}`
  const now = Date.now()
  let entry = store.get(key)

  if (!entry || entry.resetAt <= now) {
    entry = { count: 0, resetAt: now + config.windowMs }
    store.set(key, entry)
  }

  if (entry.count >= config.limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
      retryAfterSec: Math.ceil((entry.resetAt - now) / 1000),
    }
  }

  entry.count += 1
  return {
    allowed: true,
    remaining: config.limit - entry.count,
    resetAt: entry.resetAt,
  }
}

/**
 * Read the current state for `id` in `bucket` without consuming a
 * token. Useful for showing "X requests left" hints in the UI without
 * forcing the user to actually hit the endpoint.
 */
export function peekRateLimit(bucket: string, id: string): RateLimitResult | null {
  const key = `${bucket}:${id}`
  const entry = store.get(key)
  if (!entry || entry.resetAt <= Date.now()) return null
  return {
    allowed: entry.count > 0,
    remaining: Math.max(0, Number.MAX_SAFE_INTEGER), // limit unknown at peek time
    resetAt: entry.resetAt,
  }
}

/**
 * Extract the client IP from a Next.js request. Vercel sets
 * `x-forwarded-for` to a comma-separated list — the leftmost entry
 * is the real client. Falls back to `x-real-ip` and finally to a
 * stable per-deploy fingerprint so an entry is always created.
 *
 * NOTE: Not authoritative. A determined attacker can spoof headers.
 * Good enough for "soft" rate limiting; do not use for security
 * decisions that have to be airtight.
 */
export function getClientIp(req: { headers: Headers }): string {
  const xff = req.headers.get('x-forwarded-for')
  if (xff) {
    const ip = xff.split(',')[0]?.trim()
    if (ip) return ip
  }
  const xri = req.headers.get('x-real-ip')
  if (xri) return xri.trim()
  return 'unknown'
}
