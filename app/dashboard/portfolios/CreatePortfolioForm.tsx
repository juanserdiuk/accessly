'use client'

import { useActionState, useEffect, useRef } from 'react'
import { createPortfolio } from './actions'

export default function CreatePortfolioForm() {
  const [state, action, pending] = useActionState(createPortfolio, null)
  const ref = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (state?.success && ref.current) ref.current.value = ''
  }, [state])

  return (
    <form action={action} className="space-y-2">
      <div className="flex gap-3">
        <input
          ref={ref}
          name="name"
          type="text"
          required
          maxLength={80}
          placeholder="e.g. Acme Inc. — Marketing sites"
          className="flex-1 px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-emerald-400 transition placeholder:text-slate-300"
        />
        <button
          type="submit"
          disabled={pending}
          className="px-4 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-700 transition disabled:opacity-50 shrink-0"
        >
          {pending ? 'Creating…' : 'Create portfolio'}
        </button>
      </div>
      {state?.error && <p className="text-xs text-red-500">{state.error}</p>}
    </form>
  )
}
