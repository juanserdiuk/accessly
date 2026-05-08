import Link from 'next/link'

export default function Hero() {
  return (
    <section className="bg-slate-900 px-6 py-24 text-center relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(0,212,170,0.18),transparent)] pointer-events-none" />
      <div className="relative max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-emerald-400/10 border border-emerald-400/30 text-emerald-400 text-xs font-medium px-3 py-1.5 rounded-full mb-6">
          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
          WCAG 2.2 AA &amp; AAA Compliant Checks
        </div>
        <h1 className="font-serif text-5xl md:text-7xl text-white leading-tight mb-5">
          Make every website{' '}
          <em className="text-emerald-400 not-italic">accessible</em>{' '}
          to everyone
        </h1>
        <p className="text-lg text-white/60 font-light max-w-xl mx-auto mb-10">
          Scan any URL for accessibility issues in seconds. Get actionable reports,
          track compliance over time, and fix issues fast.
        </p>
        <div className="flex gap-3 justify-center flex-wrap mb-14">
          <Link href="#scanner" className="bg-emerald-400 text-slate-900 font-semibold px-6 py-3.5 rounded-xl hover:bg-emerald-300 transition">
            Scan a URL free →
          </Link>
          <Link href="#pricing" className="bg-white/10 text-white/85 border border-white/15 px-6 py-3.5 rounded-xl hover:bg-white/15 transition">
            View plans
          </Link>
        </div>
        <div className="flex justify-center divide-x divide-white/10 bg-white/5 border border-white/10 rounded-2xl max-w-lg mx-auto overflow-hidden">
          {[['10K+','Issues detected'],['500+','Sites scanned'],['98%','Accuracy rate']].map(([num, label]) => (
            <div key={label} className="flex-1 py-5 text-center">
              <div className="font-serif text-2xl text-white">{num}</div>
              <div className="text-xs text-white/40 mt-1">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}