import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'

function fmtMoney(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100)
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' })
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
      .select('id, customer_email, amount_cents, plan, product_type, commission_cents, payout_status, paid_at, created_at')
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
