import { getTranslations } from 'next-intl/server'
import ViolationAccordion, { ViolationItem } from '@/components/dashboard/ViolationAccordion'

const SAMPLE_VIOLATIONS: ViolationItem[] = [
  {
    id: 'image-alt',
    impact: 'critical',
    help: 'Images must have alternate text',
    description: 'Ensures <img> elements have alternate text or a role of none or presentation.',
    helpUrl: 'https://dequeuniversity.com/rules/axe/4.6/image-alt',
    wcag: 'WCAG 1.1.1',
    nodes: [
      {
        html: '<img src="/assets/hero-banner.jpg" class="hero-img w-full">',
        target: '.hero-img',
        failureSummary: 'Fix 1 of 1: Element does not have an alt attribute. Add alt="[descriptive text]" to describe the image for screen reader users.',
        impact: 'critical',
      },
    ],
  },
  {
    id: 'color-contrast',
    impact: 'serious',
    help: 'Elements must have sufficient color contrast',
    description: 'Ensures the contrast between foreground and background colors meets WCAG 2 AA thresholds.',
    helpUrl: 'https://dequeuniversity.com/rules/axe/4.6/color-contrast',
    wcag: 'WCAG 1.4.3',
    nodes: [
      {
        html: '<p class="nav-link" style="color: #9ca3af; font-size: 14px;">Products</p>',
        target: 'header nav .nav-link',
        failureSummary: 'Fix 1 of 1: Element has insufficient color contrast of 2.85:1 (foreground: #9ca3af, background: #ffffff). Expected contrast ratio of 4.5:1 for normal-weight text below 18pt.',
        impact: 'serious',
      },
    ],
  },
  {
    id: 'label',
    impact: 'critical',
    help: 'Form elements must have labels',
    description: 'Ensures every form element has a label describing its purpose.',
    helpUrl: 'https://dequeuniversity.com/rules/axe/4.6/label',
    wcag: 'WCAG 1.3.1, WCAG 4.1.2',
    nodes: [
      {
        html: '<input type="email" name="email" placeholder="Enter your email" class="subscribe-input">',
        target: 'form .subscribe-input',
        failureSummary: "Fix 1 of 2: Add a <label> with a for attribute matching this input's id, or wrap the input in a <label> element. Placeholder text alone is not a sufficient label.",
        impact: 'critical',
      },
    ],
  },
]

export default async function BuiltByExpert() {
  const t = await getTranslations('expert')

  const credentials = [t('credential1'), t('credential2'), t('credential3')]

  const scanStats = [
    { val: 3,  label: t('scanErrors'),   color: 'text-red-500'   },
    { val: 5,  label: t('scanWarnings'), color: 'text-amber-500' },
    { val: 31, label: t('scanPassed'),   color: 'text-green-600' },
  ]

  return (
    <section className="py-20 px-6 bg-slate-50">
      <div className="max-w-6xl mx-auto">

        <div className="text-center mb-14">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600 mb-3">{t('label')}</p>
          <h2 className="font-serif text-4xl text-slate-900 mb-3">{t('headline')}</h2>
          <p className="text-slate-500 max-w-md mx-auto">{t('sub')}</p>
        </div>

        <div className="flex flex-col gap-8 max-w-3xl mx-auto">

          {/* Creator card */}
          <div className="bg-slate-900 rounded-2xl p-8 flex flex-col gap-7">

            <div className="flex items-center gap-5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/profile.jpg" alt="Juan Serdiuk" className="w-28 h-28 rounded-full object-cover object-top ring-4 ring-emerald-400" />
              <div>
                <h3 className="font-serif text-xl text-white font-bold">Juan Serdiuk</h3>
                <p className="text-sm text-white/50 leading-snug mt-0.5" dangerouslySetInnerHTML={{ __html: t('jobTitle').replace(' & ', '<br />&amp; ') }} />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {credentials.map((badge, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 text-xs font-medium bg-emerald-400/10 text-emerald-400 border border-emerald-400/20 px-3 py-1.5 rounded-full">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  {badge}
                </span>
              ))}
            </div>

            <div className="h-px bg-white/10" />

            <div>
              <div className="text-5xl font-serif text-emerald-400/40 leading-none mb-3 select-none">&ldquo;</div>
              <blockquote className="text-white/70 text-base leading-relaxed italic">
                {t('quote')}
              </blockquote>
            </div>

            <a
              href="mailto:juanserdiuk@juanserdiuk.com"
              className="inline-flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 transition font-medium"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2"/>
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
              </svg>
              {t('cta')}
            </a>
          </div>

          {/* Scan result preview */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">

            <div className="bg-slate-900 px-5 py-3 flex items-center gap-3">
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-500/60" />
                <span className="w-3 h-3 rounded-full bg-amber-400/60" />
                <span className="w-3 h-3 rounded-full bg-emerald-400/60" />
              </div>
              <div className="flex-1 bg-white/10 rounded-md px-3 py-1.5 text-xs text-white/50 font-mono truncate">
                {t('previewUrl')}
              </div>
            </div>

            <div className="border-b border-slate-100 px-5 py-4 flex items-center gap-5">
              <div className="flex items-center gap-2">
                <span className="font-serif text-3xl text-amber-500">62</span>
                <span className="text-xs text-slate-400">/100</span>
              </div>
              <div className="h-8 w-px bg-slate-100" />
              {scanStats.map(({ val, label, color }) => (
                <div key={label} className="text-center">
                  <div className={`font-serif text-lg ${color}`}>{val}</div>
                  <div className="text-xs text-slate-400">{label}</div>
                </div>
              ))}
              <div className="ml-auto">
                <span className="text-xs font-medium bg-red-50 text-red-600 border border-red-100 px-2.5 py-1 rounded-full">
                  {t('needsWork')}
                </span>
              </div>
            </div>

            <div className="p-4 space-y-2">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  {t('violationsShown')}
                </p>
                <p className="text-xs text-slate-400 italic">{t('clickExpand')}</p>
              </div>
              <ViolationAccordion violations={SAMPLE_VIOLATIONS} />
            </div>

            <div className="relative h-20 bg-gradient-to-t from-white to-transparent -mt-4 flex items-end justify-center pb-4">
              <a href="#scanner" className="text-xs font-semibold text-emerald-600 hover:underline">
                {t('scanYourSite')}
              </a>
            </div>

          </div>
        </div>
      </div>
    </section>
  )
}
