import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Public "Audited by Accessly" SVG badge for a real scan.
 *
 *   GET /api/badge/<scanId>      → SVG badge with the live score
 *   GET /api/badge/<scanId>?style=compact   → shields.io-style compact badge
 *
 * Embedding the badge anchors customers' marketing pages to a real Accessly
 * scan record (free top-of-funnel marketing for us, social proof for them).
 *
 * Cached aggressively at the edge — score only changes when a new scan runs.
 */
export const dynamic = 'force-dynamic'

function scoreColor(score: number): { fg: string; gradient: [string, string] } {
  if (score >= 80) return { fg: '#15803d', gradient: ['#10b981', '#059669'] }   // emerald
  if (score >= 60) return { fg: '#a16207', gradient: ['#f59e0b', '#d97706'] }   // amber
  return                  { fg: '#b91c1c', gradient: ['#ef4444', '#dc2626'] }   // red
}

function renderFull(score: number, hostname: string, scanId: string): string {
  const c = scoreColor(score)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="72" viewBox="0 0 220 72" role="img" aria-label="WCAG accessibility score ${score} out of 100, audited by Accessly">
  <title>Audited by Accessly — ${hostname} scored ${score}/100 on WCAG 2.2</title>
  <defs>
    <linearGradient id="g${scanId}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${c.gradient[0]}"/>
      <stop offset="100%" stop-color="${c.gradient[1]}"/>
    </linearGradient>
  </defs>
  <rect width="220" height="72" rx="12" fill="#0f172a"/>
  <rect x="1" y="1" width="218" height="70" rx="11" fill="none" stroke="#1e293b" stroke-width="1"/>
  <g transform="translate(16,16)">
    <rect width="40" height="40" rx="10" fill="url(#g${scanId})"/>
    <text x="20" y="27" text-anchor="middle" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif" font-size="16" font-weight="700" fill="#ffffff">${score}</text>
  </g>
  <g transform="translate(68,20)" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
    <text x="0" y="12" font-size="9" font-weight="700" fill="#94a3b8" letter-spacing="1.2">WCAG 2.2 AUDITED</text>
    <text x="0" y="28" font-size="13" font-weight="600" fill="#ffffff">Accessibility ${score}/100</text>
    <text x="0" y="42" font-size="9" font-weight="500" fill="#64748b">verified by accessly.us</text>
  </g>
</svg>`
}

function renderCompact(score: number): string {
  const c = scoreColor(score)
  const label = 'WCAG audited'
  const labelWidth = 88
  const valueText = `${score}/100`
  const valueWidth = 56
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${labelWidth + valueWidth}" height="20" role="img" aria-label="WCAG accessibility score ${score} out of 100, audited by Accessly">
  <title>Audited by Accessly: ${valueText}</title>
  <linearGradient id="b" x2="0" y2="100%"><stop offset="0" stop-color="#bbb" stop-opacity=".1"/><stop offset="1" stop-opacity=".1"/></linearGradient>
  <clipPath id="c"><rect width="${labelWidth + valueWidth}" height="20" rx="3"/></clipPath>
  <g clip-path="url(#c)">
    <rect width="${labelWidth}" height="20" fill="#0f172a"/>
    <rect x="${labelWidth}" width="${valueWidth}" height="20" fill="${c.gradient[0]}"/>
    <rect width="${labelWidth + valueWidth}" height="20" fill="url(#b)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif" font-size="11" font-weight="600">
    <text x="${labelWidth / 2}" y="14">${label}</text>
    <text x="${labelWidth + valueWidth / 2}" y="14">${valueText}</text>
  </g>
</svg>`
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ scanId: string }> }) {
  const { scanId } = await ctx.params
  const url = new URL(_req.url)
  const style = url.searchParams.get('style') === 'compact' ? 'compact' : 'full'

  // Allow scanId to be either a UUID for a real scan, or "preview" for marketing
  let score = 0
  let hostname = 'example.com'

  if (scanId === 'preview') {
    score = 92
    hostname = 'your-site.com'
  } else {
    try {
      const admin = createAdminClient()
      const { data } = await admin
        .from('scans')
        .select('score, url')
        .eq('id', scanId)
        .single()
      if (data) {
        score = data.score
        try { hostname = new URL(data.url).hostname } catch { hostname = data.url }
      }
    } catch {
      // fall through to defaults
    }
  }

  const svg = style === 'compact' ? renderCompact(score) : renderFull(score, hostname, scanId.replace(/[^a-z0-9]/gi, ''))

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      // Cache for 1 hour at the edge, allow stale for a day while revalidating.
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
