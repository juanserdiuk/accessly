'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import PromoModal from './PromoModal'
import { createClient } from '@/lib/supabase/client'

/**
 * Encode the purchase intent we want to resume after signup as a single
 * URL-safe param. Format:
 *   subscription:pro:monthly[:CODE]
 *   pack:starter[:CODE]
 */
function encodeIntent(type: string, plan: string, billing?: string, code?: string | null): string {
  const parts: string[] = [type, plan]
  if (type === 'subscription') parts.push(billing ?? 'monthly')
  if (code) parts.push(code)
  return parts.join(':')
}

async function startCheckout(type: string, plan: string, billing?: string, promoCode?: string | null): Promise<string | null> {
  // ALL paid purchases now require an account. If the visitor isn't signed
  // in, route them through signup and resume the same purchase after they
  // verify their email and land on the dashboard.
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    const intent = encodeIntent(type, plan, billing, promoCode)
    const params = new URLSearchParams({ intent })
    window.location.href = `/signup?${params}`
    return null
  }

  // Signed-in flow — straight to Stripe.
  const res = await fetch('/api/stripe/create-checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, plan, billing, promoCode: promoCode ?? undefined }),
  })
  const data = await res.json().catch(() => ({}))

  if (data.url) {
    window.location.href = data.url
    return null
  }
  return data?.error ?? `Checkout failed (${res.status})`
}

