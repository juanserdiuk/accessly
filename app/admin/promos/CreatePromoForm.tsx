'use client'

import { useActionState, useEffect, useRef } from 'react'
import { createPromoCode } from './actions'

interface Salesperson {
  id: string
  full_name: string
  email: string
}

export default function CreatePromoForm({ salespeople }: { salespeople: Salesperson[] }) {
  const [state, action, pending] = useActionState(createPromoCode, null)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state?.success && formRef.current) formRef.current.reset()
  }, [state])

  return (
    <form ref={formRef} action={action} className="grid sm:grid-cols-2 gap-3">
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1.5">Code</label>
        <input
          name="code"
          required
          placeholder="SUMMER10"
          className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-emerald-400 transition uppercase"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1.5">Discount %</label>
        <input
          name="discount_percent"
          type="number"
          required
          min="1"
          max="100"
          defaultValue="5"
          className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-emerald-400 transition"
        />
      </div>
      <div className="sm:col-span-2">
        <label className="block text-xs font-medium text-slate-600 mb-1.5">
          Stripe coupon ID
          <span className="ml-2 text-slate-400 font-normal">(create it in Stripe Dashboard → Products → Coupons)</span>
        </label>
        <input
          name="stripe_coupon_id"
          required
          placeholder="abc123XYZ"
          className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-emerald-400 transition font-mono"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1.5">Max uses (optional)</label>
        <input
          name="max_uses"
          type="number"
          min="1"
          placeholder="unlimited"
          className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-emerald-400 transition"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1.5">Expires (optional)</label>
        <input
          name="expires_at"
          type="date"
          className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-emerald-400 transition"
        />
      </div>
      <div className="sm:col-span-2">
        <label className="block text-xs font-medium text-slate-600 mb-1.5">Salesperson (optional)</label>
        <select
          name="salesperson_id"
          defaultValue=""
          className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-emerald-400 transition"
        >
          <option value="">— Not attributed to a salesperson —</option>
          {salespeople.map(sp => (
            <option key={sp.id} value={sp.id}>{sp.full_name} ({sp.email})</option>
          ))}
        </select>
      </div>
      {state?.error && (
        <p className="sm:col-span-2 text-xs text-red-500">{state.error}</p>
      )}
      <div className="sm:col-span-2 flex items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={pending}
          className="px-4 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-700 transition disabled:opacity-50"
        >
          {pending ? 'Creating…' : 'Create promo code'}
        </button>
        {state?.success && <span className="text-xs text-emerald-600 font-medium">Created ✓</span>}
      </div>
    </form>
  )
}
