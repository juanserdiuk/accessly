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
    <section className="bg-slate-900 px-6 py-24 text-center relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(0,212,170,0.18),transparent)] pointer-events-none" />
      <div className="relative max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-emerald-400/10 border border-emerald-400/30 text-emerald-400 text-xs font-medium px-3 py-1.5 rounded-full mb-6">
          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
          {t('badge')}
        </div>
        <h1 className="font-serif text-5xl md:text-7xl text-white leading-tight mb-5">
          {t('headlineBefore')}{' '}
          <em className="text-emerald-400 not-italic">{t('headlineHighlight')}</em>{' '}
          {t('headlineAfter')}
        </h1>
        <p className="text-lg text-white/60 font-light max-w-xl mx-auto mb-10">
          {t('sub')}
        </p>
        <div className="flex gap-3 justify-center flex-wrap mb-14">
          <Link href="#scanner" className="bg-emerald-400 text-slate-900 font-semibold px-6 py-3.5 rounded-xl hover:bg-emerald-300 transition">
            {t('ctaScan')}
          </Link>
          <Link href="#pricing" className="bg-white/10 text-white/85 border border-white/15 px-6 py-3.5 rounded-xl hover:bg-white/15 transition">
            {t('ctaPlans')}
          </Link>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          {pills.map(pill => (
            <span key={pill} className="inline-flex items-center gap-2 bg-white/8 border border-white/15 text-white/70 text-sm px-4 py-2 rounded-full">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400 shrink-0">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              {pill}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
