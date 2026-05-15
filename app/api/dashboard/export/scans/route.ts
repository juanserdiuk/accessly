import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * CSV export of all the signed-in user's scans. Streamed back with a
 * Content-Disposition: attachment so the Topbar Export button can trigger
 * a real browser download.
 */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { data: scans } = await supabase
    .from('scans')
    .select('id, url, score, errors, warnings, passes, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const rows = scans ?? []

  // Build CSV — quote fields that might contain commas/quotes/newlines.
  function csvCell(v: unknown): string {
    if (v == null) return ''
    const s = String(v)
    if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
    return s
  }

  const header = ['Scan ID', 'URL', 'Score', 'Errors', 'Warnings', 'Passes', 'Scanned at (UTC)']
  const lines = [header.map(csvCell).join(',')]
  for (const r of rows) {
    lines.push([
      r.id,
      r.url,
      r.score,
      r.errors,
      r.warnings,
      r.passes,
      r.created_at,
    ].map(csvCell).join(','))
  }
  // CSV spec wants CRLF row separators
  const csv = lines.join('\r\n') + '\r\n'

  const today = new Date().toISOString().slice(0, 10)
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="accessly-scans-${today}.csv"`,
      'Cache-Control': 'no-store',
    },
  })
}
