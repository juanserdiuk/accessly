import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import Image from 'next/image'

function fmtMoney(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100)
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' })
}

const planMeta: Record<string, { pill: string; dot: string; label: string }> = {
  free:   { label: 'Free',   pill: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-400' },
  pro:    { label: 'Pro',    pill: 'bg-violet-50 text-violet-700 border-violet-200', dot: 'bg-violet-500' },
  agency: { label: 'Agency', pill: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  pack:   { label: 'Pack',   pill: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
}

export default async function SalesDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const admin = createAdminClient()
  const { data: sp } = await admin
    .from('salespeople')
    .select('id, full_name, email, commission_percent')
    .eq('user_id', user!.id)
    .single()

  if (!sp) {
    return <div className="max-w-4xl mx-auto p-6">No salesperson record found.</div>
  }

  const [{ data: codes }, { data: redemptions }] = await Promise.all([
    admin
      .from('promo_codes')
      .select('id, code, discount_percent, uses_count, status, expires_at')
      .eq('salesperson_id', sp.id)
      .order('created_at', { ascending: false }),
    admin
      .from('promo_redemptions')
      .select('id, user_id, customer_email, amount_cents, plan, product_type, commission_cents, payout_status, paid_at, created_at')
      .eq('salesperson_id', sp.id)
      .order('created_at', { ascending: false }),
  ])

  const allCodes = codes ?? []
  const allReds = redemptions ?? []

  const totalSales = allReds.length
  const totalCommission = allReds.reduce((acc, r) => acc + (r.commission_cents ?? 0), 0)
  const unpaidCommission = allReds.filter(r => r.payout_status === 'unpaid').reduce((acc, r) => acc + (r.commission_cents ?? 0), 0)
  const paidCommission = totalCommission - unpaidCommission

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime()
  const thisMonth = allReds.filter(r => new Date(r.created_at).getTime() >= monthStart)
  const thisMonthCommission = thisMonth.reduce((acc, r) => acc + (r.commission_cents ?? 0), 0)

  // Build customer-level rollup so salespeople can follow up with the people
  // behind the redemptions, not just the raw transaction rows.
  type Customer = {
    userId: string | null
    email: string
    firstName: string | null
    lastName: string | null
    company: string | null
    country: string | null
    city: string | null
    avatarUrl: string | null
    plan: string
    totalSpend: number
    totalCommission: number
    purchases: number
    lastPurchaseAt: string
  }
  const customerMap = new Map<string, Customer>()
  for (const r of allReds) {
    const key = (r.user_id ?? r.customer_email).toLowerCase()
    const existing = customerMap.get(key)
    if (existing) {
      existing.totalSpend += r.amount_cents ?? 0
      existing.totalCommission += r.commission_cents ?? 0
      existing.purchases += 1
      if (new Date(r.created_at) > new Date(existing.lastPurchaseAt)) {
        existing.lastPurchaseAt = r.created_at
        existing.plan = r.plan
      }
    } else {
      customerMap.set(key, {
        userId: r.user_id ?? null,
        email: r.customer_email,
        firstName: null,
        lastName: null,
        company: null,
        country: null,
        city: null,
        avatarUrl: null,
        plan: r.plan,
        totalSpend: r.amount_cents ?? 0,
        totalCommission: r.commission_cents ?? 0,
        purchases: 1,
        lastPurchaseAt: r.created_at,
      })
    }
  }

  // Hydrate the cards with profile data so salespeople see name, company,
  // country, photo — the stuff that turns an email into a real follow-up.
  const userIds = Array.from(customerMap.values()).map(c => c.userId).filter((id): id is string => !!id)
  if (userIds.length > 0) {
    const { data: profileRows } = await admin
      .from('profiles')
      .select('id, first_name, last_name, company, country, city, avatar_url')
      .in('id', userIds)
    for (const p of profileRows ?? []) {
      for (const c of customerMap.values()) {
        if (c.userId === p.id) {
          c.firstName = p.first_name
          c.lastName  = p.last_name
          c.company   = p.company
          c.country   = p.country
          c.city      = p.city
          c.avatarUrl = p.avatar_url
        }
      }
    }
  }

  const customers = Array.from(customerMap.values())
    .sort((a, b) => b.totalSpend - a.totalSpend)

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-serif text-2xl text-slate-900">Welcome, {sp.full_name.split(' ')[0]}</h1>
          <p className="text-sm text-slate-400">Your sales dashboard · {sp.commission_percent}% commission rate</p>
        </div>
        <Link
          href="/sales/profile"
          className="text-xs font-semibold bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition"
        >
          Edit profile
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: 'Total sales', value: String(totalSales) },
          { label: 'This month', value: fmtMoney(thisMonthCommission), color: 'text-emerald-600' },
          { label: 'Total commission', value: fmtMoney(totalCommission) },
          { label: 'Unpaid', value: fmtMoney(unpaidCommission), color: unpaidCommission > 0 ? 'text-amber-600' : 'text-slate-400' },
        ].map(s => (
          <div key={s.label} className="bg-white border border-slate-200 rounded-2xl p-5">
            <p className={`font-serif text-3xl ${s.color ?? 'text-slate-900'} mb-1`}>{s.value}</p>
            <p className="text-xs text-slate-400 uppercase tracking-wide">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Codes */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <p className="font-semibold text-slate-900">Your promo codes</p>
            <p className="text-xs text-slate-400 mt-0.5">{allCodes.length} active code{allCodes.length === 1 ? '' : 's'}</p>
          </div>
          {allCodes.length === 0 ? (
            <p className="px-5 py-8 text-sm text-slate-400 text-center">
              No codes yet. Ask admin to create one for you.
            </p>
          ) : (
            <div className="divide-y divide-slate-50">
              {allCodes.map(c => (
                <div key={c.id} className="px-5 py-3 flex items-center justify-between">
                  <div className="min-w-0">
                    <code className="font-mono text-sm font-semibold text-slate-800">{c.code}</code>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {c.discount_percent}% off · used {c.uses_count}×
                      {c.expires_at && <> · expires {fmtDate(c.expires_at)}</>}
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize ${
                    c.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {c.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Commission payouts */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <p className="font-semibold text-slate-900 mb-3">Commission breakdown</p>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Lifetime earned</span>
              <span className="font-semibold text-slate-800">{fmtMoney(totalCommission)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Paid out</span>
              <span className="font-semibold text-emerald-600">{fmtMoney(paidCommission)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Pending</span>
              <span className={`font-semibold ${unpaidCommission > 0 ? 'text-amber-600' : 'text-slate-400'}`}>{fmtMoney(unpaidCommission)}</span>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-4 leading-relaxed">
            Commissions are paid at the start of each month for the prior month&apos;s sales. Reach out to admin for early payouts or questions.
          </p>
        </div>
      </div>

      {/* My customers — rich cards for follow-up */}
      {customers.length > 0 && (
        <div>
          <div className="flex items-end justify-between mb-3 flex-wrap gap-2">
            <div>
              <p className="font-semibold text-slate-900">Your customers</p>
              <p className="text-xs text-slate-400">{customers.length} customer{customers.length === 1 ? '' : 's'} — top spenders first</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {customers.map(c => {
              const meta = planMeta[c.plan] ?? planMeta.free
              const fullName = `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim()
              const initials = `${(c.firstName?.charAt(0) ?? '')}${(c.lastName?.charAt(0) ?? '')}`.toUpperCase()
                || c.email.charAt(0).toUpperCase()
              return (
                <div
                  key={c.userId ?? c.email}
                  className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md hover:border-slate-300 transition"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-700 shrink-0 ring-2 ring-white">
                      {c.avatarUrl ? (
                        <Image src={c.avatarUrl} alt={fullName || c.email} fill className="object-cover" sizes="48px" unoptimized />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-sm">
                          {initials}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-semibold text-slate-900 truncate">
                          {fullName || <span className="text-slate-400 italic font-normal">No name yet</span>}
                        </p>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${meta.pill}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                          {meta.label}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate">{c.email}</p>
                      {(c.company || c.country) && (
                        <p className="text-xs text-slate-400 mt-1 truncate">
                          {[c.company, c.city, c.country].filter(Boolean).join(' · ')}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Spent</p>
                      <p className="font-semibold text-sm text-slate-800 mt-0.5">{fmtMoney(c.totalSpend)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Earned</p>
                      <p className="font-semibold text-sm text-emerald-600 mt-0.5">{fmtMoney(c.totalCommission)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Last buy</p>
                      <p className="font-semibold text-sm text-slate-800 mt-0.5">{fmtDate(c.lastPurchaseAt)}</p>
                    </div>
                  </div>

                  <a
                    href={`mailto:${c.email}`}
                    className="mt-4 w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-700 transition"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                    </svg>
                    Follow up
                  </a>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Activity */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <p className="font-semibold text-slate-900">Recent sales</p>
          <p className="text-xs text-slate-400 mt-0.5">All-time, most recent first</p>
        </div>
        {allReds.length === 0 ? (
          <p className="px-5 py-10 text-sm text-slate-400 text-center">No sales yet — share your code to start earning.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[560px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Customer</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Plan</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Commission</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">When</th>
                </tr>
              </thead>
              <tbody>
                {allReds.map(r => (
                  <tr key={r.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition">
                    <td className="px-5 py-3 text-sm text-slate-700 truncate max-w-[200px]">{r.customer_email}</td>
                    <td className="px-4 py-3 text-xs text-slate-500 capitalize whitespace-nowrap">{r.plan}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-emerald-600 whitespace-nowrap">{fmtMoney(r.commission_cents)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                        r.payout_status === 'paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {r.payout_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">{fmtDate(r.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </main>
  )
}
