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
    <section className="bg-slate-900 px-6 py-24 text-center relative overflow-hidden isolate">
      {/* Animated gradient orbs */}
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 left-1/4 w-[480px] h-[480px] rounded-full bg-emerald-400/20 blur-[120px] animate-[heroOrb_18s_ease-in-out_infinite]" />
        <div className="absolute top-10 right-0 w-[420px] h-[420px] rounded-full bg-violet-500/15 blur-[120px] animate-[heroOrb_22s_ease-in-out_infinite_reverse]" />
        <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-emerald-300/10 blur-[100px]" />
      </div>

      {/* Subtle grid background */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)] pointer-events-none"
      />

      <div className="relative max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-emerald-400/10 border border-emerald-400/30 text-emerald-400 text-xs font-medium px-3 py-1.5 rounded-full mb-6 backdrop-blur-sm animate-[heroFadeUp_700ms_cubic-bezier(0.22,1,0.36,1)]">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inset-0 inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
          </span>
          {t('badge')}
        </div>
        <h1
          className="font-serif text-5xl md:text-7xl text-white leading-tight mb-5 animate-[heroFadeUp_900ms_cubic-bezier(0.22,1,0.36,1)_120ms_both]"
        >
          {t('headlineBefore')}{' '}
          <em className="text-emerald-400 not-italic relative inline-block">
            {t('headlineHighlight')}
            <span
              aria-hidden="true"
              className="absolute left-0 -bottom-1 h-1 w-full origin-left bg-gradient-to-r from-emerald-400 via-emerald-300 to-emerald-400/0 rounded-full animate-[heroUnderline_1.2s_cubic-bezier(0.22,1,0.36,1)_400ms_both]"
            />
          </em>{' '}
          {t('headlineAfter')}
        </h1>
        <p className="text-lg text-white/60 font-light max-w-xl mx-auto mb-10 animate-[heroFadeUp_900ms_cubic-bezier(0.22,1,0.36,1)_240ms_both]">
          {t('sub')}
        </p>
        <div className="flex gap-3 justify-center flex-wrap mb-14 animate-[heroFadeUp_900ms_cubic-bezier(0.22,1,0.36,1)_360ms_both]">
          <Link
            href="#scanner"
            className="bg-emerald-400 text-slate-900 font-semibold px-6 py-3.5 rounded-xl hover:bg-emerald-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-emerald-400/30 active:translate-y-0 transition-all"
          >
            {t('ctaScan')}
          </Link>
          <Link
            href="#pricing"
            className="bg-white/10 text-white/85 border border-white/15 px-6 py-3.5 rounded-xl hover:bg-white/15 hover:border-white/25 transition-all backdrop-blur-sm"
          >
            {t('ctaPlans')}
          </Link>
        </div>
        <div className="flex flex-wrap justify-center gap-3 animate-[heroFadeUp_900ms_cubic-bezier(0.22,1,0.36,1)_480ms_both]">
          {pills.map(pill => (
            <span key={pill} className="inline-flex items-center gap-2 bg-white/8 border border-white/15 text-white/70 text-sm px-4 py-2 rounded-full backdrop-blur-sm">
              <svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400 shrink-0">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              {pill}
            </span>
          ))}
        </div>
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
        @media (prefers-reduced-motion: reduce) {
          .animate-\\[heroOrb_18s_ease-in-out_infinite\\],
          .animate-\\[heroOrb_22s_ease-in-out_infinite_reverse\\],
          .animate-\\[heroFadeUp_700ms_cubic-bezier\\(0\\.22\\,1\\,0\\.36\\,1\\)\\],
          .animate-\\[heroFadeUp_900ms_cubic-bezier\\(0\\.22\\,1\\,0\\.36\\,1\\)_120ms_both\\],
          .animate-\\[heroFadeUp_900ms_cubic-bezier\\(0\\.22\\,1\\,0\\.36\\,1\\)_240ms_both\\],
          .animate-\\[heroFadeUp_900ms_cubic-bezier\\(0\\.22\\,1\\,0\\.36\\,1\\)_360ms_both\\],
          .animate-\\[heroFadeUp_900ms_cubic-bezier\\(0\\.22\\,1\\,0\\.36\\,1\\)_480ms_both\\],
          .animate-\\[heroUnderline_1\\.2s_cubic-bezier\\(0\\.22\\,1\\,0\\.36\\,1\\)_400ms_both\\] {
            animation: none !important;
          }
        }
      `}</style>
    </section>
  )
}
