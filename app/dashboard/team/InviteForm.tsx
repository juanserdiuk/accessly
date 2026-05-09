'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { inviteMember } from './actions'

export default function InviteForm() {
  const t = useTranslations('dashboard.team')
  const [state, action, pending] = useActionState(inviteMember, null)
  const emailRef = useRef<HTMLInputElement>(null)
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    if (state?.success && emailRef.current) {
      emailRef.current.value = ''
    }
    if (state?.success) {
      setShowSuccess(true)
      const id = setTimeout(() => setShowSuccess(false), 3500)
      return () => clearTimeout(id)
    }
  }, [state])

  return (
    <form action={action} className="space-y-3">
      <div className="flex gap-3">
        <input
          ref={emailRef}
          name="email"
          type="email"
          placeholder={t('invitePlaceholder')}
          className="flex-1 px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white
            focus:outline-none focus:border-emerald-400 transition placeholder:text-slate-300"
        />
        <select
          name="role"
          className="px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white
            focus:outline-none focus:border-emerald-400 transition text-slate-700 cursor-pointer"
        >
          <option value="member">{t('roleMember')}</option>
          <option value="admin">{t('roleAdmin')}</option>
          <option value="viewer">{t('roleViewer')}</option>
        </select>
        <button
          type="submit"
          disabled={pending}
          className="px-4 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-xl
            hover:bg-slate-700 transition disabled:opacity-50 shrink-0"
        >
          {pending ? t('inviting') : t('invite')}
        </button>
      </div>
      {state?.error && (
        <p className="text-xs text-red-500">{state.error}</p>
      )}
      {showSuccess && state?.success && (
        <p className="text-xs text-emerald-600">{t('inviteSuccess')}</p>
      )}
    </form>
  )
}
