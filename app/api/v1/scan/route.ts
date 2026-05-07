import { NextRequest, NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { runScan } from '@/lib/runScan'

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
