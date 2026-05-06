const testimonials = [
  {
    name: 'Maria Chen',
    title: 'Owner',
    company: 'Bloom Bakery Co.',
    quote: "I had no idea my website was failing basic accessibility checks. Accessly found 14 issues in under a minute and told me exactly how to fix each one. My developer had everything patched the same afternoon.",
  },
  {
    name: 'James Okafor',
    title: 'Director',
    company: 'Pivot Digital Agency',
    quote: "We run accessibility audits for every client before launch. Accessly replaced a clunky manual process — we now catch regressions automatically on every deploy. Our clients love the white-label reports.",
  },
  {
    name: 'Dr. Priya Nair',
    title: 'Accessibility Consultant',
    company: 'Inclusive UX Ltd.',
    quote: "The WCAG 2.2 coverage is thorough and the issue descriptions are genuinely useful — not just rule IDs. I recommend Accessly to every team I work with as a first-line audit tool before I do a manual review.",
  },
]

const Stars = () => (
  <div className="flex gap-0.5 mb-4">
    {Array.from({ length: 5 }).map((_, i) => (
      <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-amber-400">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ))}
  </div>
)

export default function Testimonials() {
  return (
    <section className="py-20 px-6 bg-slate-50">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600 mb-3">Testimonials</p>
          <h2 className="font-serif text-4xl text-slate-900 mb-3">Trusted by teams who care about inclusion</h2>
          <p className="text-slate-500 max-w-md mx-auto">From solo founders to accessibility specialists — here's what they're saying.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {testimonials.map((t) => (
            <div key={t.name} className="bg-white border border-slate-200 rounded-2xl p-7 flex flex-col">
              <Stars />
              <blockquote className="text-sm text-slate-600 leading-relaxed flex-1 mb-6">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <div className="flex items-center gap-3 pt-5 border-t border-slate-100">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                  {t.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">{t.name}</div>
                  <div className="text-xs text-slate-400">{t.title}, {t.company}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
