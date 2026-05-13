import { createAdminClient } from '@/lib/supabase/admin'
import CreatePromoForm from './CreatePromoForm'
import { togglePromoCode, deletePromoCode } from './actions'

type PromoCode = {
  id: string
  code: string
  salesperson_id: string | null
  discount_percent: number
  stripe_coupon_id: string
  max_uses: number | null
  uses_count: number
  expires_at: string | null
  status: string
  created_at: string
}

type Salesperson = {
  id: string
  full_name: string
  email: string
}

function fmtDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString(undefined, { dateStyle: 'short' })
}

export default async function PromosPage() {
  const admin = createAdminClient()
  const [{ data: codes }, { data: salespeople }] = await Promise.all([
    admin
      .from('promo_codes')
      .select('id, code, salesperson_id, discount_percent, stripe_coupon_id, max_uses, uses_count, expires_at, status, created_at')
      .order('created_at', { ascending: false }),
    admin
      .from('salespeople')
      .select('id, full_name, email')
      .order('full_name'),
  ])

  const allCodes: PromoCode[] = codes ?? []
  const salesList: Salesperson[] = salespeople ?? []
  const salesNameMap: Record<string, string> = Object.fromEntries(
    salesList.map(s => [s.id, s.full_name]),
  )

  const totalRedemptions = allCodes.reduce((acc, c) => acc + c.uses_count, 0)
  const activeCount = allCodes.filter(c => c.status === 'active').length

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">

      <div>
        <h1 className="font-serif text-2xl text-slate-900">Promo codes</h1>
        <p className="text-sm text-slate-400 mt-0.5">
          {allCodes.length === 0
            ? 'Create promo codes that apply Stripe coupons at checkout — optionally attributed to a salesperson.'
            : `${allCodes.length} total · ${activeCount} active · ${totalRedemptions} redemption${totalRedemptions === 1 ? '' : 's'}`}
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">
          New promo code
        </p>
        <CreatePromoForm salespeople={salesList} />
      </div>

      {allCodes.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl flex flex-col items-center justify-center py-16 text-center">
          <div className="w-12 h-12 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center mb-3">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
              <line x1="7" y1="7" x2="7.01" y2="7"/>
            </svg>
          </div>
          <p className="text-sm font-medium text-slate-700">No promo codes yet</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[800px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Code</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Discount</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Salesperson</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Uses</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Expires</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {allCodes.map(c => (
                  <tr key={c.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition">
                    <td className="px-5 py-3.5">
                      <code className="font-mono text-sm font-semibold text-slate-800">{c.code}</code>
                      <div className="text-[10px] text-slate-400 mt-0.5 font-mono">coupon: {c.stripe_coupon_id}</div>
                    </td>
                    <td className="px-4 py-3.5 text-sm font-semibold text-slate-800 whitespace-nowrap">
                      {c.discount_percent}%
                    </td>
                    <td className="px-4 py-3.5 text-sm text-slate-600 whitespace-nowrap">
                      {c.salesperson_id ? (salesNameMap[c.salesperson_id] ?? '—') : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3.5 text-sm text-slate-600 whitespace-nowrap">
                      {c.uses_count}{c.max_uses !== null ? ` / ${c.max_uses}` : ''}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-400 whitespace-nowrap">{fmtDate(c.expires_at)}</td>
                    <td className="px-4 py-3.5">
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize ${
                        c.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <form action={togglePromoCode} className="inline">
                        <input type="hidden" name="id" value={c.id} />
                        <input type="hidden" name="status" value={c.status} />
                        <button
                          type="submit"
                          className="text-xs font-medium text-slate-500 hover:text-slate-800 transition"
                        >
                          {c.status === 'active' ? 'Disable' : 'Enable'}
                        </button>
                      </form>
                      <form action={deletePromoCode} className="inline ml-3">
                        <input type="hidden" name="id" value={c.id} />
                        <button
                          type="submit"
                          className="text-xs font-medium text-slate-400 hover:text-red-500 transition"
                          title="Delete (or disable if redeemed)"
                        >
                          Delete
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
