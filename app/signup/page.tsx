'use client'
import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'

const plans = ['Free','Pro','Agency']
const prices: Record<string, string> = { Free: '$0/mo', Pro: '$29/mo', Agency: '$99/mo' }
const planParamMap: Record<string, string> = { pro: 'Pro', agency: 'Agency', free: 'Free' }

// Pretty labels + prices for the pending-purchase banner shown above the
// signup form when the visitor arrives mid-purchase from /#pricing.
const PACK_INFO: Record<string, { label: string; price: string; pages: number }> = {
  starter:       { label: 'Starter Scan Pack',  price: '$9',  pages: 10 },
  basic:         { label: 'Basic Scan Pack',    price: '$19', pages: 25 },
  'pro-pack':    { label: 'Pro Scan Pack',      price: '$29', pages: 50 },
  'agency-pack': { label: 'Agency Scan Pack',   price: '$49', pages: 100 },
}
const SUB_INFO: Record<string, { label: string; monthly: number }> = {
  pro:    { label: 'Pro plan',    monthly: 29 },
  agency: { label: 'Agency plan', monthly: 99 },
}

interface ParsedIntent {
  type: 'pack' | 'subscription'
  plan: string
  billing?: 'monthly' | 'annual'
  code?: string
  label: string
  priceLabel: string
}

function parseIntent(raw: string | null): ParsedIntent | null {
  if (!raw) return null
  const parts = raw.split(':')
  const [type, plan, ...rest] = parts
  if (type !== 'pack' && type !== 'subscription') return null

  if (type === 'pack') {
    const info = PACK_INFO[plan]
    if (!info) return null
    const code = rest[0]
    return {
      type: 'pack',
      plan,
      code: code || undefined,
      label: info.label,
      priceLabel: `${info.price} · ${info.pages} pages`,
    }
  }
  // subscription
  const info = SUB_INFO[plan]
  if (!info) return null
  const billing = rest[0] === 'annual' ? 'annual' : 'monthly'
  const code = rest[1]
  const yearly = Math.round(info.monthly * 12 * 0.8)
  return {
    type: 'subscription',
    plan,
    billing,
    code: code || undefined,
    label: info.label,
    priceLabel: billing === 'annual'
      ? `$${yearly} / yr (save 20%)`
      : `$${info.monthly} / month`,
  }
}

function getStrength(pw: string) {
  let s = 0
  if (pw.length >= 8) s++
  if (/[A-Z]/.test(pw)) s++
  if (/[0-9]/.test(pw)) s++
  if (/[^A-Za-z0-9]/.test(pw)) s++
  return s
}

