import { createAdminClient } from '@/lib/supabase/admin'
import { setCustomerPlan } from '../actions'
import Image from 'next/image'
import Link from 'next/link'

function flag(country: string | null) {
  if (!country) return ''
  // We store the full name (e.g. "United States") in profiles.country, not ISO,
  // so fall back to a globe glyph until we have proper ISO mapping.
  return '🌎'
}

function relativeTime(iso: string | null) {
  if (!iso) return '—'
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 30) return `${days}d ago`
  if (days < 365) return `${Math.floor(days / 30)}mo ago`
  return `${Math.floor(days / 365)}y ago`
}

function fmtMoney(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100)
}

const planMeta: Record<string, { label: string; pill: string; dot: string }> = {
  free:   { label: 'Free',   pill: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-400' },
  pro:    { label: 'Pro',    pill: 'bg-violet-50 text-violet-700 border-violet-200', dot: 'bg-violet-500' },
  agency: { label: 'Agency', pill: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
}

interface PageProps {
  searchParams: Promise<{ q?: string; plan?: string }>
}

export default async function CustomersPage({ searchParams }: PageProps) {
  const { q = '', plan: planFilter = '' } = await searchParams
  const admin = createAdminClient()

  const [profilesRes, usersRes, scansRes, redemptionsRes] = await Promise.all([
    admin
      .from('profiles')
      .select('id, plan, stripe_customer_id, scan_count, created_at, country, city, first_name, last_name, company, avatar_url'),
    admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    admin.from('scans').select('user_id, created_at').order('created_at', { ascending: false }),
    admin
      .from('promo_redemptions')
      .select('user_id, amount_cents, plan, created_at'),
  ])

  const profiles = profilesRes.data ?? []
  const users = usersRes.data?.users ?? []
  const scans = scansRes.data ?? []
  const redemptions = redemptionsRes.data ?? []

  const emailMap: Record<string, string> = {}
  const signupMap: Record<string, string> = {}
  for (const u of users) {
    if (u.email) emailMap[u.id] = u.email
    if (u.created_at) signupMap[u.id] = u.created_at
  }

  // Last scan + total scans per user
  const lastScanMap: Record<string, string> = {}
  const scanCountMap: Record<string, number> = {}
  for (const s of scans) {
    if (!s.user_id) continue
    scanCountMap[s.user_id] = (scanCountMap[s.user_id] ?? 0) + 1
    if (!lastScanMap[s.user_id]) lastScanMap[s.user_id] = s.created_at
  }

  // Lifetime spend per user
  const spendMap: Record<string, number> = {}
  for (const r of redemptions) {
    if (!r.user_id) continue
    spendMap[r.user_id] = (spendMap[r.user_id] ?? 0) + (r.amount_cents ?? 0)
  }

  // Merge into a list and filter
  const needle = q.trim().toLowerCase()
  const enriched = profiles
    .map(p => {
      const fullName = `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim()
      const email = emailMap[p.id] ?? '—'
      return {
        id: p.id,
        email,
        fullName,
        company: p.company ?? null,
        country: p.country ?? null,
        city: p.city ?? null,
        plan: (p.plan ?? 'free') as string,
        avatarUrl: p.avatar_url ?? null,
        stripeCustomerId: p.stripe_customer_id ?? null,
        signupAt: signupMap[p.id] ?? p.created_at,
        scanCount: scanCountMap[p.id] ?? 0,
        lastScanAt: lastScanMap[p.id] ?? null,
        spend: spendMap[p.id] ?? 0,
      }
    })
    .filter(c => {
      if (planFilter && c.plan !== planFilter) return false
      if (needle) {
        const hay = `${c.fullName} ${c.email} ${c.company ?? ''} ${c.country ?? ''}`.toLowerCase()
        if (!hay.includes(needle)) return false
      }
      return true
    })
    .sort((a, b) => {
      // Paying customers first, then by spend, then by last scan
      const aPaid = a.plan !== 'free' || a.spend > 0 ? 1 : 0
      const bPaid = b.plan !== 'free' || b.spend > 0 ? 1 : 0
      if (aPaid !== bPaid) return bPaid - aPaid
      if (a.spend !== b.spend) return b.spend - a.spend
      const aL = a.lastScanAt ? new Date(a.lastScanAt).getTime() : 0
      const bL = b.lastScanAt ? new Date(b.lastScanAt).getTime() : 0
      return bL - aL
    })

  const totalCount = profiles.length
  const filteredCount = enriched.length

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">

      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-serif text-2xl text-slate-900">Customers</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {filteredCount === totalCount
              ? `${totalCount} customer${totalCount === 1 ? '' : 's'} total`
              : `${filteredCount} of ${totalCount} customers`
            } — sorted by paying & most active
          </p>
        </div>
      </div>

      {/* Filter bar */}
      <form className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search by name, email, company, country…"
            className="w-full pl-10 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-emerald-400 transition"
          />
        </div>
        <div className="flex gap-2">
          <select
            name="plan"
            defaultValue={planFilter}
            className="px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-emerald-400 transition text-slate-700 cursor-pointer"
          >
            <option value="">All plans</option>
            <option value="free">Free</option>
            <option value="pro">Pro</option>
            <option value="agency">Agency</option>
          </select>
          <button
            type="submit"
            className="px-4 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-700 transition"
          >
            Filter
          </button>
          {(q || planFilter) && (
            <Link
              href="/admin/customers"
              className="px-4 py-2.5 border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50 transition"
            >
              Reset
            </Link>
          )}
        </div>
      </form>

      {/* Cards grid */}
      {enriched.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
          <p className="text-slate-400 text-sm">No customers match those filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {enriched.map(c => {
            const meta = planMeta[c.plan] ?? planMeta.free
            const initials = `${c.fullName.charAt(0)}${c.fullName.split(' ').slice(-1)[0]?.charAt(0) ?? ''}`.toUpperCase()
              || c.email.charAt(0).toUpperCase()
            return (
              <div
                key={c.id}
                className="group bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md hover:border-slate-300 transition"
              >
                {/* Header: avatar + identity */}
                <div className="flex items-start gap-3 mb-4">
                  <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-violet-500 to-purple-700 shrink-0 ring-2 ring-white">
                    {c.avatarUrl ? (
                      <Image src={c.avatarUrl} alt={c.fullName || c.email} fill className="object-cover" sizes="48px" unoptimized />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-sm">
                        {initials}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-semibold text-slate-900 truncate">
                        {c.fullName || <span className="text-slate-400 italic font-normal">No name yet</span>}
                      </p>
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${meta.pill}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                        {meta.label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 truncate">{c.email}</p>
                  </div>
                </div>

                {/* Meta rows */}
                <div className="space-y-2 mb-4 text-xs">
                  {c.company && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 shrink-0">
                        <path d="M3 21h18M3 7v14M21 7v14M6 11h2M6 15h2M10 11h2M10 15h2M14 11h2M14 15h2M3 7l9-4 9 4"/>
                      </svg>
                      <span className="truncate">{c.company}</span>
                    </div>
                  )}
                  {(c.country || c.city) && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 shrink-0">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                      </svg>
                      <span className="truncate">
                        {c.city ? `${c.city}, ` : ''}{c.country ?? ''} <span className="text-base align-middle">{flag(c.country)}</span>
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-slate-600">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 shrink-0">
                      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    <span>Joined {relativeTime(c.signupAt)}</span>
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Scans</p>
                    <p className="font-semibold text-sm text-slate-800 mt-0.5">{c.scanCount}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Spent</p>
                    <p className={`font-semibold text-sm mt-0.5 ${c.spend > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {c.spend > 0 ? fmtMoney(c.spend) : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Last scan</p>
                    <p className="font-semibold text-sm text-slate-800 mt-0.5">{relativeTime(c.lastScanAt)}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-4">
                  <a
                    href={`mailto:${c.email}`}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-700 transition"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                    </svg>
                    Email
                  </a>
                  {c.stripeCustomerId && (
                    <a
                      href={`https://dashboard.stripe.com/customers/${c.stripeCustomerId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 border border-slate-200 text-slate-600 text-xs font-semibold rounded-lg hover:bg-slate-50 transition"
                      title="Open in Stripe"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                      </svg>
                      Stripe
                    </a>
                  )}
                </div>

                {/* Admin plan override — comp Pro/Agency for free */}
                <div className="mt-3 pt-3 border-t border-dashed border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Plan override</p>
                    <span className="text-[9px] font-bold uppercase tracking-widest bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded-full">
                      Admin
                    </span>
                  </div>
                  <div className="flex gap-1.5">
                    {(['free', 'pro', 'agency'] as const).map(p => {
                      const active = c.plan === p
                      const targetMeta = planMeta[p]
                      return (
                        <form key={p} action={setCustomerPlan} className="flex-1">
                          <input type="hidden" name="userId" value={c.id} />
                          <input type="hidden" name="plan" value={p} />
                          <button
                            type="submit"
                            disabled={active}
                            className={`w-full text-xs font-semibold py-1.5 rounded-lg transition capitalize ${
                              active
                                ? `${targetMeta.pill} cursor-default border`
                                : 'border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                            }`}
                            title={active ? `Currently on ${p}` : `Grant ${p} (free, bypasses Stripe)`}
                          >
                            {p}
                          </button>
                        </form>
                      )
                    })}
                  </div>
                  {c.stripeCustomerId && c.plan !== 'free' && (
                    <p className="text-[10px] text-amber-700 mt-1.5 leading-relaxed">
                      ⚠ Has Stripe sub — downgrade via Stripe portal first, or the next billing event will fight this override.
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
