const features = [
  { icon: '⚡', title: 'Instant scanning', desc: 'Analyze any URL in under 3 seconds. Crawl entire sites automatically with our deep spider.' },
  { icon: '📋', title: 'Detailed reports', desc: 'Every issue mapped to WCAG 2.2 criteria with code snippets and step-by-step fix guides.' },
  { icon: '📈', title: 'Compliance tracking', desc: 'Track your accessibility score over time. Get alerted the moment a regression is detected.' },
  { icon: '🌐', title: 'Multi-site monitoring', desc: 'Monitor dozens of domains from one dashboard. Schedule scans daily, weekly, or on every deploy.' },
  { icon: '🔗', title: 'CI/CD integration', desc: 'Block deployments that introduce regressions. Native GitHub Actions & Jenkins support.' },
  { icon: '👥', title: 'Team collaboration', desc: 'Assign issues, leave comments, and track remediation progress across your whole team.' },
]

export default function Features() {
  return (
    <section id="features" className="py-20 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600 mb-3">What you get</p>
          <h2 className="font-serif text-4xl text-slate-900 mb-3">Everything you need for accessibility</h2>
          <p className="text-slate-500 max-w-md mx-auto">From one-click scans to full compliance dashboards and team workflows.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {features.map((f) => (
            <div key={f.title} className="p-6 border border-slate-200 rounded-2xl hover:shadow-lg hover:-translate-y-1 transition-all bg-white">
              <div className="text-2xl mb-4">{f.icon}</div>
              <h3 className="font-semibold text-slate-900 mb-2">{f.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}