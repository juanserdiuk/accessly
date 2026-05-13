'use client'

import { useActionState, useState } from 'react'
import { createSalesperson } from './actions'

export default function CreateSalespersonForm() {
  const [state, action, pending] = useActionState(createSalesperson, null)
  const [copied, setCopied] = useState(false)

  async function copyPassword() {
    if (!state?.password) return
    await navigator.clipboard.writeText(state.password)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <form action={action} className="space-y-3">
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Full name</label>
          <input
            name="full_name"
            required
            placeholder="Jane Smith"
            className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-emerald-400 transition"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Email</label>
          <input
            name="email"
            type="email"
            required
            placeholder="jane@example.com"
            className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-emerald-400 transition"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Phone (optional)</label>
          <input
            name="phone"
            type="tel"
            placeholder="+1 555 123 4567"
            className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-emerald-400 transition"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Commission %</label>
          <input
            name="commission_percent"
            type="number"
            min="0"
            max="100"
            step="0.01"
            defaultValue="10"
            className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-emerald-400 transition"
          />
        </div>
      </div>

      {state?.error && <p className="text-xs text-red-500">{state.error}</p>}

      {state?.success && state.password && (
        <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500 shrink-0 mt-0.5">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-emerald-800">Account created.</p>
            <p className="text-xs text-emerald-700 mt-0.5">
              Share this temporary password with them — they can change it after first login at /sales.
            </p>
            <div className="mt-2 flex items-center gap-2">
              <code className="font-mono text-sm bg-white border border-emerald-200 px-3 py-1.5 rounded-lg text-slate-800 select-all">
                {state.password}
              </code>
              <button
                type="button"
                onClick={copyPassword}
                className="text-xs font-semibold bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700 transition"
              >
                {copied ? 'Copied ✓' : 'Copy'}
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="px-4 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-700 transition disabled:opacity-50"
      >
        {pending ? 'Creating account…' : 'Create salesperson account'}
      </button>
    </form>
  )
}
