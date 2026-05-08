import { getTranslations } from 'next-intl/server'

const ICONS = [
  (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  ),
  (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <polyline points="9 15 11 17 15 13" />
    </svg>
  ),
]

export default async function HowItWorks() {
  const t = await getTranslations('howItWorks')

  const steps = [
    { number: '01', title: t('step1Title'), desc: t('step1Desc'), icon: ICONS[0] },
    { number: '02', title: t('step2Title'), desc: t('step2Desc'), icon: ICONS[1] },
    { number: '03', title: t('step3Title'), desc: t('step3Desc'), icon: ICONS[2] },
  ]

  return (
    <section className="py-20 px-6 bg-white">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600 mb-3">{t('label')}</p>
          <h2 className="font-serif text-4xl text-slate-900 mb-3">{t('headline')}</h2>
          <p className="text-slate-500 max-w-md mx-auto">{t('sub')}</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 relative">
          <div className="hidden md:block absolute top-8 left-[calc(16.66%+1rem)] right-[calc(16.66%+1rem)] h-px bg-slate-200" />

          {steps.map((step) => (
            <div key={step.number} className="flex flex-col items-center text-center relative">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500 mb-5 relative z-10 bg-white">
                {step.icon}
              </div>
              <div className="text-xs font-bold tracking-widest text-emerald-500 mb-2">{step.number}</div>
              <h3 className="font-semibold text-slate-900 mb-2">{step.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed max-w-xs">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
