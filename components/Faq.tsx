'use client'
import { useState } from 'react'
import { useTranslations } from 'next-intl'

export default function Faq() {
  const t = useTranslations('faq')
  const [open, setOpen] = useState<number | null>(0)

  const items = [1, 2, 3, 4, 5, 6, 7, 8].map((i) => ({
    q: t(`q${i}` as 'q1'),
    a: t(`a${i}` as 'a1'),
  }))

  return (
    <section id="faq" className="py-20 px-6 bg-slate-50/60 border-y border-slate-100">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600 mb-3">{t('label')}</p>
          <h2 className="font-serif text-4xl text-slate-900 mb-3">{t('headline')}</h2>
          <p className="text-slate-500">{t('sub')}</p>
        </div>

        <div className="space-y-3">
          {items.map((item, i) => {
            const isOpen = open === i
            return (
              <div
                key={i}
                className={`bg-white border rounded-2xl overflow-hidden transition-shadow ${
                  isOpen ? 'border-slate-300 shadow-sm' : 'border-slate-200'
                }`}
              >
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-slate-50 transition-colors"
                >
                  <span className="flex-1 font-semibold text-slate-800 text-sm sm:text-base">{item.q}</span>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 -mt-1 text-sm text-slate-600 leading-relaxed">{item.a}</div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
