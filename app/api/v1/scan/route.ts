import { NextRequest, NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { runScan } from '@/lib/runScan'
import { rateLimit, getClientIp } from '@/lib/rateLimit'

export const maxDuration = 30

// Constant-time comparison — hashing both sides first so lengths always match
function isValidKey(provided: string): boolean {
  const secret = process.env.CICD_API_KEY
  if (!secret || !provided) return false
  const a = createHmac('sha256', 'accessly').update(provided).digest()
  const b = createHmac('sha256', 'accessly').update(secret).digest()
  return timingSafeEqual(a, b)
}

export async function POST(req: NextRequest) {
  // --- Auth ---
  const auth  = req.headers.get('authorization') ?? ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : ''
  if (!isValidKey(token)) {
    return NextResponse.json(
      { error: 'Unauthorized — provide a valid Bearer token' },
      {
        status: 401,
        headers: { 'WWW-Authenticate': 'Bearer realm="Accessly API"' },
      },
    )
  }

  // --- Rate limit ---
  // CICD_API_KEY is a single shared secret across all CI/CD integrations,
  // so an attacker who leaked it (e.g. from a public GitHub Actions log)
  // could spam this endpoint. 100 scans per 10 minutes per IP is generous
  // for legitimate CI bursts but stops sustained abuse.
  const ip = getClientIp(req)
  const rl = rateLimit('v1.scan', ip, { limit: 100, windowMs: 10 * 60 * 1000 })
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded — back off and retry shortly.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(rl.retryAfterSec ?? 60),
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(rl.resetAt / 1000)),
        },
      },
    )
  }

  // --- Validate body ---
  let body: Record<string, unknown>
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Request body must be JSON' }, { status: 400 })
  }

  const rawUrl = typeof body.url === 'string' ? body.url.trim() : ''
  if (!rawUrl) return NextResponse.json({ error: '"url" is required' }, { status: 400 })

  const url = /^https?:\/\//i.test(rawUrl) ? rawUrl : 'https://' + rawUrl

  // --- Run scan ---
  try {
    const result = await runScan(url)
    return NextResponse.json({
      url,
      score:      result.score,
      errors:     result.errors,
      warnings:   result.warnings,
      passes:     result.passes,
      violations: result.violations,
      scannedAt:  new Date().toISOString(),
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Scan failed' }, { status: 500 })
  }
}
