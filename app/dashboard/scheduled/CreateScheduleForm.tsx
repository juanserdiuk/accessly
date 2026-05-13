'use client'

import { useActionState, useEffect, useRef } from 'react'
import { createSchedule } from './actions'

export default function CreateScheduleForm() {
  const [state, action, pending] = useActionState(createSchedule, null)
  const ref = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (state?.success && ref.current) ref.current.value = ''
  }, [state])

  return (
    <form action={action} className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          ref={ref}
          name="url"
          type="url"
          required
          placeholder="https://example.com"
          className="flex-1 px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-emerald-400 transition placeholder:text-slate-300"
        />
        <select
          name="cadence"
          defaultValue="daily"
          className="px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-emerald-400 transition text-slate-700 cursor-pointer"
        >
          <option value="hourly">Every hour</option>
          <option value="every_6h">Every 6 hours</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
        </select>
        <button
          type="submit"
          disabled={pending}
          className="px-4 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-700 transition disabled:opacity-50 shrink-0"
        >
          {pending ? 'Adding…' : 'Schedule scan'}
        </button>
      </div>
      {state?.error && <p className="text-xs text-red-500">{state.error}</p>}
    </form>
  )
}
