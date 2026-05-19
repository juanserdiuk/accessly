'use client'

import { useState } from 'react'

interface Plan {
  slug: 'free' | 'pro' | 'agency'
  name: string
  tagline: string
  monthly: number
  features: string[]
  cta: string
  highlight: boolean
}

const PLANS: Plan[] = [
  {
    slug: 'free',
    name: 'Free',
    tagline: 'Test the waters with full WCAG audits.',
    monthly: 0,
    features: [
      '3 scans per month',
      'Full WCAG 2.2 reports',
      '1 user · 1 site',
      'PDF + HTML export',
      'Community support',
    ],
    cta: 'Current plan',
    highlight: false,
  },
  {
    slug: 'pro',
    name: 'Pro',
    tagline: 'For consultants and small teams shipping accessible sites.',
    monthly: 29,
    features: [
      'Unlimited scans',
      'Scheduled monitoring (daily / weekly)',
      'Regression alerts via email',
      'API access + CI/CD integration',
      '3 team seats · 10 sites',
      'Priority email support',
    ],
    cta: 'Upgrade to Pro',
    highlight: true,
  },
  {
    slug: 'agency',
    name: 'Agency',
    tagline: 'White-label, portfolios, and unlimited everything.',
    monthly: 99,
    features: [
      'Everything in Pro',
      'White-label PDF reports',
      'Client portfolios',
      'Salesperson commission tracking',
      'Unlimited team seats · sites',
      'Dedicated Slack channel',
      'Onboarding call with our team',
    ],
    cta: 'Upgrade to Agency',
    highlight: false,
  },
]

interface Props {
  currentPlan: 'free' | 'pps' | 'pro' | 'agency'
  hasStripeCustomer: boolean
}

const SCAN_PACKS = [
  { slug: 'starter',     pages: 10,  price: 9,  perPage: '0.90' },
  { slug: 'basic',       pages: 25,  price: 19, perPage: '0.76' },
  { slug: 'pro-pack',    pages: 50,  price: 29, perPage: '0.58', featured: true },
  { slug: 'agency-pack', pages: 100, price: 49, perPage: '0.49' },
] as const

