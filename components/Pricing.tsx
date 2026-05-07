'use client'
import { useState } from 'react'
import Link from 'next/link'

const packs = [
  { name: 'Starter',     slug: 'starter',     pages: 10,  price: 9,  perPage: '0.90' },
  { name: 'Basic',       slug: 'basic',        pages: 25,  price: 19, perPage: '0.76' },
  { name: 'Pro Pack',    slug: 'pro-pack',     pages: 50,  price: 29, perPage: '0.58', featured: true },
  { name: 'Agency Pack', slug: 'agency-pack',  pages: 100, price: 49, perPage: '0.49' },
]

const plans = [
  {
    name: 'Free', slug: null, monthly: 0, annual: 0,
    desc: 'Perfect for individuals exploring accessibility basics.',
    features: ['5 scans per month','Top 5 issues per scan','WCAG 2.2 Level A checks','PDF export'],
    cta: 'Get started free', href: '/signup?plan=free', featured: false,
  },
  {
    name: 'Pro', slug: 'pro', monthly: 29, annual: 23,
    desc: 'For freelancers and small teams who take accessibility seriously.',
    features: ['Unlimited scans','Full issue reports','WCAG AA + AAA coverage','5 sites monitored','Scheduled scans','3 team members'],
    cta: 'Start Pro trial', href: null, featured: true,
  },
  {
    name: 'Agency', slug: 'agency', monthly: 99, annual: 79,
    desc: 'For agencies managing accessibility at scale.',
    features: ['Everything in Pro','Unlimited sites','API access','CI/CD integration','Unlimited team members','White-label reports'],
    cta: 'Get Agency plan', href: null, featured: false,
  },
]

async function startCheckout(type: string, plan: string, billing?: string) {
  const res = await fetch('/api/stripe/create-checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, plan, billing }),
  })
  const data = await res.json()
  if (data.url) window.location.href = data.url
}

export default function Pricing() {
  const [annual, setAnnual] = useState(false)
  const [loadingKey, setLoadingKey] = useState<string | null>(null)

  async function handleCheckout(key: string, type: string, plan: string, billing?: string) {
    setLoadingKey(key)
    try {
      await startCheckout(type, plan, billing)
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
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600 mb-3">Pricing</p>
          <h2 className="font-serif text-4xl text-slate-900 mb-3">Simple, transparent pricing</h2>
          <p className="text-slate-500">Pay once for a scan pack, or subscribe for ongoing monitoring.</p>
        </div>

        {/* One-time scan packs */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600 mb-2">One-time scan packs</p>
            <p className="text-slate-500 text-sm">No subscription. Buy a pack and use it whenever you need it.</p>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
            {packs.map((pack) => {
              const key = `pack-${pack.slug}`
              const loading = loadingKey === key
              return (
                <div key={pack.name} className={`relative rounded-2xl border p-6 flex flex-col transition-all hover:-translate-y-1 hover:shadow-lg ${pack.featured ? 'bg-slate-900 border-slate-900' : 'bg-white border-slate-200'}`}>
                  {pack.featured && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-400 text-slate-900 text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">Best value</div>
                  )}
                  <div className={`text-xs font-semibold uppercase tracking-widest mb-3 ${pack.featured ? 'text-white/50' : 'text-slate-400'}`}>{pack.name}</div>
                  <div className="mb-1">
                    <span className={`font-serif text-4xl ${pack.featured ? 'text-white' : 'text-slate-900'}`}>${pack.price}</span>
                    <span className={`text-sm ml-1 ${pack.featured ? 'text-white/40' : 'text-slate-400'}`}>one-time</span>
                  </div>
                  <div className={`text-sm font-medium mb-1 ${pack.featured ? 'text-white/80' : 'text-slate-700'}`}>{pack.pages} pages</div>
                  <div className={`text-xs mb-6 ${pack.featured ? 'text-white/40' : 'text-slate-400'}`}>${pack.perPage} per page</div>
                  <button
                    onClick={() => handleCheckout(key, 'pack', pack.slug)}
                    disabled={loading}
                    className={`mt-auto flex items-center justify-center gap-2 w-full py-2.5 rounded-xl font-semibold text-sm transition disabled:opacity-60 ${pack.featured ? 'bg-emerald-400 text-slate-900 hover:bg-emerald-300' : 'border border-slate-200 text-slate-800 hover:border-slate-400 hover:bg-slate-50'}`}
                  >
                    {loading ? <><Spinner /> Processing…</> : 'Buy now'}
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        {/* Subscription plans */}
        <div className="flex items-center gap-4 mb-8">
          <div className="flex-1 h-px bg-slate-200" />
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 whitespace-nowrap">Or subscribe for ongoing monitoring</p>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        <div className="flex items-center justify-center gap-4 mb-10">
          <span className="text-sm font-medium text-slate-500">Monthly</span>
          <button onClick={() => setAnnual(!annual)} className={`w-12 h-6 rounded-full relative transition-colors ${annual ? 'bg-emerald-400' : 'bg-slate-200'}`}>
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${annual ? 'translate-x-6' : 'translate-x-0.5'}`} />
          </button>
          <span className="text-sm font-medium text-slate-500">Annual</span>
          <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Save 20%</span>
        </div>

        <div className="grid md:grid-cols-3 gap-5 items-center">
          {plans.map((plan) => {
            const key = `plan-${plan.slug}-${annual ? 'annual' : 'monthly'}`
            const loading = loadingKey === key
            return (
              <div key={plan.name} className={`rounded-2xl p-7 border relative transition-all hover:-translate-y-1 hover:shadow-xl ${plan.featured ? 'bg-slate-900 border-slate-900 scale-105' : 'bg-white border-slate-200'}`}>
                {plan.featured && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-400 text-slate-900 text-xs font-bold px-4 py-1 rounded-full">Most popular</div>}
                <div className={`text-xs font-semibold uppercase tracking-widest mb-3 ${plan.featured ? 'text-white/50' : 'text-slate-400'}`}>{plan.name}</div>
                <div className="mb-2">
                  <span className={`font-serif text-5xl ${plan.featured ? 'text-white' : 'text-slate-900'}`}>
                    ${annual ? plan.annual : plan.monthly}
                  </span>
                  <span className={`text-sm ${plan.featured ? 'text-white/40' : 'text-slate-400'}`}>/mo</span>
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
                    {loading ? <><Spinner /> Processing…</> : plan.cta}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
