import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * Activity feed for the Topbar notifications bell — recent scans + any
 * actionable hints (low scan credits on PPS, free-tier limit approached, etc).
 *
 * Returns at most 8 items, freshest first. Public to authed users only.
 */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const [profileRes, scansRes] = await Promise.all([
    supabase.from('profiles').select('plan, scan_count').eq('id', user.id).single(),
    supabase
      .from('scans')
      .select('id, url, score, errors, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(6),
  ])

  const plan = (profileRes.data?.plan ?? 'free') as string
  const credits = profileRes.data?.scan_count ?? 0
  const scans = scansRes.data ?? []

  type Item = {
    kind: 'scan' | 'hint'
    title: string
    sub: string
    href: string
    impact?: 'good' | 'bad' | 'info'
    when: string
  }

  const items: Item[] = []

  // Hint at the top if the customer is approaching a meaningful limit
  if (plan === 'pps' && credits <= 3 && credits > 0) {
    items.push({
      kind: 'hint',
      title: `Only ${credits} scan credit${credits === 1 ? '' : 's'} left`,
      sub: 'Top up your pay-per-scan balance before you run out.',
      href: '/upgrade',
      impact: 'bad',
      when: new Date().toISOString(),
    })
  }
  if (plan === 'pps' && credits === 0) {
    items.push({
      kind: 'hint',
      title: 'No scan credits left',
      sub: 'Buy a pack to keep scanning.',
      href: '/upgrade',
      impact: 'bad',
      when: new Date().toISOString(),
    })
  }
  if (plan === 'free' && scans.length >= 2) {
    items.push({
      kind: 'hint',
      title: `${scans.length} of 3 free scans used`,
      sub: 'Upgrade to keep scanning unlimited.',
      href: '/upgrade',
      impact: 'info',
      when: new Date().toISOString(),
    })
  }

  for (const s of scans) {
    let hostname = s.url
    try { hostname = new URL(s.url).hostname } catch { /* keep raw */ }
    const impact: Item['impact'] = s.score >= 80 ? 'good' : s.score >= 60 ? 'info' : 'bad'
    items.push({
      kind: 'scan',
      title: `${hostname} scored ${s.score}`,
      sub: s.errors > 0
        ? `${s.errors} accessibility ${s.errors === 1 ? 'error' : 'errors'} found`
        : 'No accessibility errors — nice.',
      href: `/dashboard/scans/${s.id}`,
      impact,
      when: s.created_at,
    })
  }

  return NextResponse.json({ items: items.slice(0, 8) })
}
