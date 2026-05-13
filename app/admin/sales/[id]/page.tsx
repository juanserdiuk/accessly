import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { markCommissionPaid, toggleSalespersonStatus, updateSalespersonCommission } from '../actions'

function fmtMoney(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100)
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' })
}

export default async function SalespersonDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const admin = createAdminClient()

  const { data: sp } = await admin
    .from('salespeople')
    .select('id, user_id, full_name, email, phone, address_line1, city, region, postal_code, country, commission_percent, status, notes, created_at')
    .eq('id', id)
    .single()
  if (!sp) notFound()

  const [{ data: codes }, { data: redemptions }] = await Promise.all([
    admin
      .from('promo_codes')
      .select('id, code, discount_percent, uses_count, status')
      .eq('salesperson_id', id),
    admin
      .from('promo_redemptions')
      .select('id, customer_email, amount_cents, currency, plan, product_type, commission_cents, payout_status, paid_at, created_at')
      .eq('salesperson_id', id)
      .order('created_at', { ascending: false }),
  ])

  const allCodes = codes ?? []
  const allReds = redemptions ?? []

  const totalSales = allReds.length
  const totalRevenue = allReds.reduce((acc, r) => acc + (r.amount_cents ?? 0), 0)
  const totalCommission = allReds.reduce((acc, r) => acc + (r.commission_cents ?? 0), 0)
  const unpaidCommission = allReds.filter(r => r.payout_status === 'unpaid').reduce((acc, r) => acc + (r.commission_cents ?? 0), 0)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">

      <Link href="/admin/sales" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-700 transition">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        All salespeople
      </Link>

      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center text-lg font-bold text-white">
          {sp.full_name.split(' ').map((p: string) => p[0]).slice(0, 2).join('').toUpperCase()}
        </div>
        <div>
          <h1 className="font-serif text-2xl text-slate-900">{sp.full_name}</h1>
          <p className="text-sm text-slate-400">{sp.email}{sp.phone ? ` · ${sp.phone}` : ''}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: 'Total sales', value: String(totalSales) },
          { label: 'Revenue', value: fmtMoney(totalRevenue) },
          { label: 'Commission earned', value: fmtMoney(totalCommission), color: 'text-emerald-600' },
          { label: 'Unpaid commission', value: fmtMoney(unpaidCommission), color: unpaidCommission > 0 ? 'text-amber-600' : 'text-slate-400' },
        ].map(s => (
          <div key={s.label} className="bg-white border border-slate-200 rounded-2xl p-5">
            <p className={`font-serif text-3xl ${s.color ?? 'text-slate-900'} mb-1`}>{s.value}</p>
            <p className="text-xs text-slate-400 uppercase tracking-wide">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Settings */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">Settings</p>
        <div className="grid sm:grid-cols-2 gap-4">
          <form action={updateSalespersonCommission} className="flex items-end gap-3">
            <input type="hidden" name="id" value={sp.id} />
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Commission %</label>
              <input
                name="commission_percent"
                type="number"
                min="0"
                max="100"
                step="0.01"
                defaultValue={sp.commission_percent}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-emerald-400 transition"
              />
            </div>
            <button type="submit" className="px-4 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-700 transition">
              Save
            </button>
          </form>
          <form action={toggleSalespersonStatus} className="flex items-end gap-3">
            <input type="hidden" name="id" value={sp.id} />
            <input type="hidden" name="status" value={sp.status} />
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Status</label>
              <div className="px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 text-slate-700 capitalize">
                {sp.status}
              </div>
            </div>
            <button type="submit" className="px-4 py-2.5 border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 transition">
              {sp.status === 'active' ? 'Deactivate' : 'Activate'}
            </button>
          </form>
        </div>
      </div>

      {/* Promo codes owned */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <p className="font-semibold text-slate-900">Promo codes</p>
          <p className="text-xs text-slate-400 mt-0.5">{allCodes.length} code{allCodes.length === 1 ? '' : 's'} attributed to {sp.full_name}</p>
        </div>
        {allCodes.length === 0 ? (
          <p className="px-5 py-8 text-sm text-slate-400 text-center">
            No codes yet. <Link href="/admin/promos" className="text-emerald-600 font-medium hover:underline">Create one →</Link>
          </p>
        ) : (
          <div className="divide-y divide-slate-50">
            {allCodes.map(c => (
              <div key={c.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <code className="font-mono text-sm font-semibold text-slate-800">{c.code}</code>
                  <span className="ml-3 text-xs text-slate-400">{c.discount_percent}% · used {c.uses_count}×</span>
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

      {/* Redemptions */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="font-semibold text-slate-900">Sales activity</p>
            <p className="text-xs text-slate-400 mt-0.5">{allReds.length} redemption{allReds.length === 1 ? '' : 's'}</p>
          </div>
          {unpaidCommission > 0 && (
            <form action={markCommissionPaid}>
              <input type="hidden" name="salesperson_id" value={sp.id} />
              <button type="submit" className="text-xs font-semibold bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition">
                Mark {fmtMoney(unpaidCommission)} paid
              </button>
            </form>
          )}
        </div>
        {allReds.length === 0 ? (
          <p className="px-5 py-10 text-sm text-slate-400 text-center">No sales activity yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Customer</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Plan</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Amount</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Commission</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">When</th>
                </tr>
              </thead>
              <tbody>
                {allReds.map(r => (
                  <tr key={r.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition">
                    <td className="px-5 py-3.5 text-sm text-slate-700 truncate max-w-[200px]">{r.customer_email}</td>
                    <td className="px-4 py-3.5 text-xs text-slate-500 capitalize whitespace-nowrap">{r.plan} ({r.product_type})</td>
                    <td className="px-4 py-3.5 text-sm text-slate-700 whitespace-nowrap">{fmtMoney(r.amount_cents)}</td>
                    <td className="px-4 py-3.5 text-sm font-semibold text-emerald-600 whitespace-nowrap">{fmtMoney(r.commission_cents)}</td>
                    <td className="px-4 py-3.5">
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                        r.payout_status === 'paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {r.payout_status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-400 whitespace-nowrap">{fmtDate(r.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  )
}