export default function UpgradePlans({ currentPlan, hasStripeCustomer }: Props) {
  const [annual, setAnnual] = useState(false)
  const [loadingKey, setLoadingKey] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const annualTotal = (monthly: number) => Math.round(monthly * 12 * 0.8)

  async function checkout(slug: 'pro' | 'agency') {
    setError(null)
    setLoadingKey(slug)
    try {
      const res = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'subscription',
          plan: slug,
          billing: annual ? 'annual' : 'monthly',
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (data.url) {
        window.location.href = data.url
        return
      }
      setError(data.error ?? `Checkout failed (${res.status})`)
    } catch {
      setError('Network error — please retry.')
    } finally {
      setLoadingKey(null)
    }
  }

  async function buyPack(slug: string) {
    setError(null)
    setLoadingKey(`pack-${slug}`)
    try {
      const res = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'pack', plan: slug }),
      })
      const data = await res.json().catch(() => ({}))
      if (data.url) {
        window.location.href = data.url
        return
      }
      setError(data.error ?? `Checkout failed (${res.status})`)
    } catch {
      setError('Network error — please retry.')
    } finally {
      setLoadingKey(null)
    }
  }

  async function openPortal() {
    setError(null)
    setLoadingKey('portal')
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (data.url) {
        window.location.href = data.url
        return
      }
      setError(data.error ?? 'Could not open billing portal')
    } catch {
      setError('Network error — please retry.')
    } finally {
      setLoadingKey(null)
    }
  }

  return (
    <div className="space-y-10">
      {/* Annual / Monthly toggle */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => setAnnual(false)}
          className={`text-sm font-medium transition ${annual ? 'text-slate-400' : 'text-slate-900'}`}
        >
          Monthly
        </button>
        <button
          onClick={() => setAnnual(!annual)}
          aria-label="Toggle annual billing"
          className={`relative w-14 h-7 rounded-full transition-colors shrink-0 ${annual ? 'bg-emerald-500' : 'bg-slate-200'}`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform duration-200 ${
              annual ? 'translate-x-7' : 'translate-x-0'
            }`}
          />
        </button>
        <button
          onClick={() => setAnnual(true)}
          className={`text-sm font-medium transition flex items-center gap-2 ${annual ? 'text-slate-900' : 'text-slate-400'}`}
        >
          Annual
          <span className="text-[10px] font-bold uppercase tracking-widest bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
            Save 20%
          </span>
        </button>
      </div>

      {error && (
        <div className="max-w-md mx-auto flex items-start gap-2.5 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500 shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {error}
        </div>
      )}

      {/* Pricing cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6 items-stretch">
        {PLANS.map((plan) => {
          const isCurrent = currentPlan === plan.slug
          const isDowngrade =
            (currentPlan === 'agency' && plan.slug !== 'agency') ||
            (currentPlan === 'pro' && plan.slug === 'free') ||
            (currentPlan === 'pps' && plan.slug === 'free')
          const loading = loadingKey === plan.slug
          const price = annual ? annualTotal(plan.monthly) : plan.monthly
          const period = annual ? 'per year' : 'per month'

          return (
            <div
              key={plan.slug}
              className={`relative rounded-3xl p-8 flex flex-col transition-all ${
                plan.highlight
                  ? 'bg-slate-900 border-2 border-emerald-400/30 text-white shadow-2xl shadow-emerald-500/10 md:-translate-y-2 md:scale-[1.02]'
                  : 'bg-white border border-slate-200 text-slate-900 hover:border-slate-300 hover:shadow-lg'
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 bg-emerald-400 text-slate-900 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 bg-slate-900 rounded-full animate-pulse" />
                  Most popular
                </div>
              )}

              {isCurrent && (
                <div className={`absolute top-4 right-4 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                  plan.highlight ? 'bg-white/15 text-white border border-white/20' : 'bg-slate-100 text-slate-600 border border-slate-200'
                }`}>
                  Current
                </div>
              )}

              <div className="mb-5">
                <h3 className={`font-serif text-3xl mb-1 ${plan.highlight ? 'text-white' : 'text-slate-900'}`}>
                  {plan.name}
                </h3>
                <p className={`text-sm leading-relaxed ${plan.highlight ? 'text-white/60' : 'text-slate-500'}`}>
                  {plan.tagline}
                </p>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-1.5">
                  <span className={`font-serif text-5xl ${plan.highlight ? 'text-white' : 'text-slate-900'}`}>
                    ${price}
                  </span>
                  {plan.monthly > 0 && (
                    <span className={`text-sm ${plan.highlight ? 'text-white/40' : 'text-slate-400'}`}>
                      {period}
                    </span>
                  )}
                </div>
                {annual && plan.monthly > 0 && (
                  <p className={`text-xs mt-1 ${plan.highlight ? 'text-emerald-300' : 'text-emerald-600'}`}>
                    Save ${plan.monthly * 12 - price}/yr vs monthly
                  </p>
                )}
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className={`flex items-start gap-2.5 text-sm ${
                    plan.highlight ? 'text-white/85' : 'text-slate-600'
                  }`}>
                    <span className={`shrink-0 mt-0.5 ${plan.highlight ? 'text-emerald-400' : 'text-emerald-600'}`}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    </span>
                    <span className="leading-relaxed">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              {isCurrent ? (
                <button
                  disabled
                  className={`w-full text-center py-3 rounded-xl font-semibold text-sm transition cursor-default ${
                    plan.highlight
                      ? 'bg-white/10 text-white/50 border border-white/15'
                      : 'bg-slate-50 text-slate-400 border border-slate-200'
                  }`}
                >
                  Current plan
                </button>
              ) : plan.slug === 'free' ? (
                isDowngrade && hasStripeCustomer ? (
                  <button
                    onClick={openPortal}
                    disabled={loading || loadingKey === 'portal'}
                    className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm border border-slate-200 text-slate-700 hover:bg-slate-50 transition disabled:opacity-60"
                  >
                    {loadingKey === 'portal' ? (
                      <><Spinner /> Opening portal…</>
                    ) : (
                      'Downgrade via Stripe portal'
                    )}
                  </button>
                ) : (
                  <button
                    disabled
                    className="w-full text-center py-3 rounded-xl font-semibold text-sm bg-slate-50 text-slate-400 border border-slate-200 cursor-default"
                  >
                    Cancel anytime
                  </button>
                )
              ) : (
                <button
                  onClick={() => checkout(plan.slug as 'pro' | 'agency')}
                  disabled={loading || loadingKey !== null}
                  className={`w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition disabled:opacity-60 ${
                    plan.highlight
                      ? 'bg-emerald-400 text-slate-900 hover:bg-emerald-300 shadow-lg shadow-emerald-500/30'
                      : 'bg-slate-900 text-white hover:bg-slate-700'
                  }`}
                >
                  {loading ? (
                    <><Spinner /> Redirecting to Stripe…</>
                  ) : (
                    <>
                      {plan.cta}
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                      </svg>
                    </>
                  )}
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* OR pay per scan — alternative path for customers who don't want a subscription */}
      <div className="pt-6">
        <div className="relative flex items-center gap-4 mb-8">
          <div className="flex-1 h-px bg-slate-200" />
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 whitespace-nowrap">
            Or pay only when you need it
          </p>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        <div className="bg-gradient-to-br from-blue-50 via-white to-cyan-50/50 border border-blue-100 rounded-3xl p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                Pay per scan
              </div>
              <h3 className="font-serif text-2xl text-slate-900 mb-1">
                Buy scan packs — no subscription
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed max-w-xl">
                One-time purchase. Credits never expire. You unlock portfolios, white-label reports, and salesperson tracking — everything except scheduled monitoring.
                {currentPlan === 'pps' && ' Top up below.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {SCAN_PACKS.map((pack) => {
              const key = `pack-${pack.slug}`
              const loading = loadingKey === key
              const featured = 'featured' in pack && pack.featured
              return (
                <div
                  key={pack.slug}
                  className={`relative rounded-2xl p-5 flex flex-col transition-all hover:-translate-y-0.5 hover:shadow-md ${
                    featured
                      ? 'bg-slate-900 border-2 border-blue-400/40 text-white'
                      : 'bg-white border border-slate-200'
                  }`}
                >
                  {featured && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-blue-400 text-slate-900 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full whitespace-nowrap">
                      Best value
                    </div>
                  )}
                  <p className={`text-[10px] font-semibold uppercase tracking-widest mb-2 ${featured ? 'text-white/50' : 'text-slate-400'}`}>
                    {pack.pages} pages
                  </p>
                  <div className="mb-1">
                    <span className={`font-serif text-3xl ${featured ? 'text-white' : 'text-slate-900'}`}>${pack.price}</span>
                    <span className={`text-xs ml-1 ${featured ? 'text-white/40' : 'text-slate-400'}`}>one-time</span>
                  </div>
                  <p className={`text-[10px] mb-4 ${featured ? 'text-white/50' : 'text-slate-400'}`}>
                    ${pack.perPage} / page
                  </p>
                  <button
                    onClick={() => buyPack(pack.slug)}
                    disabled={loading || loadingKey !== null}
                    className={`mt-auto inline-flex items-center justify-center gap-1.5 w-full py-2 rounded-lg font-semibold text-xs transition disabled:opacity-60 ${
                      featured
                        ? 'bg-blue-400 text-slate-900 hover:bg-blue-300'
                        : 'border border-slate-200 text-slate-800 hover:border-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    {loading ? (
                      <><Spinner /> …</>
                    ) : (
                      currentPlan === 'pps' ? 'Top up' : 'Buy pack'
                    )}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Manage subscription link for paying customers */}
      {hasStripeCustomer && currentPlan !== 'free' && (
        <div className="text-center">
          <button
            onClick={openPortal}
            disabled={loadingKey === 'portal'}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition underline-offset-4 hover:underline disabled:opacity-60"
          >
            {loadingKey === 'portal' ? 'Opening…' : 'Manage current subscription →'}
          </button>
        </div>
      )}
    </div>
  )
}

function Spinner() {
  return <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin inline-block" />
}
