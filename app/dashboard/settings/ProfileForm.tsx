'use client'

import { useActionState, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { updateProfile, uploadAvatar } from './actions'

const COUNTRIES = [
  'United States', 'Canada', 'Mexico', 'Argentina', 'Brazil', 'Chile', 'Colombia',
  'United Kingdom', 'Spain', 'France', 'Germany', 'Italy', 'Portugal', 'Netherlands',
  'Australia', 'New Zealand', 'India', 'Japan', 'Singapore', 'Other',
]

interface Props {
  firstName: string
  lastName: string
  email: string
  company: string
  country: string
  avatarUrl: string | null
}

export default function ProfileForm({ firstName, lastName, email, company, country, avatarUrl }: Props) {
  const t = useTranslations('dashboard.settings')
  const [state, action, pending] = useActionState(updateProfile, null)
  const [avatarState, avatarAction, avatarPending] = useActionState(uploadAvatar, null)
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(avatarUrl)

  function onAvatarPicked(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setPreviewUrl(URL.createObjectURL(f))
    formRef.current?.requestSubmit()
  }

  const initials = `${(firstName?.[0] ?? '')}${(lastName?.[0] ?? '')}`.toUpperCase() || '👤'

  return (
    <div className="space-y-6">
      <form action={avatarAction} ref={formRef}>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            className="relative w-20 h-20 rounded-full bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center text-2xl font-bold text-white overflow-hidden hover:opacity-90 transition shrink-0 ring-2 ring-white ring-offset-2 ring-offset-slate-50"
            aria-label="Change profile photo"
          >
            {previewUrl ? (
              <Image src={previewUrl} alt="Profile" fill className="object-cover" sizes="80px" unoptimized />
            ) : (
              <span>{initials}</span>
            )}
            <span className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition flex items-center justify-center text-xs font-semibold text-white">
              Change
            </span>
          </button>
          <input
            ref={avatarInputRef}
            type="file"
            name="avatar"
            accept="image/*"
            onChange={onAvatarPicked}
            className="hidden"
          />
          <div>
            <p className="text-sm font-medium text-slate-700">Profile photo</p>
            <p className="text-xs text-slate-400 mt-0.5">JPG, PNG or WebP. Up to 4 MB.</p>
            {avatarPending && <p className="text-xs text-slate-500 mt-1">Uploading…</p>}
            {avatarState?.success && <p className="text-xs text-emerald-600 mt-1">Saved ✓</p>}
            {avatarState?.error && <p className="text-xs text-red-500 mt-1">{avatarState.error}</p>}
          </div>
        </div>
      </form>

      <form action={action} className="space-y-4 pt-4 border-t border-slate-100">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">{t('firstName')}</label>
            <input
              name="firstName"
              defaultValue={firstName}
              autoComplete="given-name"
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-emerald-400 transition"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">{t('lastName')}</label>
            <input
              name="lastName"
              defaultValue={lastName}
              autoComplete="family-name"
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-emerald-400 transition"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Company</label>
          <input
            name="company"
            defaultValue={company}
            placeholder="Acme Inc."
            className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-emerald-400 transition"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Country</label>
          <select
            name="country"
            defaultValue={country}
            className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-emerald-400 transition text-slate-700 cursor-pointer"
          >
            <option value="">— Select country —</option>
            {COUNTRIES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">{t('emailLabel')}</label>
          <input
            type="email"
            value={email}
            disabled
            className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 text-slate-400 cursor-not-allowed"
          />
          <p className="text-xs text-slate-400 mt-1.5">{t('emailHint')}</p>
        </div>

        <div className="flex items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={pending}
            className="px-4 py-2 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-700 transition disabled:opacity-50"
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
    </div>
  )
}
