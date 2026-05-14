import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sitemap — Accessly',
  description: 'Every public page on Accessly, grouped by section, with descriptions and quick navigation.',
}

interface RouteEntry {
  href: string
  label: string
  description: string
  external?: boolean
  badge?: string
}

interface Section {
  title: string
  description: string
  accent: string // tailwind color name shorthand: emerald, violet, amber, blue, slate
  routes: RouteEntry[]
}

const sections: Section[] = [
  {
    title: 'Get started',
    description: 'The fastest way into Accessly.',
    accent: 'emerald',
    routes: [
      { href: '/',        label: 'Home',           description: 'WCAG scanner overview, pricing, and instant URL scan.' },
      { href: '/signup',  label: 'Create account', description: 'Sign up free — 3 scans, no credit card needed.' },
      { href: '/login',   label: 'Log in',         description: 'Returning customer? Pick up where you left off.' },
      { href: '/#pricing',label: 'Pricing',        description: 'Free, Pro, and Agency plans — compare features.' },
      { href: '/#faq',    label: 'FAQ',            description: 'Common questions about scans, billing, and team access.' },
    ],
  },
  {
    title: 'Dashboard',
    description: 'Everything inside your account once you log in.',
    accent: 'violet',
    routes: [
      { href: '/dashboard',                 label: 'Overview',          description: 'Score trends, recent scans, and quick re-scan.' },
      { href: '/dashboard/scans',           label: 'All scans',         description: 'Full history, sortable by URL, date, or score.' },
      { href: '/dashboard/monitor',         label: 'Monitored sites',   description: 'Sites we scan automatically on a schedule.', badge: 'Pro' },
      { href: '/dashboard/scheduled',       label: 'Scheduled scans',   description: 'Set cadence per site (daily / weekly).', badge: 'Pro' },
      { href: '/dashboard/portfolios',      label: 'Portfolios',        description: 'Group sites per client for agency reporting.', badge: 'Agency' },
      { href: '/dashboard/reports',         label: 'Reports',           description: 'Branded PDF exports for stakeholders.', badge: 'Pro' },
      { href: '/dashboard/team',            label: 'Team',              description: 'Invite collaborators with role-based access.', badge: 'Pro' },
      { href: '/dashboard/settings',        label: 'Settings',          description: 'Profile, billing, API key, danger zone.' },
    ],
  },
  {
    title: 'Account & auth',
    description: 'Self-serve password and recovery flows.',
    accent: 'blue',
    routes: [
      { href: '/auth/reset',          label: 'Reset password',         description: 'Set a new password from the email link.' },
      { href: '/auth/start-checkout', label: 'Resume checkout',        description: 'Internal — finishes upgrade after signup.' },
    ],
  },
  {
    title: 'Legal',
    description: 'Policies and platform terms.',
    accent: 'slate',
    routes: [
      { href: '/privacy', label: 'Privacy Policy', description: 'How we collect, store, and use your data.' },
      { href: '/terms',   label: 'Terms of Service', description: 'The agreement that governs using Accessly.' },
    ],
  },
  {
    title: 'Machine-readable',
    description: 'For search engines and crawlers.',
    accent: 'amber',
    routes: [
      { href: '/sitemap.xml', label: 'sitemap.xml', description: 'XML sitemap consumed by Google, Bing, etc.', external: true },
      { href: '/robots.txt',  label: 'robots.txt',  description: 'Crawler rules and sitemap pointer.', external: true },
    ],
  },
]

const accentMap: Record<string, { ring: string; dot: string; text: string; bg: string; glow: string }> = {
  emerald: { ring: 'ring-emerald-200',  dot: 'bg-emerald-500',  text: 'text-emerald-700',  bg: 'bg-emerald-50',  glow: 'from-emerald-200/40' },
  violet:  { ring: 'ring-violet-200',   dot: 'bg-violet-500',   text: 'text-violet-700',   bg: 'bg-violet-50',   glow: 'from-violet-200/40' },
  blue:    { ring: 'ring-blue-200',     dot: 'bg-blue-500',     text: 'text-blue-700',     bg: 'bg-blue-50',     glow: 'from-blue-200/40' },
  slate:   { ring: 'ring-slate-200',    dot: 'bg-slate-500',    text: 'text-slate-700',    bg: 'bg-slate-100',   glow: 'from-slate-200/40' },
  amber:   { ring: 'ring-amber-200',    dot: 'bg-amber-500',    text: 'text-amber-700',    bg: 'bg-amber-50',    glow: 'from-amber-200/40' },
}

