import { NextRequest, NextResponse } from 'next/server'
import { runScan } from '@/lib/runScan'
import { createClient } from '@/lib/supabase/server'

export const maxDuration = 60

function isValidHttpUrl(input: string): boolean {
  try {
    const u = new URL(input)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

function classifyScanError(msg: string, status?: number) {
  const lower = msg.toLowerCase()
  if (
    lower.includes('browser binary') ||
    lower.includes('executablepath') ||
    lower.includes('chromium') ||
    lower.includes('failed to launch') ||
    lower.includes('browserless')
  ) {
    return { status: 503, error: 'Our scanner is temporarily unavailable. Please try again in a moment.' }
  }
  if (lower.includes('timeout') || lower.includes('timed out') || lower.includes('navigation timeout')) {
    return { status: 504, error: 'This website took too long to load. Try again or scan a faster page.' }
  }
  if (
    lower.includes('net::err_name_not_resolved') ||
    lower.includes('getaddrinfo') ||
    lower.includes('enotfound')
  ) {
    return { status: 400, error: "We couldn't find that website. Check the URL and try again." }
  }
  if (
    lower.includes('net::err_connection_refused') ||
    lower.includes('econnrefused') ||
    lower.includes('net::err_connection_closed') ||
    lower.includes('net::err_aborted')
  ) {
    return { status: 502, error: "The website refused the connection. It may be down or blocking automated tools." }
  }
  if (lower.includes('net::err_cert') || lower.includes('ssl')) {
    return { status: 400, error: "The website has an invalid SSL certificate. We can't safely scan it." }
  }
  if (
    lower.includes('403') ||
    lower.includes('forbidden') ||
    lower.includes('blocked')
  ) {
    return { status: 403, error: 'This website is blocking automated scanners. Some sites require allow-listing for scanning.' }
  }
  if (lower.includes('404') || lower.includes('not found')) {
    return { status: 404, error: 'That page returned 404. Double-check the URL.' }
  }
  return { status: status ?? 500, error: "We couldn't scan that website. It may not be supported." }
}

export async function POST(req: NextRequest) {
  const { url } = await req.json()
  if (!url) return NextResponse.json({ error: 'URL is required' }, { status: 400 })

  if (!isValidHttpUrl(url)) {
    return NextResponse.json(
      { error: 'Please enter a valid http:// or https:// URL.' },
      { status: 400 }
    )
  }

  try {
    const result = await runScan(url)

    // Persist for authenticated users (non-fatal if it fails)
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { error } = await supabase.from('scans').insert({
          user_id: user.id, url,
          score:      result.score,
          errors:     result.errors,
          warnings:   result.warnings,
          passes:     result.passes,
          violations: result.violations,
        })
        if (error) console.error('[scan] failed to persist:', error.message)
      }
    } catch (err) {
      console.error('[scan] persist threw:', err)
    }

    return NextResponse.json(result)
  } catch (err: any) {
    const msg = String(err?.message ?? 'Scan failed')
    console.error('[scan] error:', msg)
    const { status, error } = classifyScanError(msg)
    return NextResponse.json({ error }, { status })
  }
}
