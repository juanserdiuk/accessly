'use client'

import { useActionState } from 'react'
import { updateOwnProfile } from '../actions'

interface Initial {
  full_name: string
  phone: string | null
  address_line1: string | null
  address_line2: string | null
  city: string | null
  region: string | null
  postal_code: string | null
  country: string | null
}

export default function ProfileForm({ initial }: { initial: Initial }) {
  const [state, action, pending] = useActionState(updateOwnProfile, null)

  return (
    <form action={action} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1.5">Full name</label>
        <input
          name="full_name"
          required
          defaultValue={initial.full_name}
          className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-emerald-400 transition"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1.5">Phone</label>
        <input
          name="phone"
          type="tel"
          defaultValue={initial.phone ?? ''}
          className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-emerald-400 transition"
        />
      </div>

      <div className="pt-2 border-t border-slate-100">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Mailing address</p>
        <div className="space-y-3">
          <input
            name="address_line1"
            defaultValue={initial.address_line1 ?? ''}
            placeholder="Street address"
            className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-emerald-400 transition"
          />
          <input
            name="address_line2"
            defaultValue={initial.address_line2 ?? ''}
            placeholder="Apt, suite, etc. (optional)"
            className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-emerald-400 transition"
          />
          <div className="grid sm:grid-cols-2 gap-3">
            <input
              name="city"
              defaultValue={initial.city ?? ''}
              placeholder="City"
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-emerald-400 transition"
            />
            <input
              name="region"
              defaultValue={initial.region ?? ''}
              placeholder="State / Province"
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-emerald-400 transition"
            />
            <input
              name="postal_code"
              defaultValue={initial.postal_code ?? ''}
              placeholder="ZIP / Postal code"
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-emerald-400 transition"
            />
            <input
              name="country"
              defaultValue={initial.country ?? ''}
              placeholder="Country"
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-emerald-400 transition"
            />
          </div>
        </div>
      </div>

      {state?.error && <p className="text-xs text-red-500">{state.error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="px-4 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-700 transition disabled:opacity-50"
        >
          {pending ? 'Saving…' : 'Save changes'}
        </button>
        {state?.success && <span className="text-xs text-emerald-600 font-medium">Saved ✓</span>}
      </div>
    </form>
  )
}
