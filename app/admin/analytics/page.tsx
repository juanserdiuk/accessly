import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/admin'

function fmtMoney(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100)
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function flag(country: string | null | undefined) {
  if (!country || country.length !== 2) return ''
  return String.fromCodePoint(...country.toUpperCase().split('').map(c => 127397 + c.charCodeAt(0)))
}

export default async function AdminAnalyticsPage() {
  // CRITICAL: must precede every data fetch — see lib/auth/admin.ts.
  await requireAdmin()
  const admin = createAdminClient()
  const now = new Date()
  const days = 30
  const since = startOfDay(new Date(now.getTime() - days * 86_400_000))
  const sinceIso = since.toISOString()

  const [usersRes, profilesRes, scansRes, redemptionsRes, msgsRes] = await Promise.all([
    admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    admin.from('profiles').select('id, plan, stripe_customer_id, country, created_at'),
    admin.from('scans').select('id, score, created_at, user_id').gte('created_at', sinceIso),
    admin.from('promo_redemptions').select('amount_cents, commission_cents, payout_status, created_at'),
    admin.from('contact_messages').select('id, created_at').gte('created_at', sinceIso),
  ])

  const users = usersRes.data?.users ?? []
  const profiles = profilesRes.data ?? []
  const scans = scansRes.data ?? []
  const reds = redemptionsRes.data ?? []
  const msgs = msgsRes.data ?? []

  // Signup time series (last 30 days)
  const signupBuckets: Record<string, number> = {}
  for (let i = 0; i < days; i++) {
    const d = new Date(since.getTime() + i * 86_400_000)
    signupBuckets[d.toISOString().slice(0, 10)] = 0
  }
  for (const u of users) {
    const key = (u.created_at ?? '').slice(0, 10)
    if (key in signupBuckets) signupBuckets[key]++
  }
  const signupDays = Object.entries(signupBuckets).sort(([a], [b]) => a.localeCompare(b))
  const maxSignups = Math.max(1, ...signupDays.map(([, n]) => n))

  // Revenue time series
  const revBuckets: Record<string, number> = {}
  for (let i = 0; i < days; i++) {
    const d = new Date(since.getTime() + i * 86_400_000)
    revBuckets[d.toISOString().slice(0, 10)] = 0
  }
  for (const r of reds) {
    const key = (r.created_at ?? '').slice(0, 10)
    if (key in revBuckets) revBuckets[key] += r.amount_cents ?? 0
  }
  const revDays = Object.entries(revBuckets).sort(([a], [b]) => a.localeCompare(b))
  const maxRev = Math.max(1, ...revDays.map(([, n]) => n))

  // Score distribution from recent scans
  const scoreBuckets = { '90-100': 0, '80-89': 0, '60-79': 0, '0-59': 0 }
  for (const s of scans) {
    if (s.score >= 90) scoreBuckets['90-100']++
    else if (s.score >= 80) scoreBuckets['80-89']++
    else if (s.score >= 60) scoreBuckets['60-79']++
    else scoreBuckets['0-59']++
  }

  // Aggregates
  const newSignups = users.filter(u => new Date(u.created_at ?? 0).getTime() >= since.getTime()).length
  const totalUsers = users.length
  const paidUsers = profiles.filter(p => !!p.stripe_customer_id).length
  const conversionRate = totalUsers > 0 ? Math.round((paidUsers / totalUsers) * 100) : 0
  const revenue30d = reds
    .filter(r => new Date(r.created_at).getTime() >= since.getTime())
    .reduce((a, r) => a + (r.amount_cents ?? 0), 0)
  const commission30d = reds
    .filter(r => new Date(r.created_at).getTime() >= since.getTime())
    .reduce((a, r) => a + (r.commission_cents ?? 0), 0)
  const avgScoreRecent = scans.length > 0
    ? Math.round(scans.reduce((a, s) => a + s.score, 0) / scans.length)
    : null

  // Top countries (top 10)
  const countryCounts: Record<string, number> = {}
  for (const p of profiles) {
    if (p.country) countryCounts[p.country] = (countryCounts[p.country] ?? 0) + 1
  }
  const topCountries = Object.entries(countryCounts).sort(([, a], [, b]) => b - a).slice(0, 10)
  const maxCountry = Math.max(1, ...topCountries.map(([, n]) => n))

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-serif text-2xl text-slate-900">Analytics</h1>
          <p className="text-sm text-slate-400 mt-0.5">Last {days} days · live data from Supabase</p>
        </div>
      </div>

      {/* Top cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: 'New signups (30d)', value: String(newSignups), color: 'text-slate-900' },
          { label: 'Revenue (30d)', value: fmtMoney(revenue30d), color: 'text-emerald-600' },
          { label: 'Commission paid out', value: fmtMoney(commission30d), color: 'text-violet-600' },
          { label: 'Avg score (recent)', value: avgScoreRecent !== null ? String(avgScoreRecent) : '—', color: avgScoreRecent !== null && avgScoreRecent >= 80 ? 'text-green-600' : 'text-amber-500' },
        ].map(s => (
          <div key={s.label} className="bg-white border border-slate-200 rounded-2xl p-5">
            <p className={`font-serif text-3xl ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-400 uppercase tracking-wide mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Signups + Revenue time series */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">Daily signups</p>
          <div className="flex items-end gap-0.5 h-32">
            {signupDays.map(([day, n]) => (
              <div
                key={day}
                title={`${day}: ${n}`}
                className="flex-1 bg-slate-100 hover:bg-emerald-300 transition-colors rounded-t"
                style={{ height: `${Math.max(4, (n / maxSignups) * 100)}%`, background: n > 0 ? undefined : '#f1f5f9' }}
              >
                <div
                  className="w-full bg-emerald-400 rounded-t"
                  style={{ height: '100%' }}
                />
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-3">{newSignups} total across the window</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">Daily revenue</p>
          <div className="flex items-end gap-0.5 h-32">
            {revDays.map(([day, cents]) => (
              <div
                key={day}
                title={`${day}: ${fmtMoney(cents)}`}
                className="flex-1 bg-slate-100 transition-colors rounded-t"
                style={{ height: `${Math.max(4, (cents / maxRev) * 100)}%` }}
              >
                <div
                  className="w-full bg-violet-400 rounded-t"
                  style={{ height: '100%' }}
                />
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-3">{fmtMoney(revenue30d)} total · {reds.length} all-time redemptions</p>
        </div>
      </div>

      {/* Score distribution + Top countries */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">Score distribution (last {days} days)</p>
          <div className="space-y-3">
            {Object.entries(scoreBuckets).map(([range, count]) => {
              const pct = scans.length > 0 ? (count / scans.length) * 100 : 0
              const color =
                range === '90-100' ? 'bg-emerald-400' :
                range === '80-89' ? 'bg-emerald-300' :
                range === '60-79' ? 'bg-amber-400' :
                'bg-red-400'
              return (
                <div key={range}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-600 font-medium">{range}</span>
                    <span className="text-slate-400">{count} ({pct.toFixed(0)}%)</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
          <p className="text-xs text-slate-400 mt-4">{scans.length} scans over window</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">Top countries</p>
          {topCountries.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-8">No geo data yet.</p>
          ) : (
            <div className="space-y-2.5">
              {topCountries.map(([code, count]) => (
                <div key={code} className="flex items-center gap-3">
                  <span className="text-lg leading-none w-7 shrink-0">{flag(code)}</span>
                  <span className="text-sm font-medium text-slate-700 w-10 shrink-0">{code}</span>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${(count / maxCountry) * 100}%` }} />
                  </div>
                  <span className="text-xs text-slate-500 font-semibold w-12 text-right shrink-0">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Misc stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: 'Total users', value: String(totalUsers) },
          { label: 'Conversion rate', value: `${conversionRate}%` },
          { label: 'Paid users', value: String(paidUsers) },
          { label: 'Messages (30d)', value: String(msgs.length) },
        ].map(s => (
          <div key={s.label} className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="font-serif text-2xl text-slate-900">{s.value}</p>
            <p className="text-[10px] uppercase tracking-wider text-slate-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

    </div>
  )
}
