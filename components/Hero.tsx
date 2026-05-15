import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

export default async function Hero() {
  const t = await getTranslations('hero')

  const pills = [
    'WCAG 2.2 AA & AAA coverage',
    'Real code snippets included',
    'Fix instructions for every issue',
  ]

  return (
    <section className="bg-slate-900 px-6 py-28 sm:py-36 text-center relative overflow-hidden isolate">
      {/* One subtle spotlight — replaces the three-orb animation noise.
          A single soft emerald glow behind the headline, slowly breathing
          with prefers-reduced-motion respected below. */}
      <div
        aria-hidden="true"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] max-w-[120vw] rounded-full bg-emerald-400/12 blur-[120px] pointer-events-none animate-[heroGlow_12s_ease-in-out_infinite]"
      />

      <div className="relative max-w-4xl mx-auto">
        <h1 className="font-serif text-[2.5rem] leading-[1.05] sm:text-6xl md:text-7xl lg:text-[5.5rem] text-white mb-6 sm:mb-8 tracking-tight animate-[heroFadeUp_900ms_cubic-bezier(0.22,1,0.36,1)_both]">
          {t('headlineBefore')}{' '}
          <em className="not-italic block sm:inline bg-gradient-to-br from-emerald-300 via-emerald-400 to-violet-400 bg-clip-text text-transparent">
            {t('headlineHighlight')}
          </em>
          {t('headlineAfter') && <> {t('headlineAfter')}</>}
        </h1>

        <p className="text-base sm:text-xl text-white/60 font-light max-w-2xl mx-auto mb-10 sm:mb-12 leading-relaxed animate-[heroFadeUp_900ms_cubic-bezier(0.22,1,0.36,1)_140ms_both]">
          {t('sub')}
        </p>

        <div className="flex gap-3 justify-center flex-wrap mb-14 animate-[heroFadeUp_900ms_cubic-bezier(0.22,1,0.36,1)_260ms_both]">
          <Link
            href="#scanner"
            className="bg-emerald-400 text-slate-900 font-semibold px-7 py-4 rounded-xl hover:bg-emerald-300 hover:-translate-y-0.5 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
          >
            {t('ctaScan')}
          </Link>
          <Link
            href="#pricing"
            className="text-white/70 hover:text-white font-medium px-7 py-4 rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
          >
            {t('ctaPlans')}
          </Link>
        </div>

        {/* Three quiet trust signals — no badges, no icons, just spaced text */}
        <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs sm:text-sm text-white/40 animate-[heroFadeUp_900ms_cubic-bezier(0.22,1,0.36,1)_380ms_both]">
          {pills.map((pill, i) => (
            <li key={pill} className="flex items-center gap-2">
              {i > 0 && <span aria-hidden="true" className="w-1 h-1 rounded-full bg-white/20" />}
              <span>{pill}</span>
            </li>
          ))}
        </ul>
      </div>

      <style>{`
        @keyframes heroFadeUp {
          0%   { opacity: 0; transform: translate3d(0, 12px, 0); }
          100% { opacity: 1; transform: translate3d(0, 0, 0); }
        }
        @keyframes heroGlow {
          0%, 100% { opacity: 0.55; transform: translate(-50%, -50%) scale(1); }
          50%      { opacity: 0.85; transform: translate(-50%, -50%) scale(1.08); }
        }
        @media (prefers-reduced-motion: reduce) {
          [class*="animate-[hero"] { animation: none !important; }
        }
      `}</style>
    </section>
  )
}
