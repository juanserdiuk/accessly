'use client'

import { useActionState } from 'react'
import { useTranslations } from 'next-intl'
import { updateProfile } from './actions'

function Field({
  label, name, type = 'text', defaultValue = '', disabled = false, autoComplete,
}: {
  label: string
  name: string
  type?: string
  defaultValue?: string
  disabled?: boolean
  autoComplete?: string
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-slate-600">{label}</label>
      <input
        type={type}
        name={name}
        defaultValue={defaultValue}
        disabled={disabled}
        autoComplete={autoComplete}
        className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white
          focus:outline-none focus:border-emerald-400 transition
          disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
      />
    </div>
  )
}

interface Props {
  firstName: string
  lastName: string
  email: string
}

export default function ProfileForm({ firstName, lastName, email }: Props) {
  const t = useTranslations('dashboard.settings')
  const [state, action, pending] = useActionState(updateProfile, null)

  return (
    <form action={action} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label={t('firstName')} name="firstName" defaultValue={firstName} autoComplete="given-name" />
        <Field label={t('lastName')}  name="lastName"  defaultValue={lastName}  autoComplete="family-name" />
      </div>
      <Field label={t('emailLabel')} name="email" type="email" defaultValue={email} disabled />
      <p className="text-xs text-slate-400">{t('emailHint')}</p>

      <div className="flex items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={pending}
          className="px-4 py-2 bg-slate-900 text-white text-sm font-semibold rounded-lg
            hover:bg-slate-700 transition disabled:opacity-50"
        >
          {pending ? t('saving') : t('save')}
        </button>
        {state?.success && (
          <span className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            {t('saved')}
          </span>
        )}
        {state?.error && (
          <span className="text-sm text-red-500">{state.error}</span>
        )}
      </div>
    </form>
  )
}
