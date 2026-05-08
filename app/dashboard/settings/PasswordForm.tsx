'use client'

import { useActionState } from 'react'
import { useTranslations } from 'next-intl'
import { updatePassword } from './actions'

function Field({
  label, name, autoComplete,
}: {
  label: string
  name: string
  autoComplete?: string
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-slate-600">{label}</label>
      <input
        type="password"
        name={name}
        autoComplete={autoComplete}
        className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white
          focus:outline-none focus:border-emerald-400 transition"
      />
    </div>
  )
}

export default function PasswordForm() {
  const t = useTranslations('dashboard.settings')
  const [state, action, pending] = useActionState(updatePassword, null)

  return (
    <form action={action} className="space-y-4">
      <Field label={t('newPassword')}      name="password" autoComplete="new-password" />
      <Field label={t('confirmPassword')}  name="confirm"  autoComplete="new-password" />

      <div className="flex items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={pending}
          className="px-4 py-2 bg-slate-900 text-white text-sm font-semibold rounded-lg
            hover:bg-slate-700 transition disabled:opacity-50"
        >
          {pending ? t('updating') : t('updatePassword')}
        </button>
        {state?.success && (
          <span className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            {t('passwordUpdated')}
          </span>
        )}
        {state?.error && (
          <span className="text-sm text-red-500">{state.error}</span>
        )}
      </div>
    </form>
  )
}
