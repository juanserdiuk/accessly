import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

interface ResultItem {
  type: 'scan' | 'site' | 'portfolio' | 'page'
  title: string
  subtitle?: string
  href: string
}

const STATIC_PAGES: ResultItem[] = [
  { type: 'page', title: 'Dashboard',        href: '/dashboard' },
  { type: 'page', title: 'Scans',            href: '/dashboard/scans' },
  { type: 'page', title: 'Reports',          href: '/dashboard/reports' },
  { type: 'page', title: 'Monitor',          href: '/dashboard/monitor' },
  { type: 'page', title: 'Portfolios',       href: '/dashboard/portfolios' },
  { type: 'page', title: 'Scheduled scans',  href: '/dashboard/scheduled' },
  { type: 'page', title: 'Team',             href: '/dashboard/team' },
  { type: 'page', title: 'Settings',         href: '/dashboard/settings' },
]

function hostname(url: string) {
  try { return new URL(url).hostname } catch { return url }
}

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get('q') ?? '').trim()
  if (!q) return NextResponse.json({ results: [] })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const pattern = `%${q.replace(/[%_]/g, '\\$&')}%`

  // Search scans, sites, portfolios in parallel
  const [scansRes, sitesRes, portfoliosRes] = await Promise.all([
    supabase
      .from('scans')
      .select('id, url, score, created_at')
      .eq('user_id', user.id)
      .ilike('url', pattern)
      .order('created_at', { ascending: false })
      .limit(8),
    supabase
      .from('sites')
      .select('id, url, created_at')
      .eq('user_id', user.id)
      .ilike('url', pattern)
      .order('created_at', { ascending: false })
      .limit(8),
    supabase
      .from('portfolios')
      .select('id, name, color')
      .eq('user_id', user.id)
      .ilike('name', pattern)
      .order('created_at', { ascending: false })
      .limit(8),
  ])

  const results: ResultItem[] = []

  // Static pages first (matches navigation labels)
  const ql = q.toLowerCase()
  for (const p of STATIC_PAGES) {
    if (p.title.toLowerCase().includes(ql)) results.push(p)
  }

  for (const p of portfoliosRes.data ?? []) {
    results.push({
      type: 'portfolio',
      title: p.name,
      subtitle: 'Portfolio',
      href: `/dashboard/portfolios/${p.id}`,
    })
  }

  for (const s of sitesRes.data ?? []) {
    results.push({
      type: 'site',
      title: hostname(s.url),
      subtitle: s.url,
      href: '/dashboard/monitor',
    })
  }

  for (const s of scansRes.data ?? []) {
    results.push({
      type: 'scan',
      title: hostname(s.url),
      subtitle: `Score ${s.score} · ${new Date(s.created_at).toLocaleDateString()}`,
      href: `/dashboard/scans/${s.id}`,
    })
  }

  return NextResponse.json({ results: results.slice(0, 20) })
}