export default function SitemapPage() {
  const totalRoutes = sections.reduce((acc, s) => acc + s.routes.length, 0)

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-10 text-center">
        <div className="inline-flex items-center gap-2 bg-white border border-slate-200 rounded-full px-4 py-1.5 mb-6 shadow-sm">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-xs font-semibold text-slate-700">{totalRoutes} pages indexed</span>
        </div>
        <h1 className="font-serif text-4xl sm:text-5xl text-slate-900 mb-4 leading-tight">
          Everything on Accessly,<br />
          <span className="bg-gradient-to-r from-emerald-600 to-violet-600 bg-clip-text text-transparent">in one place.</span>
        </h1>
        <p className="text-slate-500 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
          The full sitemap — every public route grouped by what you&apos;re trying to do.
          Search engines see <Link href="/sitemap.xml" className="text-slate-700 underline-offset-2 underline">sitemap.xml</Link>; this is for humans.
        </p>

        {/* Quick jumps */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
          {sections.map(s => {
            const a = accentMap[s.accent]
            return (
              <a
                key={s.title}
                href={`#${s.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                className={`inline-flex items-center gap-2 ${a.bg} ${a.text} px-3 py-1.5 rounded-full text-xs font-semibold border border-transparent hover:border-current/20 transition`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${a.dot}`} />
                {s.title}
              </a>
            )
          })}
        </div>
      </section>

      {/* Sections */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-24 space-y-10">
        {sections.map(section => {
          const a = accentMap[section.accent]
          const slug = section.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
          return (
            <div key={section.title} id={slug} className="scroll-mt-8">
              <div className="flex items-center gap-3 mb-5">
                <div className={`w-9 h-9 rounded-xl ${a.bg} ring-1 ${a.ring} flex items-center justify-center`}>
                  <span className={`w-2.5 h-2.5 rounded-full ${a.dot}`} />
                </div>
                <div className="min-w-0">
                  <h2 className="font-serif text-2xl text-slate-900 leading-tight">{section.title}</h2>
                  <p className="text-xs text-slate-400 mt-0.5">{section.description}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {section.routes.map(r => {
                  const Comp: React.ElementType = r.external ? 'a' : Link
                  const extraProps = r.external
                    ? { href: r.href, target: '_blank', rel: 'noopener noreferrer' }
                    : { href: r.href }
                  return (
                    <Comp
                      key={r.href}
                      {...extraProps}
                      className="group relative bg-white border border-slate-200 rounded-2xl p-4 hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 block"
                    >
                      <div className={`absolute -inset-px rounded-2xl bg-gradient-to-br ${a.glow} to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none`} aria-hidden="true" />
                      <div className="relative">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="font-semibold text-slate-900 group-hover:text-slate-700 transition">{r.label}</p>
                          {r.badge && (
                            <span className={`text-[9px] font-bold uppercase tracking-widest ${a.bg} ${a.text} px-1.5 py-0.5 rounded-full shrink-0`}>
                              {r.badge}
                            </span>
                          )}
                          <svg
                            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                            className="text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition shrink-0"
                            aria-hidden="true"
                          >
                            <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                          </svg>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">{r.description}</p>
                        <p className="text-[10px] font-mono text-slate-300 mt-2 tracking-wide group-hover:text-slate-400 transition">
                          {r.href}
                        </p>
                      </div>
                    </Comp>
                  )
                })}
              </div>
            </div>
          )
        })}
      </section>

      {/* Footer card */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-16">
        <div className="bg-slate-900 text-white rounded-3xl px-6 sm:px-10 py-10 sm:py-12 text-center relative overflow-hidden">
          <div aria-hidden="true" className="pointer-events-none absolute -top-12 -right-12 w-48 h-48 bg-emerald-400/20 rounded-full blur-3xl" />
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-12 -left-12 w-48 h-48 bg-violet-400/15 rounded-full blur-3xl" />
          <div className="relative">
            <h3 className="font-serif text-3xl mb-3">Can&apos;t find what you need?</h3>
            <p className="text-white/70 text-sm max-w-md mx-auto mb-6 leading-relaxed">
              The dashboard, admin, sales portal, and per-scan pages are gated behind authentication and not listed here. Sign in or contact us.
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Link
                href="/login"
                className="px-5 py-2.5 bg-emerald-400 text-slate-900 font-bold text-sm rounded-xl hover:bg-emerald-300 transition"
              >
                Log in
              </Link>
              <Link
                href="/#contact"
                className="px-5 py-2.5 bg-white/10 border border-white/15 text-white font-semibold text-sm rounded-xl hover:bg-white/20 transition"
              >
                Contact us
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