function SignupForm() {
  const t = useTranslations('auth')
  const ts = useTranslations('auth.signup')
  const searchParams = useSearchParams()
  // Preselect plan + remember billing cadence when arriving from Pricing.
  const planParam = (searchParams.get('plan') ?? '').toLowerCase()
  const billingParam = searchParams.get('billing') === 'annual' ? 'annual' : 'monthly'
  const initialPlan = planParamMap[planParam] ?? 'Pro'
  // Encoded purchase intent from /#pricing (new unified flow). Tells us what
  // the visitor wanted to buy so we can resume the purchase after they
  // verify their email and land on the dashboard.
  const intent = parseIntent(searchParams.get('intent'))
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' })
  const [plan, setPlan] = useState(initialPlan)
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const supabase = createClient()

  const strength = getStrength(form.password)
  const strengthLabel = ['', ts('strengthWeak'), ts('strengthFair'), ts('strengthGood'), ts('strengthStrong')][strength]
  const strengthColor = ['', 'bg-red-400', 'bg-amber-400', 'bg-emerald-400', 'bg-green-500'][strength]

  function update(k: string, v: string) {
    setForm(p => ({ ...p, [k]: v }))
    setErrors(p => ({ ...p, [k]: '' }))
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!form.firstName) e.firstName = ts('required')
    if (!form.lastName) e.lastName = ts('required')
    if (!form.email.includes('@')) e.email = t('invalidEmail')
    if (form.password.length < 8) e.password = ts('passwordTooShort')
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit() {
    if (!validate()) return
    setLoading(true)
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin

    // After email verification we always drop the user on the dashboard.
    // If they had a pending purchase intent, it's saved into user_metadata
    // below and the dashboard will render a "Continue your purchase" banner.
    const callbackNext = '/dashboard'
    const emailRedirectTo = `${siteUrl}/auth/callback?next=${encodeURIComponent(callbackNext)}`

    const pendingIntent = intent
      ? {
          type: intent.type,
          plan: intent.plan,
          billing: intent.billing,
          code: intent.code,
        }
      : null

    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo,
        data: {
          first_name: form.firstName,
          last_name: form.lastName,
          plan,
          ...(pendingIntent ? { pending_intent: pendingIntent } : {}),
        },
      },
    })
    setLoading(false)
    if (error) {
      setErrors({ email: error.message })
      return
    }
    // Fire-and-forget — welcome email is best-effort, never block the UI
    fetch('/api/send-welcome', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: form.email, firstName: form.firstName }),
    }).catch(() => {})

    // If the project has email confirmation disabled, signUp returns a
    // session immediately — go straight to the dashboard, banner will fire.
    if (data.session) {
      window.location.href = callbackNext
      return
    }
    setDone(true)
  }

  if (done) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="bg-white border border-slate-200 rounded-2xl p-10 max-w-sm w-full text-center shadow-xl">
        <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-5">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2 className="font-serif text-2xl text-slate-900 mb-2">{ts('successTitle')}</h2>
        <p className="text-sm text-slate-500 mb-6">{ts('successSub')} <strong>{form.email}</strong></p>
        <Link href="/login" className="block bg-emerald-400 text-slate-900 font-semibold py-3 rounded-xl hover:bg-emerald-300 transition text-sm">
          {ts('successCta')}
        </Link>
      </div>
    </div>
  )

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
          {ts('panelHeadlineLine1')}<br />{ts('panelHeadlineLine2')}<br /><em className="text-emerald-400 not-italic">{ts('panelHeadlineHighlight')}</em>
        </h2>
        <p className="text-white/50 font-light leading-relaxed mb-8">
          {ts('panelSub')}
        </p>
        <div className="space-y-3">
          {[ts('perk1'), ts('perk2'), ts('perk3')].map(item => (
            <div key={item} className="flex items-center gap-3 text-sm text-white/70">
              <span className="text-emerald-400 font-bold">✓</span>
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-10 bg-slate-50">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-10 shadow-xl">
          {/* Pending purchase banner — shown when the visitor arrived from /#pricing */}
          {intent && (
            <div className="mb-6 -mx-2 px-4 py-3.5 bg-gradient-to-br from-emerald-50 via-emerald-50/70 to-cyan-50 border border-emerald-200/70 rounded-xl">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-100 border border-emerald-200 flex items-center justify-center shrink-0">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-700">
                    <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold uppercase tracking-widest text-emerald-700 mb-0.5">Almost there</p>
                  <p className="text-sm font-semibold text-slate-900 truncate">{intent.label}</p>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {intent.priceLabel}
                    {intent.code && (
                      <> · code <code className="font-mono text-emerald-700">{intent.code}</code></>
                    )}
                  </p>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                    Create your account first — you&apos;ll be prompted to complete this purchase from your dashboard right after.
                  </p>
                </div>
              </div>
            </div>
          )}

          <h3 className="font-serif text-2xl text-slate-900 mb-1">{ts('title')}</h3>
          <p className="text-sm text-slate-500 mb-7">
            {ts('haveAccount')} <Link href="/login" className="text-emerald-600 font-medium hover:underline">{ts('signIn')}</Link>
          </p>

          <div className="grid grid-cols-2 gap-3 mb-4">
            {[
              ['firstName', ts('firstNameLabel'), ts('firstNamePlaceholder'), 'given-name'],
              ['lastName',  ts('lastNameLabel'),  ts('lastNamePlaceholder'),  'family-name'],
            ].map(([k, label, ph, autoComplete]) => (
              <div key={k}>
                <label htmlFor={`signup-${k}`} className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
                <input
                  id={`signup-${k}`}
                  type="text"
                  autoComplete={autoComplete}
                  value={form[k as keyof typeof form]}
                  onChange={e => update(k, e.target.value)}
                  placeholder={ph}
                  aria-invalid={errors[k] ? true : undefined}
                  aria-describedby={errors[k] ? `signup-${k}-error` : undefined}
                  className={`w-full px-3 py-3 border rounded-xl text-sm bg-slate-50 focus:outline-none focus:border-emerald-400 focus-visible:ring-2 focus-visible:ring-emerald-400 transition ${errors[k] ? 'border-red-400' : 'border-slate-200'}`}
                />
                {errors[k] && <p id={`signup-${k}-error`} role="alert" className="text-xs text-red-500 mt-1">{errors[k]}</p>}
              </div>
            ))}
          </div>

          <div className="mb-4">
            <label htmlFor="signup-email" className="block text-sm font-medium text-slate-700 mb-1.5">{ts('emailLabel')}</label>
            <input
              id="signup-email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={e => update('email', e.target.value)}
              placeholder={ts('emailPlaceholder')}
              aria-invalid={errors.email ? true : undefined}
              aria-describedby={errors.email ? 'signup-email-error' : undefined}
              className={`w-full px-4 py-3 border rounded-xl text-sm bg-slate-50 focus:outline-none focus:border-emerald-400 focus-visible:ring-2 focus-visible:ring-emerald-400 transition ${errors.email ? 'border-red-400' : 'border-slate-200'}`}
            />
            {errors.email && <p id="signup-email-error" role="alert" className="text-xs text-red-500 mt-1">{errors.email}</p>}
          </div>

          <div className="mb-4">
            <label htmlFor="signup-password" className="block text-sm font-medium text-slate-700 mb-1.5">{ts('passwordLabel')}</label>
            <div className="relative">
              <input
                id="signup-password"
                type={showPass ? 'text' : 'password'}
                autoComplete="new-password"
                value={form.password}
                onChange={e => update('password', e.target.value)}
                placeholder={ts('passwordPlaceholder')}
                aria-invalid={errors.password ? true : undefined}
                aria-describedby={errors.password ? 'signup-password-error' : undefined}
                className={`w-full px-4 py-3 pr-16 border rounded-xl text-sm bg-slate-50 focus:outline-none focus:border-emerald-400 focus-visible:ring-2 focus-visible:ring-emerald-400 transition ${errors.password ? 'border-red-400' : 'border-slate-200'}`}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                aria-label={showPass ? t('hide') : t('show')}
                aria-pressed={showPass}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-10 min-w-[44px] px-2 text-xs text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition"
              >
                {showPass ? t('hide') : t('show')}
              </button>
            </div>
            {errors.password && <p id="signup-password-error" role="alert" className="text-xs text-red-500 mt-1">{errors.password}</p>}
            {form.password.length > 0 && (
              <div className="mt-2">
                <div className="flex gap-1 mb-1">
                  {[1,2,3,4].map(i => (
                    <div key={i} className={`flex-1 h-1 rounded-full transition-all ${i <= strength ? strengthColor : 'bg-slate-100'}`} />
                  ))}
                </div>
                <p className="text-xs text-slate-400">{strengthLabel}</p>
              </div>
            )}
          </div>

          <div className="mb-5">
            <label className="block text-sm font-medium text-slate-700 mb-2">{ts('choosePlan')}</label>
            <div className="grid grid-cols-3 gap-2">
              {plans.map(p => (
                <button key={p} type="button" onClick={() => setPlan(p)}
                  className={`border rounded-xl py-2.5 text-center transition ${plan === p ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 hover:border-slate-300'}`}>
                  <div className={`text-sm font-semibold ${plan === p ? 'text-emerald-700' : 'text-slate-800'}`}>{p}</div>
                  <div className={`text-xs mt-0.5 ${plan === p ? 'text-emerald-500' : 'text-slate-400'}`}>{prices[p]}</div>
                </button>
              ))}
            </div>
          </div>

          <button onClick={handleSubmit} disabled={loading}
            className="w-full bg-slate-900 text-white font-semibold py-3.5 rounded-xl hover:bg-slate-700 transition disabled:opacity-60 flex items-center justify-center gap-2">
            {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
            {loading ? ts('submitLoading') : plan === 'Free' ? ts('submitFree') : ts('submitTrial', { plan })}
          </button>

          <p className="text-xs text-slate-400 text-center mt-4">
            {ts('termsPrefix')}{' '}
            <Link href="/terms" className="underline">{ts('termsLink')}</Link> {ts('and')}{' '}
            <Link href="/privacy" className="underline">{ts('privacyLink')}</Link>.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  )
}