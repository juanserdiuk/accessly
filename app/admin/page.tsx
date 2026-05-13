import { createAdminClient } from '@/lib/supabase/admin'

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(mins / 60)
  const days = Math.floor(hours / 24)
  if (mins < 5) return 'Just now'
  if (hours < 1) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days === 1) return 'Yesterday'
  return `${days}d ago`
}

function hostname(url: string) {
  try { return new URL(url).hostname } catch { return url }
}

function scoreColor(score: number) {
  if (score >= 80) return 'text-green-600'
  if (score >= 60) return 'text-amber-500'
  return 'text-red-500'
}

const planBadge: Record<string, string> = {
  free:   'bg-slate-100 text-slate-500',
  pro:    'bg-violet-100 text-violet-700',
  agency: 'bg-amber-100 text-amber-700',
}

function flag(country: string | null) {
  if (!country || country.length !== 2) return ''
  return String.fromCodePoint(...country.toUpperCase().split('').map(c => 127397 + c.charCodeAt(0)))
}

export default async function AdminPage() {
  const supabase = createAdminClient()

  const [
    totalScansRes,
    proCountRes,
    agencyCountRes,
    scansThisMonthRes,
    recentScansRes,
    allProfilesRes,
    usersRes,
  ] = await Promise.all([
    supabase.from('scans').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('plan', 'pro'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('plan', 'agency'),
    supabase.from('scans').select('*', { count: 'exact', head: true })
      .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
    supabase.from('scans')
      .select('id, url, score, errors, warnings, user_id, created_at')
      .order('created_at', { ascending: false })
      .limit(10),
    // Pull stripe_customer_id + geo so admin can see who's paying and where.
    supabase.from('profiles').select('id, plan, stripe_customer_id, country, city'),
    supabase.auth.admin.listUsers({ page: 1, perPage: 1000 }),
  ])

  const allUsers = usersRes.data?.users ?? []
  const totalUsers = allUsers.length
  const totalScans = totalScansRes.count ?? 0
  const proCount = proCountRes.count ?? 0
  const agencyCount = agencyCountRes.count ?? 0
  const subCount = proCount + agencyCount
  const mrr = proCount * 29 + agencyCount * 99
  const scansThisMonth = scansThisMonthRes.count ?? 0

  // Anyone with a Stripe customer id has paid us at least once — subscriber
  // OR one-time pack buyer. That's the right denominator for conversion.
  const profiles = allProfilesRes.data ?? []
  const paidCount = profiles.filter(p => !!p.stripe_customer_id).length
  const packOnlyCount = Math.max(0, paidCount - subCount)

  // Build lookup maps
  const planMap: Record<string, string> = Object.fromEntries(
    profiles.map(p => [p.id, p.plan])
  )
  const geoMap: Record<string, { country: string | null; city: string | null }> = Object.fromEntries(
    profiles.map(p => [p.id, { country: p.country ?? null, city: p.city ?? null }])
  )
  const userEmailMap: Record<string, string> = Object.fromEntries(
    allUsers.map(u => [u.id, u.email ?? '—'])
  )

  // Country distribution for the geography card
  const countryCounts: Record<string, number> = {}
  for (const p of profiles) {
    if (p.country) countryCounts[p.country] = (countryCounts[p.country] ?? 0) + 1
  }
  const topCountries = Object.entries(countryCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)

  // Recent signups — sort auth users by created_at desc
  const recentSignups = [...allUsers]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10)
    .map(u => ({
      id: u.id,
      email: u.email ?? '—',
      plan: planMap[u.id] ?? 'free',
      country: geoMap[u.id]?.country ?? null,
      city: geoMap[u.id]?.city ?? null,
      created_at: u.created_at,
    }))

  const recentScans = (recentScansRes.data ?? []).map(s => ({
    ...s,
    userEmail: userEmailMap[s.user_id] ?? '—',
  }))

  const conversionRate = totalUsers > 0
    ? Math.round((paidCount / totalUsers) * 100)
    : 0

  const stats = [
    {
      label: 'Total users',
      value: totalUsers.toLocaleString(),
      sub: `${paidCount} paid · ${totalUsers - paidCount} free`,
      color: 'text-slate-900',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      ),
    },
    {
      label: 'Total scans',
      value: totalScans.toLocaleString(),
      sub: `${scansThisMonth} this month`,
      color: 'text-slate-900',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
      ),
    },
    {
      label: 'Est. MRR',
      value: `$${mrr.toLocaleString()}`,
      sub: `${proCount} Pro · ${agencyCount} Agency`,
      color: 'text-emerald-600',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500">
          <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
        </svg>
      ),
    },
    {
      label: 'Conversion rate',
      value: `${conversionRate}%`,
      sub: `${paidCount} paying (${subCount} sub · ${packOnlyCount} pack)`,
      color: 'text-violet-600',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-violet-500">
          <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>
        </svg>
      ),
    },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">

      {/* Page title */}
      <div>
        <h1 className="font-serif text-2xl text-slate-900">Overview</h1>
        <p className="text-sm text-slate-400 mt-0.5">Real-time stats across all users and scans.</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map(({ label, value, sub, color, icon }) => (
          <div key={label} className="bg-white border border-slate-200 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
              <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center">{icon}</div>
            </div>
            <p className={`font-serif text-4xl ${color} mb-1`}>{value}</p>
            <p className="text-xs text-slate-400">{sub}</p>
          </div>
        ))}
      </div>

      {/* Top countries */}
      {topCountries.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-4">Top countries</p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {topCountries.map(([code, count]) => (
              <div key={code} className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5">
                <span className="text-2xl leading-none">{flag(code)}</span>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-800">{code}</div>
                  <div className="text-xs text-slate-400">{count} user{count === 1 ? '' : 's'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Plan breakdown bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-4">Plan distribution</p>
        <div className="flex items-center gap-3 mb-3">
          {[
            { label: 'Free', count: totalUsers - paidCount, color: 'bg-slate-200' },
            { label: 'Pro', count: proCount, color: 'bg-violet-400' },
            { label: 'Agency', count: agencyCount, color: 'bg-amber-400' },
          ].map(({ label, count, color }) => (
            <div key={label} className="flex-1">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-slate-500 font-medium">{label}</span>
                <span className="text-slate-700 font-semibold">{count}</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${color}`}
                  style={{ width: totalUsers > 0 ? `${(count / totalUsers) * 100}%` : '0%' }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent signups + Recent scans — stacked full-width */}
      <div className="space-y-6">

        {/* Recent signups */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <p className="font-semibold text-slate-900">Recent signups</p>
            <p className="text-xs text-slate-400 mt-0.5">Last 10 new accounts</p>
          </div>
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[560px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-5 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">Email</th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">Plan</th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">Location</th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">Joined</th>
              </tr>
            </thead>
            <tbody>
              {recentSignups.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-xs text-slate-400">No users yet</td>
                </tr>
              ) : recentSignups.map(u => (
                <tr key={u.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition">
                  <td className="px-5 py-3">
                    <span className="font-medium text-slate-700 truncate block max-w-[200px]">{u.email}</span>
                  </td>
                  <td className="px-3 py-3">
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize ${planBadge[u.plan] ?? planBadge.free}`}>
                      {u.plan}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-xs text-slate-500 whitespace-nowrap">
                    {u.country ? (
                      <span><span className="mr-1.5">{flag(u.country)}</span>{u.city ? `${u.city}, ` : ''}{u.country}</span>
                    ) : '—'}
                  </td>
                  <td className="px-3 py-3 text-xs text-slate-400 whitespace-nowrap">{relativeTime(u.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>

        {/* Recent scans */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <p className="font-semibold text-slate-900">Recent scans</p>
            <p className="text-xs text-slate-400 mt-0.5">Last 10 across all users</p>
          </div>
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[560px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-5 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">URL</th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">Score</th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">When</th>
              </tr>
            </thead>
            <tbody>
              {recentScans.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-5 py-10 text-center text-xs text-slate-400">No scans yet</td>
                </tr>
              ) : recentScans.map(s => (
                <tr key={s.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition">
                  <td className="px-5 py-3">
                    <div className="font-medium text-slate-700 truncate max-w-[160px]">{hostname(s.url)}</div>
                    <div className="text-xs text-slate-400 truncate max-w-[160px]">{s.userEmail}</div>
                  </td>
                  <td className="px-3 py-3">
                    <span className={`font-bold ${scoreColor(s.score)}`}>{s.score}</span>
                  </td>
                  <td className="px-3 py-3 text-xs text-slate-400 whitespace-nowrap">{relativeTime(s.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>

      </div>
    </div>
  )
}
