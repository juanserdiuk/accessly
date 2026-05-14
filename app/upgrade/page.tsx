import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import UpgradePlans from './UpgradePlans'

export const metadata: Metadata = {
  title: 'Upgrade — Accessly',
  description: 'Pick the plan that scales with you. Unlimited scans, monitoring, white-label reports, and more.',
}

export default async function UpgradePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/upgrade')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, stripe_customer_id, first_name')
    .eq('id', user.id)
    .single()

  const plan = (profile?.plan ?? 'free') as 'free' | 'pps' | 'pro' | 'agency'
  const hasStripeCustomer = !!profile?.stripe_customer_id
  const firstName = profile?.first_name ?? null

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">

      {/* Top bar with back link */}
      <header className="border-b border-slate-200/60 bg-white/70 backdrop-blur sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Back to dashboard
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-emerald-400 rounded-lg flex items-center justify-center">
              <span className="text-slate-900 text-xs font-bold">A</span>
            </div>
            <span className="font-serif text-lg text-slate-900">Accessly</span>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-12 text-center relative">
        {/* Decorative glow */}
        <div aria-hidden="true" className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-br from-emerald-200/40 via-violet-200/20 to-transparent rounded-full blur-3xl" />

        <div className="relative">
          <div className="inline-flex items-center gap-2 bg-white border border-slate-200 rounded-full px-4 py-1.5 mb-6 shadow-sm">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-xs font-semibold text-slate-700">
              {plan === 'free' && 'You\'re on the Free plan'}
              {plan === 'pps' && 'You\'re on Pay-per-scan'}
              {plan === 'pro' && 'You\'re on the Pro plan'}
              {plan === 'agency' && 'You\'re on the Agency plan'}
            </span>
          </div>
          <h1 className="font-serif text-4xl sm:text-6xl text-slate-900 mb-4 leading-[1.05] tracking-tight">
            {firstName ? `${firstName}, scale up` : 'Scale up'} when<br />
            <span className="bg-gradient-to-r from-emerald-600 via-violet-600 to-emerald-600 bg-clip-text text-transparent">
              you&apos;re ready.
            </span>
          </h1>
          <p className="text-slate-500 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Unlimited scans, automated monitoring, regression alerts, white-label reports, and a real team behind you. Cancel anytime — no contracts, no commitments.
          </p>
        </div>
      </section>

      {/* Plans */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">
        <UpgradePlans currentPlan={plan} hasStripeCustomer={hasStripeCustomer} />
      </section>

      {/* Trust strip */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-12">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              ),
              title: '14-day money back',
              sub: 'Not happy? Email us within 14 days for a full, no-questions refund.',
              accent: 'text-emerald-600',
            },
            {
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="6" width="20" height="12" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
                </svg>
              ),
              title: 'Secure checkout',
              sub: 'Stripe handles payment. Your card details never touch our servers.',
              accent: 'text-violet-600',
            },
            {
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                </svg>
              ),
              title: 'Cancel anytime',
              sub: 'One-click cancel from the customer portal. Keep access until the period ends.',
              accent: 'text-amber-600',
            },
          ].map((b) => (
            <div key={b.title} className="bg-white border border-slate-200 rounded-2xl p-5">
              <div className={`w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center mb-3 ${b.accent}`}>
                {b.icon}
              </div>
              <p className="font-semibold text-slate-900 mb-1 text-sm">{b.title}</p>
              <p className="text-xs text-slate-500 leading-relaxed">{b.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Compare row */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-20">
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100">
            <h2 className="font-serif text-2xl text-slate-900">What you actually get</h2>
            <p className="text-sm text-slate-400 mt-1">The feature-by-feature breakdown.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Feature</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Free</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-violet-600 uppercase tracking-wide">Pro</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-amber-600 uppercase tracking-wide">Agency</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Monthly scans',           '3',         'Unlimited', 'Unlimited'],
                  ['Sites monitored',         '1',         '10',        'Unlimited'],
                  ['Team seats',              '1',         '3',         'Unlimited'],
                  ['Scheduled scans',         false,       true,        true],
                  ['Regression alerts',       false,       true,        true],
                  ['API access',              false,       true,        true],
                  ['White-label PDF reports', false,       false,       true],
                  ['Client portfolios',       false,       false,       true],
                  ['Salesperson tracking',    false,       false,       true],
                  ['Priority support',        false,       true,        true],
                  ['Onboarding call',         false,       false,       true],
                ].map(([feature, free, pro, agency]) => (
                  <tr key={feature as string} className="border-b border-slate-50 last:border-0">
                    <td className="px-6 py-3 text-slate-700">{feature}</td>
                    {[free, pro, agency].map((val, i) => (
                      <td key={i} className="px-4 py-3 text-center">
                        {typeof val === 'boolean' ? (
                          val ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="inline text-emerald-500">
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )
                        ) : (
                          <span className="text-sm font-medium text-slate-700">{val}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-20">
        <h2 className="font-serif text-3xl text-slate-900 mb-2 text-center">Frequently asked</h2>
        <p className="text-sm text-slate-400 text-center mb-10">Still on the fence? These should help.</p>

        <div className="space-y-3">
          {[
            {
              q: 'Can I cancel anytime?',
              a: 'Yes. One click in the Stripe customer portal cancels your subscription. You keep access until the end of the current billing period — no penalty, no questions asked.',
            },
            {
              q: 'What happens to my scans if I downgrade?',
              a: 'Your existing scans, reports, and history stay intact. You just won\'t be able to run new scans beyond the Free tier limit (3/mo) until you upgrade again.',
            },
            {
              q: 'Do you offer a refund if I\'m not happy?',
              a: 'Within 14 days of your first subscription payment, email contact@accessly.us and we\'ll process a full refund — no questions, no friction.',
            },
            {
              q: 'Can I switch from monthly to annual later?',
              a: 'Yes — open the Stripe customer portal from your dashboard settings, switch billing cadence, and we\'ll prorate the difference.',
            },
            {
              q: 'Is there a discount for non-profits or education?',
              a: 'Yes. Email contact@accessly.us with proof of non-profit / .edu status and we\'ll set up a 50% discount.',
            },
            {
              q: 'What payment methods do you accept?',
              a: 'All major cards (Visa, Mastercard, Amex, Discover) plus Apple Pay and Google Pay through Stripe. International cards welcome.',
            },
          ].map((item) => (
            <details
              key={item.q}
              className="group bg-white border border-slate-200 rounded-2xl overflow-hidden hover:border-slate-300 transition"
            >
              <summary className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer select-none list-none">
                <span className="font-semibold text-slate-900 text-sm">{item.q}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 shrink-0 transition-transform group-open:rotate-180">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </summary>
              <div className="px-5 pb-4 text-sm text-slate-600 leading-relaxed">{item.a}</div>
            </details>
          ))}
        </div>
      </section>

      {/* Bottom CTA card */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-20">
        <div className="bg-slate-900 text-white rounded-3xl px-6 sm:px-12 py-12 sm:py-16 text-center relative overflow-hidden">
          <div aria-hidden="true" className="pointer-events-none absolute -top-16 -right-16 w-64 h-64 bg-emerald-400/20 rounded-full blur-3xl" />
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-16 -left-16 w-64 h-64 bg-violet-400/15 rounded-full blur-3xl" />
          <div className="relative">
            <h3 className="font-serif text-3xl sm:text-4xl mb-4">Still have questions?</h3>
            <p className="text-white/70 text-sm sm:text-base max-w-md mx-auto mb-8 leading-relaxed">
              We&apos;re a small team and we read every email. Tell us what you need — we&apos;ll get back to you within a few hours.
            </p>
            <a
              href="mailto:contact@accessly.us"
              className="inline-flex items-center gap-2 bg-emerald-400 text-slate-900 font-bold px-6 py-3 rounded-xl hover:bg-emerald-300 transition text-sm"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
              </svg>
              Email contact@accessly.us
            </a>
          </div>
        </div>
      </section>
    </main>
  )
}
