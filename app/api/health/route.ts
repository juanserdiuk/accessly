import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Health check endpoint for external monitors (UptimeRobot, BetterStack,
 * Vercel monitor, etc) and the smoke-test script. Doesn't require auth
 * — returns the minimum information needed to confirm:
 *
 *   - Next.js function execution is healthy
 *   - Supabase admin connection works (SELECT 1 against a known table)
 *   - The required env vars are present (boolean-only, never the values)
 *
 * We do NOT check Stripe / Resend / Browserless connectivity here
 * because:
 *   (a) hitting them costs money (Stripe API quota, Browserless minutes)
 *   (b) a Stripe outage shouldn't make our health check page yellow
 *   (c) those have their own status pages
 *
 * Output shape:
 *   { status: "ok" | "degraded" | "down",
 *     checks: { name: string, ok: boolean, ms?: number, error?: string }[],
 *     env: { hasSupabase: true, hasStripe: true, ... },
 *     timestamp: ISO string }
 */
export async function GET() {
  const checks: Array<{ name: string; ok: boolean; ms?: number; error?: string }> = []

  // Supabase connectivity — cheap SELECT against `profiles` head-only
  // (count, no rows returned). Verifies both env vars + network.
  const t0 = Date.now()
  try {
    const admin = createAdminClient()
    const { error } = await admin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .limit(1)
    if (error) {
      checks.push({ name: 'supabase', ok: false, ms: Date.now() - t0, error: error.message })
    } else {
      checks.push({ name: 'supabase', ok: true, ms: Date.now() - t0 })
    }
  } catch (err: any) {
    checks.push({ name: 'supabase', ok: false, ms: Date.now() - t0, error: err?.message ?? 'unknown' })
  }

  // Browserless reachability — TCP-only ping to confirm the API key
  // resolves + the service is reachable. We don't open a browser
  // session (that would cost a real scan minute); just verify the
  // base host returns SOMETHING under 3s. Skipped if no key — the
  // env presence check below will flag that case separately.
  if (process.env.BROWSERLESS_API_KEY) {
    const tB = Date.now()
    try {
      const ctrl = new AbortController()
      const timer = setTimeout(() => ctrl.abort(), 3000)
      const res = await fetch(`https://production-sfo.browserless.io/?token=${process.env.BROWSERLESS_API_KEY}`, {
        method: 'GET',
        signal: ctrl.signal,
      })
      clearTimeout(timer)
      // Any non-5xx response means the key was recognised + service is
      // up; 200/204/etc all qualify. 401/403 means the key is wrong
      // (still a config problem to flag).
      if (res.status >= 500) {
        checks.push({ name: 'browserless', ok: false, ms: Date.now() - tB, error: `HTTP ${res.status}` })
      } else if (res.status === 401 || res.status === 403) {
        checks.push({ name: 'browserless', ok: false, ms: Date.now() - tB, error: `Auth failed (HTTP ${res.status}) — check BROWSERLESS_API_KEY` })
      } else {
        checks.push({ name: 'browserless', ok: true, ms: Date.now() - tB })
      }
    } catch (err: any) {
      checks.push({ name: 'browserless', ok: false, ms: Date.now() - tB, error: err?.name === 'AbortError' ? 'timeout (3s)' : (err?.message ?? 'unknown') })
    }
  } else {
    checks.push({ name: 'browserless', ok: false, error: 'BROWSERLESS_API_KEY not set' })
  }

  // Required-env-var presence. Values never returned — booleans only.
  const env = {
    hasSupabase: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
    hasStripe:   Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET),
    hasResend:   Boolean(process.env.RESEND_API_KEY),
    hasEmailFrom: Boolean(process.env.EMAIL_FROM),
    hasAdmin:    Boolean(process.env.ADMIN_EMAIL),
    hasCronSecret: Boolean(process.env.CRON_SECRET),
    hasBrowserless: Boolean(process.env.BROWSERLESS_API_KEY),
    hasSiteUrl:  Boolean(process.env.NEXT_PUBLIC_SITE_URL),
  }
  checks.push({ name: 'env', ok: Object.values(env).every(Boolean) })

  const allOk = checks.every(c => c.ok)
  const someOk = checks.some(c => c.ok)
  const status: 'ok' | 'degraded' | 'down' = allOk ? 'ok' : (someOk ? 'degraded' : 'down')

  return NextResponse.json(
    {
      status,
      checks,
      env,
      timestamp: new Date().toISOString(),
    },
    {
      // Always 200 — the JSON body carries the diagnostic. This lets
      // monitors alarm on body content (e.g. status != "ok") rather than
      // status code, and prevents accidental 5xx noise from breaking
      // health-page widgets.
      status: 200,
      headers: {
        'Cache-Control': 'no-store',
      },
    },
  )
}
