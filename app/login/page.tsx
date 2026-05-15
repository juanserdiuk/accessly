'use client'
import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'

function LoginForm() {
  const t = useTranslations('auth')
  const tl = useTranslations('auth.login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [resetState, setResetState] = useState<'idle' | 'sending' | 'sent'>('idle')
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    if (searchParams.get('error') === 'auth') {
      setErrors({ form: t('oauthFailed') })
    }
  }, [searchParams, t])

  function validate() {
    const e: Record<string, string> = {}
    if (!email.includes('@')) e.email = t('invalidEmail')
    if (!password) e.password = tl('passwordRequired')
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleForgotPassword() {
    if (!email.includes('@')) {
      setErrors({ email: t('invalidEmail') })
      return
    }
    setErrors({})
    setResetState('sending')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset`,
    })
    if (error) {
      setResetState('idle')
      setErrors({ reset: error.message })
      return
    }
    setResetState('sent')
  }

  async function handleSubmit() {
    if (!validate()) return
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      setErrors({ password: error.message })
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex w-[420px] shrink-0 bg-slate-900 flex-col p-10 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_10%_110%,rgba(0,212,170,0.2),transparent)] pointer-events-none" />
        <Link href="/" className="flex items-center gap-2 font-serif text-xl text-white mb-14">
          <div className="w-8 h-8 bg-emerald-400 rounded-lg flex items-center justify-center">
            <span className="text-slate-900 text-sm font-bold">A</span>
          </div>
          Accessly
        </Link>
        <h2 className="font-serif text-4xl text-white leading-tight mb-4">
          {tl('panelHeadline')}
        </h2>
        <p className="text-white/50 font-light leading-relaxed">
          {tl('panelSub')}
        </p>
        <div className="mt-auto">
          <div className="flex mb-3">
            {['JR','SK','ML','TP'].map((av, i) => (
              <div key={av} className="w-8 h-8 rounded-full border-2 border-slate-900 flex items-center justify-center text-xs font-semibold text-white -mr-2"
                style={{ background: ['#7c3aed','#0891b2','#be185d','#15803d'][i] }}>
                {av}
              </div>
            ))}
          </div>
          <p className="text-xs text-white/40">
            <span className="text-white/70 font-medium">{t('trustedByPrefix')}</span> {t('trustedBy')}
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6 bg-slate-50">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-10 shadow-xl">
          <h1 className="font-serif text-2xl text-slate-900 mb-1">{tl('title')}</h1>
          <p className="text-sm text-slate-500 mb-7">
            {tl('noAccount')} <Link href="/signup" className="text-emerald-600 font-medium hover:underline">{tl('createOne')}</Link>
          </p>

          <div className="mb-4">
            <label htmlFor="login-email" className="block text-sm font-medium text-slate-700 mb-1.5">{tl('emailLabel')}</label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: '' })) }}
              placeholder={tl('emailPlaceholder')}
              aria-invalid={errors.email ? true : undefined}
              aria-describedby={errors.email ? 'login-email-error' : undefined}
              className={`w-full px-4 py-3 border rounded-xl text-sm bg-slate-50 focus:outline-none focus:border-emerald-400 focus-visible:ring-2 focus-visible:ring-emerald-400 transition ${errors.email ? 'border-red-400' : 'border-slate-200'}`}
            />
            {errors.email && <p id="login-email-error" role="alert" className="text-xs text-red-500 mt-1">{errors.email}</p>}
          </div>

          <div className="mb-2">
            <label htmlFor="login-password" className="block text-sm font-medium text-slate-700 mb-1.5">{tl('passwordLabel')}</label>
            <div className="relative">
              <input
                id="login-password"
                type={showPass ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: '' })) }}
                placeholder={tl('passwordPlaceholder')}
                aria-invalid={errors.password ? true : undefined}
                aria-describedby={errors.password ? 'login-password-error' : undefined}
                className={`w-full px-4 py-3 pr-16 border rounded-xl text-sm bg-slate-50 focus:outline-none focus:border-emerald-400 focus-visible:ring-2 focus-visible:ring-emerald-400 transition ${errors.password ? 'border-red-400' : 'border-slate-200'}`}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                aria-label={showPass ? t('hide') : t('show')}
                aria-pressed={showPass}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-10 min-w-[44px] px-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 text-xs font-medium rounded-lg transition"
              >
                {showPass ? t('hide') : t('show')}
              </button>
            </div>
            {errors.password && <p id="login-password-error" role="alert" className="text-xs text-red-500 mt-1">{errors.password}</p>}
          </div>

          <div className="flex justify-end mb-3">
            <button
              type="button"
              onClick={handleForgotPassword}
              disabled={resetState !== 'idle'}
              className="min-h-[44px] -mr-2 px-3 text-xs text-emerald-600 font-medium hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 rounded-lg disabled:opacity-60"
            >
              {resetState === 'sending' ? tl('forgotSending') : tl('forgotPassword')}
            </button>
          </div>
          {resetState === 'sent' && (
            <p role="status" className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2 mb-3">
              {tl('forgotSent')}
            </p>
          )}
          {errors.reset && (
            <p role="alert" className="text-xs text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-3">
              {errors.reset}
            </p>
          )}

          <button onClick={handleSubmit} disabled={loading}
            className="w-full bg-slate-900 text-white font-semibold py-3.5 rounded-xl hover:bg-slate-700 transition disabled:opacity-60 flex items-center justify-center gap-2">
            {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
            {loading ? tl('submitLoading') : tl('submit')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}