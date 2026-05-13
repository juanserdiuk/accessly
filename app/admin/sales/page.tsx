import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import CreateSalespersonForm from './CreateSalespersonForm'

type Salesperson = {
  id: string
  user_id: string
  full_name: string
  email: string
  phone: string | null
  commission_percent: number
  status: string
  created_at: string
}

function fmtMoney(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100)
}

export default async function SalespeoplePage() {
  const admin = createAdminClient()

  const [{ data: salespeople }, { data: redemptions }] = await Promise.all([
    admin
      .from('salespeople')
      .select('id, user_id, full_name, email, phone, commission_percent, status, created_at')
      .order('created_at', { ascending: false }),
    admin
      .from('promo_redemptions')
      .select('salesperson_id, amount_cents, commission_cents, payout_status'),
  ])

  const sales: Salesperson[] = salespeople ?? []
  const reds = redemptions ?? []

  // Aggregate per salesperson
  const stats: Record<string, { sales: number; revenueCents: number; commissionCents: number; unpaidCents: number }> = {}
  for (const r of reds) {
    if (!r.salesperson_id) continue
    const s = (stats[r.salesperson_id] ??= { sales: 0, revenueCents: 0, commissionCents: 0, unpaidCents: 0 })
    s.sales++
    s.revenueCents += r.amount_cents ?? 0
    s.commissionCents += r.commission_cents ?? 0
    if (r.payout_status === 'unpaid') s.unpaidCents += r.commission_cents ?? 0
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">

      <div>
        <h1 className="font-serif text-2xl text-slate-900">Salespeople</h1>
        <p className="text-sm text-slate-400 mt-0.5">
          {sales.length === 0
            ? 'Create salesperson accounts here. They log in at /sales with the temp password you share.'
            : `${sales.length} total · ${sales.filter(s => s.status === 'active').length} active`}
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">
          Add a salesperson
        </p>
        <CreateSalespersonForm />
      </div>

      {sales.length === 0 ? null : (
        <div className="space-y-3">
          {sales.map(sp => {
            const s = stats[sp.id] ?? { sales: 0, revenueCents: 0, commissionCents: 0, unpaidCents: 0 }
            return (
              <Link
                key={sp.id}
                href={`/admin/sales/${sp.id}`}
                className="block bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md hover:border-slate-300 transition"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center text-sm font-bold text-white shrink-0">
                    {sp.full_name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-slate-900">{sp.full_name}</h3>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        sp.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {sp.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 truncate">{sp.email} · {sp.commission_percent}% commission</p>
                  </div>
                  <div className="hidden sm:flex items-center gap-6 shrink-0">
                    <div className="text-center">
                      <div className="font-serif text-2xl text-slate-900">{s.sales}</div>
                      <div className="text-[10px] uppercase tracking-wider text-slate-400">Sales</div>
                    </div>
                    <div className="text-center">
                      <div className="font-serif text-2xl text-emerald-600">{fmtMoney(s.commissionCents)}</div>
                      <div className="text-[10px] uppercase tracking-wider text-slate-400">Commission</div>
                    </div>
                    <div className="text-center">
                      <div className={`font-serif text-2xl ${s.unpaidCents > 0 ? 'text-amber-600' : 'text-slate-300'}`}>
                        {fmtMoney(s.unpaidCents)}
                      </div>
                      <div className="text-[10px] uppercase tracking-wider text-slate-400">Unpaid</div>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
