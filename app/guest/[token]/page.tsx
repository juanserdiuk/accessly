import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { createAdminClient } from '@/lib/supabase/admin'
import GuestScanner from './GuestScanner'
import DocScanner from '@/components/DocScanner'

type Props = { params: Promise<{ token: string }> }

async function ExpiredState({ label }: { label: string }) {
  const t = await getTranslations('guest')
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-slate-900 px-6 h-14 flex items-center gap-3 shrink-0">
        <div className="w-7 h-7 bg-emerald-400 rounded-lg flex items-center justify-center shrink-0">
          <span className="text-slate-900 text-xs font-bold">A</span>
        </div>
        <span className="font-serif text-lg text-white">Accessly</span>
      </header>
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center max-w-md w-full shadow-xl">
          <div className="w-14 h-14 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
          </div>
          <h1 className="font-serif text-2xl text-slate-900 mb-2">{t('expiredTitle')}</h1>
          <p className="text-sm text-slate-500 mb-1">
            {t.rich('expiredSub', {
              label: () => <span className="font-medium text-slate-700">&ldquo;{label}&rdquo;</span>,
            })}
          </p>
          <p className="text-sm text-slate-400 mb-8">{t('expiredCta')}</p>
          <div className="flex gap-3 justify-center">
            <Link href="/signup"
              className="bg-slate-900 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-slate-700 transition text-sm">
              {t('createFreeAccount')}
            </Link>
            <Link href="/"
              className="bg-slate-100 text-slate-700 font-semibold px-5 py-2.5 rounded-xl hover:bg-slate-200 transition text-sm">
              {t('learnMore')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default async function GuestPage({ params }: Props) {
  const t = await getTranslations('guest')
  const { token } = await params

  const admin = createAdminClient()
  const { data: gt, error } = await admin
    .from('guest_tokens')
    .select('id, label, expires_at, is_active')
    .eq('token', token)
    .single()

  if (error || !gt) notFound()

  const expired = new Date(gt.expires_at) < new Date()
  if (!gt.is_active || expired) return <ExpiredState label={gt.label} />

  const daysLeft = Math.ceil((new Date(gt.expires_at).getTime() - Date.now()) / 86_400_000)

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">

      {/* Header */}
      <header className="bg-slate-900 px-6 h-14 flex items-center justify-between shrink-0 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-emerald-400 rounded-lg flex items-center justify-center shrink-0">
            <span className="text-slate-900 text-xs font-bold">A</span>
          </div>
          <span className="font-serif text-lg text-white">Accessly</span>
          <span className="hidden sm:inline-flex items-center gap-1.5 ml-2 text-xs font-medium text-white/50 bg-white/8 border border-white/10 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            {gt.label}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-white/30 hidden sm:block">
            {t('daysLeft', { count: daysLeft })}
          </span>
          <Link href="/signup"
            className="bg-emerald-400 text-slate-900 text-xs font-semibold px-3.5 py-2 rounded-lg hover:bg-emerald-300 transition">
            {t('createFreeAccountArrow')}
          </Link>
        </div>
      </header>

      {/* Welcome banner */}
      <div className="bg-emerald-600 px-6 py-3 text-center">
        <p className="text-sm text-white/90">
          {t('bannerLead')}{' '}
          <Link href="/signup" className="font-semibold text-white hover:underline">
            {t('bannerLink')}
          </Link>{' '}
          {t('bannerTrail')}
        </p>
      </div>

      {/* Main content */}
      <div className="flex-1 py-10 px-6">
        <div className="max-w-4xl mx-auto">

          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-3">
              <span className="text-xs font-bold uppercase tracking-widest bg-gradient-to-r from-amber-400 to-emerald-400 bg-clip-text text-transparent">
                Agency preview
              </span>
              <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                · {gt.label}
              </span>
            </div>
            <h1 className="font-serif text-3xl text-slate-900 mb-2">
              {t('headline')}
            </h1>
            <p className="text-slate-500">
              {t('headlineSub')}
            </p>
            <p className="text-xs text-slate-400 mt-3">
              You&apos;re seeing the Accessly Agency experience — unlimited scans, white-label-ready reports, and the full feature set.
            </p>
          </div>

          <div className="space-y-10">
            <GuestScanner />
            <DocScanner />

            {/* Agency capabilities teaser */}
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 shadow-xl">
              <div aria-hidden="true" className="absolute -top-20 -right-20 w-72 h-72 bg-emerald-400/15 rounded-full blur-3xl pointer-events-none" />
              <div aria-hidden="true" className="absolute -bottom-16 -left-16 w-56 h-56 bg-violet-500/15 rounded-full blur-3xl pointer-events-none" />
              <div className="relative">
                <div className="inline-flex items-center gap-1.5 bg-amber-400/15 border border-amber-400/30 text-amber-300 text-xs font-bold px-3 py-1 rounded-full mb-4 uppercase tracking-wider">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                  Agency tier
                </div>
                <h3 className="font-serif text-2xl text-white mb-5">Everything you unlock at Agency level</h3>
                <div className="grid sm:grid-cols-2 gap-x-8 gap-y-3">
                  {[
                    'Unlimited scans across unlimited sites',
                    'Scheduled monitoring (hourly / daily / weekly)',
                    'Multi-page crawl — scan an entire domain',
                    'White-label PDF reports with your branding',
                    'Client portfolios — group sites per client',
                    'Regression alerts via email + Slack',
                    'CI/CD widget — embeddable score badges',
                    'Unlimited team members',
                  ].map(f => (
                    <div key={f} className="flex items-start gap-2.5 text-sm text-white/75">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400 shrink-0 mt-1">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex items-center gap-3 flex-wrap">
                  <Link
                    href="/signup?plan=agency&billing=monthly"
                    className="inline-flex items-center gap-2 bg-emerald-400 text-slate-900 font-bold px-5 py-3 rounded-xl hover:bg-emerald-300 transition text-sm shadow-lg shadow-emerald-400/30"
                  >
                    Start Agency trial
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                    </svg>
                  </Link>
                  <span className="text-xs text-white/40">$99/mo · cancel anytime</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 px-6 py-6 text-center mt-auto">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <p className="text-sm text-white/40">
            {t('footerLead')}{' '}
            <Link href="/signup" className="text-emerald-400 font-semibold hover:underline">
              {t('footerLink')}
            </Link>
          </p>
          <span className="hidden sm:block text-white/20">·</span>
          <p className="text-xs text-white/25">
            {t('poweredBy')}{' '}
            <Link href="/" className="hover:text-white/50 transition">Accessly</Link>
          </p>
        </div>
      </footer>

    </div>
  )
}
