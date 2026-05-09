'use client'
import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'

function getStrength(pw: string) {
  let s = 0
  if (pw.length >= 8) s++
  if (/[A-Z]/.test(pw)) s++
  if (/[0-9]/.test(pw)) s++
  if (/[^A-Za-z0-9]/.test(pw)) s++
  return s
}

function ResetForm() {
  const t = useTranslations('auth.reset')
  const ts = useTranslations('auth.signup')
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [phase, setPhase] = useState<'verifying' | 'ready' | 'invalid' | 'saving' | 'done'>('verifying')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')

  // Exchange the recovery code in the URL for a session, then let the user
  // set a new password.
  useEffect(() => {
    const code = searchParams.get('code')
    if (!code) {
      setPhase('invalid')
      return
    }
    supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      setPhase(error ? 'invalid' : 'ready')
      if (error) setError(error.message)
    })
  }, [searchParams, supabase])

  const strength = getStrength(password)
  const strengthLabel = ['', ts('strengthWeak'), ts('strengthFair'), ts('strengthGood'), ts('strengthStrong')][strength]
  const strengthColor = ['', 'bg-red-400', 'bg-amber-400', 'bg-emerald-400', 'bg-green-500'][strength]

  async function handleSubmit() {
    setError('')
    if (password.length < 8) {
      setError(ts('passwordTooShort'))
      return
    }
    if (password !== confirm) {
      setError(t('mismatch'))
      return
    }
    setPhase('saving')
    const { error: updateError } = await supabase.auth.updateUser({ password })
    if (updateError) {
      setError(updateError.message)
      setPhase('ready')
      return
    }
    // Sign out so the recovery session doesn't persist as a regular login.
    await supabase.auth.signOut()
    setPhase('done')
    setTimeout(() => router.push('/login?reset=success'), 1500)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-10 shadow-xl">

        <Link href="/" className="flex items-center gap-2 mb-6">
          <div className="w-7 h-7 bg-emerald-400 rounded-lg flex items-center justify-center">
            <span className="text-slate-900 text-xs font-bold">A</span>
          </div>
          <span className="font-serif text-lg text-slate-900">Accessly</span>
        </Link>

        {phase === 'verifying' && (
          <div className="flex flex-col items-center text-center py-6">
            <span className="w-6 h-6 border-2 border-slate-200 border-t-emerald-500 rounded-full animate-spin mb-3" />
            <p className="text-sm text-slate-500">{t('verifying')}</p>
          </div>
        )}

        {phase === 'invalid' && (
          <div className="text-center py-4">
            <h1 className="font-serif text-2xl text-slate-900 mb-2">{t('invalidTitle')}</h1>
            <p className="text-sm text-slate-500 mb-6">{error || t('invalidSub')}</p>
            <Link
              href="/login"
              className="inline-block bg-slate-900 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-slate-700 transition text-sm"
            >
              {t('backToLogin')}
            </Link>
          </div>
        )}

        {phase === 'done' && (
          <div className="text-center py-4">
            <div className="w-12 h-12 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h1 className="font-serif text-2xl text-slate-900 mb-2">{t('doneTitle')}</h1>
            <p className="text-sm text-slate-500">{t('doneSub')}</p>
          </div>
        )}

        {(phase === 'ready' || phase === 'saving') && (
          <>
            <h1 className="font-serif text-2xl text-slate-900 mb-1">{t('title')}</h1>
            <p className="text-sm text-slate-500 mb-7">{t('sub')}</p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('newPassword')}</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError('') }}
                  placeholder={ts('passwordPlaceholder')}
                  autoComplete="new-password"
                  className="w-full px-4 py-3 pr-11 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:border-emerald-400 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-medium"
                >
                  {showPass ? t('hide') : t('show')}
                </button>
              </div>
              {password.length > 0 && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className={`flex-1 h-1 rounded-full transition-all ${i <= strength ? strengthColor : 'bg-slate-100'}`} />
                    ))}
                  </div>
                  <p className="text-xs text-slate-400">{strengthLabel}</p>
                </div>
              )}
            </div>

            <div className="mb-5">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('confirmPassword')}</label>
              <input
                type={showPass ? 'text' : 'password'}
                value={confirm}
                onChange={e => { setConfirm(e.target.value); setError('') }}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                autoComplete="new-password"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:border-emerald-400 transition"
              />
            </div>

            {error && (
              <p className="text-xs text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">
                {error}
              </p>
            )}

            <button
              onClick={handleSubmit}
              disabled={phase === 'saving'}
              className="w-full bg-slate-900 text-white font-semibold py-3.5 rounded-xl hover:bg-slate-700 transition disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {phase === 'saving' && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {phase === 'saving' ? t('saving') : t('submit')}
            </button>
          </>
        )}

      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetForm />
    </Suspense>
  )
}
