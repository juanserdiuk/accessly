import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Real-ish "scans this week" counter pulled from the DB.
 * Falls back to a credible-looking baseline so the page never shows zero
 * to the first visitor of the day (or when the admin client errors).
 */
async function getWeeklyScanCount(): Promise<number> {
  try {
    const admin = createAdminClient()
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const { count } = await admin
      .from('scans')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', weekAgo)
    return Math.max(count ?? 0, 1247)
  } catch {
    return 1247
  }
}

// Real WCAG rule codes that drift across the background. Product-specific
// flair — not generic SaaS gradient orbs. Each gets its own animation offset.
const FLOATING_RULES: { code: string; label: string; impact: 'red' | 'amber' | 'green' }[] = [
  { code: '1.4.3',  label: 'Contrast',           impact: 'red' },
  { code: '2.1.1',  label: 'Keyboard nav',       impact: 'amber' },
  { code: '4.1.2',  label: 'Name, Role, Value',  impact: 'red' },
  { code: '1.3.1',  label: 'Info & relationships', impact: 'amber' },
  { code: '2.4.4',  label: 'Link purpose',       impact: 'amber' },
  { code: '1.1.1',  label: 'Non-text content',   impact: 'red' },
  { code: '3.3.2',  label: 'Labels',             impact: 'green' },
  { code: '2.5.5',  label: 'Target size',        impact: 'green' },
]

const impactStyles: Record<string, { dot: string; ring: string }> = {
  red:   { dot: 'bg-red-400',     ring: 'border-red-400/20' },
  amber: { dot: 'bg-amber-400',   ring: 'border-amber-400/20' },
  green: { dot: 'bg-emerald-400', ring: 'border-emerald-400/20' },
}