export default function Pricing() {
  const t = useTranslations('pricing')
  const [annual, setAnnual] = useState(false)
  const [loadingKey, setLoadingKey] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [promoIntent, setPromoIntent] = useState<{ key: string; type: string; plan: string; billing?: string } | null>(null)

  const packs = [
    { name: t('packStarterName'), slug: 'starter',     pages: 10,  price: 9,  perPage: '0.90' },
    { name: t('packBasicName'),   slug: 'basic',        pages: 25,  price: 19, perPage: '0.76' },
    { name: t('packProName'),     slug: 'pro-pack',     pages: 50,  price: 29, perPage: '0.58', featured: true },
    { name: t('packAgencyName'), slug: 'agency-pack',  pages: 100, price: 49, perPage: '0.49' },
  ]

  // Annual total = monthly × 12 × 0.8 (20% discount applied to the full year)
  const annualTotal = (monthly: number) => Math.round(monthly * 12 * 0.8 * 100) / 100

  const plans = [
    {
      name: t('planFreeName'), slug: null, monthly: 0,
      desc: t('planFreeDesc'),
      features: [t('planFreeFeature1'), t('planFreeFeature2'), t('planFreeFeature3'), t('planFreeFeature4')],
      cta: t('planFreeCta'), href: '/signup?plan=free', featured: false,
    },
    {
      name: t('planProName'), slug: 'pro', monthly: 29,
      desc: t('planProDesc'),
      features: [t('planProFeature1'), t('planProFeature2'), t('planProFeature3'), t('planProFeature4'), t('planProFeature5'), t('planProFeature6')],
      cta: t('planProCta'), href: null, featured: true,
    },
    {
      name: t('planAgencyName'), slug: 'agency', monthly: 99,
      desc: t('planAgencyDesc'),
      features: [t('planAgencyFeature1'), t('planAgencyFeature2'), t('planAgencyFeature3'), t('planAgencyFeature4'), t('planAgencyFeature5'), t('planAgencyFeature6'), t('planAgencyFeature7')],
      cta: t('planAgencyCta'), href: null, featured: false,
    },
  ]

  function handleCheckout(key: string, type: string, plan: string, billing?: string) {
    // Show the promo modal first; PromoModal will call back with the code
    // (or null) and we'll actually start checkout from there.
    setError(null)
    setPromoIntent({ key, type, plan, billing })
  }

  async function continueWithCode(code: string | null) {
    if (!promoIntent) return
    const { key, type, plan, billing } = promoIntent
    setPromoIntent(null)
    setLoadingKey(key)
    try {
      const errMsg = await startCheckout(type, plan, billing, code)
      if (errMsg) setError(errMsg)
    } finally {
      setLoadingKey(null)
    }
  }

  const Spinner = () => (
    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin inline-block" />
  )

  return (
    <section id="pricing" className="py-20 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600 mb-3">{t('label')}</p>
          <h2 className="font-serif text-4xl text-slate-900 mb-3">{t('headline')}</h2>
          <p className="text-slate-500">{t('sub')}</p>
        </div>

        {/* One-time scan packs */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600 mb-2">{t('scanPacksLabel')}</p>
            <p className="text-slate-500 text-sm">{t('scanPacksSub')}</p>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
            {packs.map((pack) => {
              const key = `pack-${pack.slug}`
              const loading = loadingKey === key
              return (
                <div key={pack.name} className={`relative rounded-2xl border p-6 flex flex-col transition-all hover:-translate-y-1 hover:shadow-lg ${pack.featured ? 'bg-slate-900 border-slate-900' : 'bg-white border-slate-200'}`}>
                  {pack.featured && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-400 text-slate-900 text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">{t('bestValue')}</div>
                  )}
                  <div className={`text-xs font-semibold uppercase tracking-widest mb-3 ${pack.featured ? 'text-white/50' : 'text-slate-400'}`}>{pack.name}</div>
                  <div className="mb-1">
                    <span className={`font-serif text-4xl ${pack.featured ? 'text-white' : 'text-slate-900'}`}>${pack.price}</span>
                    <span className={`text-sm ml-1 ${pack.featured ? 'text-white/40' : 'text-slate-400'}`}>{t('oneTime')}</span>
                  </div>
                  <div className={`text-sm font-medium mb-1 ${pack.featured ? 'text-white/80' : 'text-slate-700'}`}>{pack.pages} {t('pages')}</div>
                  <div className={`text-xs mb-6 ${pack.featured ? 'text-white/40' : 'text-slate-400'}`}>${pack.perPage} {t('perPage')}</div>
                  <button
                    onClick={() => handleCheckout(key, 'pack', pack.slug)}
                    disabled={loading}
                    className={`mt-auto flex items-center justify-center gap-2 w-full py-2.5 rounded-xl font-semibold text-sm transition disabled:opacity-60 ${pack.featured ? 'bg-emerald-400 text-slate-900 hover:bg-emerald-300' : 'border border-slate-200 text-slate-800 hover:border-slate-400 hover:bg-slate-50'}`}
                  >
                    {loading ? <><Spinner /> {t('processing')}</> : t('buyNow')}
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        {/* Subscription plans */}
        <div className="flex items-center gap-4 mb-8">
          <div className="flex-1 h-px bg-slate-200" />
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 whitespace-nowrap">{t('orSubscribe')}</p>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        <div className="flex items-center justify-center gap-3 mb-10">
          <span className="text-sm font-medium text-slate-500 leading-none">{t('monthly')}</span>
          <button
            type="button"
            onClick={() => setAnnual(!annual)}
            role="switch"
            aria-checked={annual}
            aria-label="Bill annually (save 20%)"
            className={`relative w-12 h-6 rounded-full transition-colors shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 ${annual ? 'bg-emerald-400' : 'bg-slate-200'}`}
          >
            <span aria-hidden="true" className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${annual ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
          <span className="text-sm font-medium text-slate-500 leading-none">{t('annual')}</span>
          <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full leading-none">{t('save20')}</span>
        </div>

        {error && (
          <div role="alert" className="max-w-md mx-auto mb-6 flex items-start gap-2.5 text-xs text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
            <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500 shrink-0 mt-0.5">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {error}
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-5 items-center">
          {plans.map((plan) => {
            const key = `plan-${plan.slug}-${annual ? 'annual' : 'monthly'}`
            const loading = loadingKey === key
            return (
              <div key={plan.name} className={`rounded-2xl p-7 border relative transition-all hover:-translate-y-1 hover:shadow-xl ${plan.featured ? 'bg-slate-900 border-slate-900 scale-105' : 'bg-white border-slate-200'}`}>
                {plan.featured && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-400 text-slate-900 text-xs font-bold px-4 py-1 rounded-full">{t('mostPopular')}</div>}
                <div className={`text-xs font-semibold uppercase tracking-widest mb-3 ${plan.featured ? 'text-white/50' : 'text-slate-400'}`}>{plan.name}</div>
                <div className="mb-2">
                  <span className={`font-serif text-5xl ${plan.featured ? 'text-white' : 'text-slate-900'}`}>
                    ${annual ? annualTotal(plan.monthly) : plan.monthly}
                  </span>
                  <span className={`text-sm ${plan.featured ? 'text-white/40' : 'text-slate-400'}`}>
                    {annual ? t('perYear') : t('perMonth')}
                  </span>
                </div>
                <p className={`text-sm mb-6 leading-relaxed ${plan.featured ? 'text-white/60' : 'text-slate-500'}`}>{plan.desc}</p>
                <ul className="space-y-2.5 mb-7">
                  {plan.features.map(f => (
                    <li key={f} className={`flex items-center gap-2.5 text-sm ${plan.featured ? 'text-white/80' : 'text-slate-600'}`}>
                      <span className={plan.featured ? 'text-emerald-400' : 'text-green-500'}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                {plan.href ? (
                  <Link href={plan.href} className={`block text-center py-3 rounded-xl font-semibold text-sm transition ${plan.featured ? 'bg-emerald-400 text-slate-900 hover:bg-emerald-300' : 'border border-slate-200 text-slate-800 hover:border-slate-400 hover:bg-slate-50'}`}>
                    {plan.cta}
                  </Link>
                ) : (
                  <button
                    onClick={() => handleCheckout(key, 'subscription', plan.slug!, annual ? 'annual' : 'monthly')}
                    disabled={loading}
                    className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-sm transition disabled:opacity-60 ${plan.featured ? 'bg-emerald-400 text-slate-900 hover:bg-emerald-300' : 'border border-slate-200 text-slate-800 hover:border-slate-400 hover:bg-slate-50'}`}
                  >
                    {loading ? <><Spinner /> {t('processing')}</> : plan.cta}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <PromoModal
        open={promoIntent !== null}
        onClose={() => setPromoIntent(null)}
        onContinue={continueWithCode}
      />
    </section>
  )
}
