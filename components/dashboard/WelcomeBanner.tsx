import Link from 'next/link'

interface Props {
  firstName: string | null
  plan: string
  /**
   * Show the banner only on the first dashboard visit after signup or plan
   * change. Today we render it on every dashboard load — toggle with a
   * profile field if it gets annoying.
   */
}

const PLAN_COPY: Record<string, { title: string; sub: string; gradient: string; badge: string }> = {
  free: {
    title: 'Welcome to Accessly, {name}!',
    sub: "You're on the Free tier — 3 scans, full WCAG reports, no card needed. Try the dashboard and run your first audit below.",
    gradient: 'from-slate-900 via-slate-800 to-slate-900',
    badge: 'Free plan',
  },
  pps: {
    title: 'Pay-as-you-scan, {name}',
    sub: 'No subscription — just pay for the scans you need. Portfolios, white-label reports, salesperson tracking are unlocked. Top up anytime.',
    gradient: 'from-blue-700 via-blue-600 to-cyan-600',
    badge: 'Pay per scan',
  },
  pro: {
    title: 'Welcome to Pro, {name}!',
    sub: 'Unlimited scans, scheduled monitoring, regression alerts, and the full WCAG 2.2 reports are all unlocked.',
    gradient: 'from-violet-700 via-violet-600 to-violet-700',
    badge: 'Pro plan',
  },
  agency: {
    title: 'Welcome to Agency, {name}!',
    sub: 'Portfolios, white-label reports, salesperson tracking, unlimited team — the full agency toolkit is yours.',
    gradient: 'from-amber-600 via-amber-500 to-amber-600',
    badge: 'Agency plan',
  },
}

export default function WelcomeBanner({ firstName, plan }: Props) {
  const copy = PLAN_COPY[plan] ?? PLAN_COPY.free
  const name = firstName?.trim() || 'there'
  const title = copy.title.replace('{name}', name)

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${copy.gradient} px-6 py-5 sm:px-8 sm:py-6 text-white shadow-lg`}
      role="region"
      aria-label="Welcome"
    >
      {/* Decorative glows */}
      <div aria-hidden="true" className="pointer-events-none absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-8 -left-8 w-40 h-40 bg-white/5 rounded-full blur-3xl" />

      <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
        <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
          <span className="font-serif text-xl font-bold">{name[0]?.toUpperCase() ?? '👋'}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-widest bg-white/15 border border-white/15 px-2 py-0.5 rounded-full">
              {copy.badge}
            </span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl leading-tight mb-1">{title}</h2>
          <p className="text-sm text-white/75 leading-relaxed">{copy.sub}</p>
        </div>

        {plan === 'free' && (
          <Link
            href="/upgrade"
            className="shrink-0 inline-flex items-center gap-2 bg-white text-slate-900 font-bold px-4 py-2.5 rounded-xl hover:bg-white/90 transition text-sm shadow-lg"
          >
            Upgrade
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
            </svg>
          </Link>
        )}
        {plan === 'pps' && (
          <Link
            href="/upgrade"
            className="shrink-0 inline-flex items-center gap-2 bg-white text-slate-900 font-bold px-4 py-2.5 rounded-xl hover:bg-white/90 transition text-sm shadow-lg"
          >
            Buy more scans
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
            </svg>
          </Link>
        )}
      </div>
    </div>
  )
}