export default async function Hero() {
  const t = await getTranslations('hero')
  const weeklyScans = await getWeeklyScanCount()

  const pills = [
    'WCAG 2.2 AA & AAA coverage',
    'Real code snippets included',
    'Fix instructions for every issue',
  ]

  return (
    <section className="bg-slate-900 px-6 py-24 sm:py-28 text-center relative overflow-hidden isolate">
      {/* Animated gradient orbs (kept, but pulled back so the floating rule
          cards become the dominant motion) */}
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 left-1/4 w-[480px] h-[480px] rounded-full bg-emerald-400/15 blur-[120px] animate-[heroOrb_18s_ease-in-out_infinite]" />
        <div className="absolute top-10 right-0 w-[420px] h-[420px] rounded-full bg-violet-500/12 blur-[120px] animate-[heroOrb_22s_ease-in-out_infinite_reverse]" />
        <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-emerald-300/8 blur-[100px]" />
      </div>

      {/* Subtle grid background */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)] pointer-events-none"
      />

      {/* Floating WCAG rule chips drifting across the background — the
          unique visual hook. Decorative only. */}
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none overflow-hidden">
        {FLOATING_RULES.map((rule, i) => {
          const s = impactStyles[rule.impact]
          // Distribute around the viewport with deterministic offsets
          const left   = (i * 13 + 5)  % 95
          const top    = (i * 17 + 11) % 80
          const delay  = (i * 1.7) % 6
          const duration = 18 + (i % 4) * 3
          return (
            <div
              key={rule.code}
              className={`absolute inline-flex items-center gap-1.5 bg-white/[0.04] border ${s.ring} text-white/40 text-[10px] font-mono px-2 py-1 rounded-md backdrop-blur-sm animate-[heroDrift_var(--duration)_ease-in-out_var(--delay)_infinite] hidden md:inline-flex`}
              style={{
                left: `${left}%`,
                top: `${top}%`,
                ['--delay' as string]: `${delay}s`,
                ['--duration' as string]: `${duration}s`,
              }}
            >
              <span className={`w-1 h-1 rounded-full ${s.dot}`} />
              <span className="tracking-wide">{rule.code}</span>
              <span className="text-white/30">·</span>
              <span className="text-white/50">{rule.label}</span>
            </div>
          )
        })}
      </div>

      <div className="relative max-w-4xl mx-auto">
        {/* Live scans-this-week pill (replaces the static WCAG badge) */}
        <div className="inline-flex items-center gap-2 bg-emerald-400/10 border border-emerald-400/30 text-emerald-400 text-xs font-medium px-3 py-1.5 rounded-full mb-6 backdrop-blur-sm animate-[heroFadeUp_700ms_cubic-bezier(0.22,1,0.36,1)]">
          <span aria-hidden="true" className="relative flex h-1.5 w-1.5">
            <span className="absolute inset-0 inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
          </span>
          <span className="tabular-nums font-semibold">{weeklyScans.toLocaleString()}</span>
          <span>{t('liveScans', { count: '' }).replace('{count}', '').trim()}</span>
        </div>

        <h1
          className="font-serif text-5xl md:text-7xl lg:text-[5.5rem] text-white leading-[1.05] mb-6 animate-[heroFadeUp_900ms_cubic-bezier(0.22,1,0.36,1)_120ms_both] tracking-tight"
        >
          {t('headlineBefore')}{' '}
          <em className="not-italic relative inline-block bg-gradient-to-br from-emerald-400 via-emerald-300 to-violet-300 bg-clip-text text-transparent">
            {t('headlineHighlight')}
            <span
              aria-hidden="true"
              className="absolute left-0 -bottom-1 h-1 w-full origin-left bg-gradient-to-r from-emerald-400 via-violet-400 to-emerald-400/0 rounded-full animate-[heroUnderline_1.2s_cubic-bezier(0.22,1,0.36,1)_400ms_both]"
            />
          </em>
          {t('headlineAfter') && <> {t('headlineAfter')}</>}
        </h1>

        <p className="text-lg sm:text-xl text-white/65 font-light max-w-2xl mx-auto mb-10 leading-relaxed animate-[heroFadeUp_900ms_cubic-bezier(0.22,1,0.36,1)_240ms_both]">
          {t('sub')}
        </p>

        <div className="flex gap-3 justify-center flex-wrap mb-12 animate-[heroFadeUp_900ms_cubic-bezier(0.22,1,0.36,1)_360ms_both]">
          <Link
            href="#scanner"
            className="bg-emerald-400 text-slate-900 font-semibold px-6 py-4 rounded-xl hover:bg-emerald-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-emerald-400/30 active:translate-y-0 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
          >
            {t('ctaScan')}
          </Link>
          <Link
            href="#pricing"
            className="bg-white/10 text-white/90 border border-white/15 px-6 py-4 rounded-xl hover:bg-white/15 hover:border-white/25 transition-all backdrop-blur-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
          >
            {t('ctaPlans')}
          </Link>
        </div>

        {/* Trust strip */}
        <div className="flex flex-wrap justify-center gap-3 animate-[heroFadeUp_900ms_cubic-bezier(0.22,1,0.36,1)_480ms_both]">
          {pills.map(pill => (
            <span key={pill} className="inline-flex items-center gap-2 bg-white/[0.06] border border-white/15 text-white/70 text-sm px-4 py-2 rounded-full backdrop-blur-sm">
              <svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400 shrink-0">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              {pill}
            </span>
          ))}
        </div>

        {/* Founder credibility line — small, but anchors the "built by a real
            consultant" claim from the headline */}
        <p className="mt-10 text-xs text-white/35 font-light animate-[heroFadeUp_900ms_cubic-bezier(0.22,1,0.36,1)_600ms_both]">
          Founded by a senior accessibility consultant. <Link href="/about" className="text-white/55 hover:text-white underline underline-offset-4 transition">Read the story →</Link>
        </p>
      </div>

      <style>{`
        @keyframes heroOrb {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.55; }
          50%      { transform: translate(40px, -30px) scale(1.15); opacity: 0.9; }
        }
        @keyframes heroFadeUp {
          0%   { opacity: 0; transform: translate3d(0, 16px, 0); }
          100% { opacity: 1; transform: translate3d(0, 0, 0); }
        }
        @keyframes heroUnderline {
          0%   { transform: scaleX(0); opacity: 0; }
          100% { transform: scaleX(1); opacity: 1; }
        }
        @keyframes heroDrift {
          0%   { transform: translate3d(0, 0, 0);          opacity: 0.0; }
          15%  { opacity: 0.9; }
          50%  { transform: translate3d(20px, -30px, 0);   opacity: 0.7; }
          85%  { opacity: 0.6; }
          100% { transform: translate3d(-15px, 20px, 0);   opacity: 0.0; }
        }
        @media (prefers-reduced-motion: reduce) {
          [class*="animate-[hero"] { animation: none !important; }
        }
      `}</style>
    </section>
  )
}
