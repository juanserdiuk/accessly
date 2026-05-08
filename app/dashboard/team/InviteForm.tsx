'use client'

import { useActionState, useEffect, useRef } from 'react'
import { inviteMember } from './actions'

export default function InviteForm() {
  const [state, action, pending] = useActionState(inviteMember, null)
  const emailRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (state?.success && emailRef.current) {
      emailRef.current.value = ''
    }
  }, [state])

  return (
    <form action={action} className="space-y-3">
      <div className="flex gap-3">
        <input
          ref={emailRef}
          name="email"
          type="email"
          placeholder="colleague@company.com"
          className="flex-1 px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white
            focus:outline-none focus:border-emerald-400 transition placeholder:text-slate-300"
        />
        <select
          name="role"
          className="px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white
            focus:outline-none focus:border-emerald-400 transition text-slate-700 cursor-pointer"
        >
          <option value="member">Member</option>
          <option value="admin">Admin</option>
          <option value="viewer">Viewer</option>
        </select>
        <button
          type="submit"
          disabled={pending}
          className="px-4 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-xl
            hover:bg-slate-700 transition disabled:opacity-50 shrink-0"
        >
          {pending ? 'Inviting…' : 'Invite'}
        </button>
      </div>
      {state?.error && (
        <p className="text-xs text-red-500">{state.error}</p>
      )}
      {state?.success && (
        <p className="text-xs text-emerald-600">Invitation sent successfully.</p>
      )}
    </form>
  )
}
