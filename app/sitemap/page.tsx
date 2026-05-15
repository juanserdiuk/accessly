import type { Metadata } from 'next'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'Sitemap — Accessly',
  description: 'Every page on Accessly, grouped by section, with descriptions and canonical URLs.',
}

// Canonical domain for all links shown on this page — HARDCODED to the
// production host so the displayed URLs always read "accessly.us/..." even
// when this page is viewed from a preview deployment URL or when the
// NEXT_PUBLIC_SITE_URL env var is mis-set. The sitemap is the canonical
// index of the site; it should never echo a vercel.app preview URL back to
// users.
const SITE_URL = 'https://accessly.us'

interface RouteEntry {
  path: string
  label: string
  description: string
  badge?: string
  external?: boolean
}

interface Section {
  title: string
  description: string
  accent: 'emerald' | 'violet' | 'blue' | 'amber' | 'slate' | 'red' | 'cyan'
  /** Lock icon prefix on section title, for gated areas */
  gated?: boolean
  routes: RouteEntry[]
}

const sections: Section[] = [
  {
    title: 'Marketing',
    description: 'Public pages anyone can visit. The front door to Accessly.',
    accent: 'emerald',
    routes: [
      { path: '/',          label: 'Home',          description: 'WCAG scanner overview, hero, instant URL scan, features.' },
      { path: '/#scanner',  label: 'Instant scan',  description: 'Drop a URL, run a real scan in seconds, no signup.' },
      { path: '/#features', label: 'Features',      description: 'Everything we check, how reports work, integrations.' },
      { path: '/#pricing',  label: 'Pricing',       description: 'Free, Pro, Agency, and Pay-per-scan plans — full comparison.' },
      { path: '/#faq',      label: 'FAQ',           description: 'Common questions about scans, billing, refunds, and limits.' },
      { path: '/about',     label: 'About',         description: 'Founder story, 18-year background, SoCal origin, values, timeline.' },
      { path: '/#contact',  label: 'Contact form',  description: 'Footer contact form — answers within a few hours.' },
    ],
  },
  {
    title: 'Account & authentication',
    description: 'Sign up, sign in, recover access, and resume in-flight purchases.',
    accent: 'blue',
    routes: [
      { path: '/signup',                label: 'Create account',     description: 'Free signup — 3 scans, full WCAG report, no card.' },
      { path: '/login',                 label: 'Log in',             description: 'Returning customer? Email + password.' },
      { path: '/auth/reset',            label: 'Reset password',     description: 'Set a new password from the email recovery link.' },
      { path: '/auth/callback',         label: 'Auth callback',      description: 'Internal — verifies email links and hands off to dashboard.', badge: 'System' },
      { path: '/auth/start-checkout',   label: 'Resume checkout',    description: 'Legacy — older signups that resumed Stripe after verification.', badge: 'Legacy' },
    ],
  },
  {
    title: 'Dashboard',
    description: 'Authenticated customer experience — everything once you log in.',
    accent: 'violet',
    gated: true,
    routes: [
      { path: '/dashboard',                 label: 'Overview',           description: 'Welcome banner, metrics, score trend, recent scans, quick scan.' },
      { path: '/dashboard/scans',           label: 'All scans',          description: 'Full history — filter by URL, date, score.' },
      { path: '/dashboard/scans/[id]',      label: 'Scan detail',        description: 'Full WCAG breakdown, error list, copy-friendly violations.' },
      { path: '/dashboard/monitor',         label: 'Monitored sites',    description: 'Manage sites we scan automatically.', badge: 'Pro/PPS' },
      { path: '/dashboard/scheduled',       label: 'Scheduled scans',    description: 'Cadence per site (daily, weekly).', badge: 'Pro' },
      { path: '/dashboard/portfolios',      label: 'Portfolios',         description: 'Group sites per client for agency reporting.', badge: 'PPS/Pro/Agency' },
      { path: '/dashboard/portfolios/[id]', label: 'Portfolio detail',   description: 'Per-client view: sites, recent scans, share link.' },
      { path: '/dashboard/reports',         label: 'Reports',            description: 'Branded PDF exports for stakeholders.', badge: 'Pro' },
      { path: '/dashboard/team',            label: 'Team',               description: 'Invite collaborators with role-based access.', badge: 'Pro' },
      { path: '/dashboard/settings',        label: 'Settings',           description: 'Profile, avatar, password, billing, API key, danger zone.' },
      { path: '/upgrade',                   label: 'Upgrade & pricing',  description: 'Pick Pro / Agency or buy a pay-per-scan pack.' },
      { path: '/scan/[id]',                 label: 'Public scan share',  description: 'Shareable read-only scan link — works without login.' },
      { path: '/guest/[token]',             label: 'Guest report',       description: 'Token-gated read-only view for clients who don\'t have an account.' },
    ],
  },
  {
    title: 'Admin',
    description: 'Restricted to the ADMIN_EMAIL on Vercel — internal operations console.',
    accent: 'red',
    gated: true,
    routes: [
      { path: '/admin',                  label: 'Overview',           description: 'Stats grid, PPS panel, plan distribution, recent signups + scans, dev bypass.' },
      { path: '/admin/customers',        label: 'Customers',          description: 'Rich cards: avatar, name, company, country, plan, credits, scan count, plan-override buttons.' },
      { path: '/admin/analytics',        label: 'Analytics',          description: 'Funnel, growth, revenue, retention.' },
      { path: '/admin/messages',         label: 'Messages',           description: 'Inbound contact-form inquiries.' },
      { path: '/admin/sales',            label: 'Salespeople',        description: 'CRUD salespeople accounts and commission rates.' },
      { path: '/admin/sales/[id]',       label: 'Salesperson detail', description: 'Per-rep promo codes, redemptions, commission payouts.' },
      { path: '/admin/promos',           label: 'Promo codes',        description: 'CRUD discount codes + Stripe coupons.' },
      { path: '/admin/guests',           label: 'Guest access',       description: 'Create and revoke client-facing guest tokens.' },
    ],
  },
  {
    title: 'Sales portal',
    description: 'For salespeople — restricted to users with the salesperson role.',
    accent: 'amber',
    gated: true,
    routes: [
      { path: '/sales',          label: 'Dashboard',     description: 'Sales rep KPIs: codes, redemptions, monthly + lifetime commission.' },
      { path: '/sales/profile',  label: 'Profile',       description: 'Update name, phone, payout details.' },
    ],
  },
  {
    title: 'Legal',
    description: 'The policies and terms that govern using Accessly.',
    accent: 'slate',
    routes: [
      { path: '/privacy', label: 'Privacy Policy',   description: 'How we collect, store, and use your data.' },
      { path: '/terms',   label: 'Terms of Service', description: 'Agreement governing Accessly usage and billing.' },
    ],
  },
  {
    title: 'Machine-readable',
    description: 'For search engines, crawlers, and indexing tools.',
    accent: 'cyan',
    routes: [
      { path: '/sitemap.xml', label: 'sitemap.xml', description: 'XML sitemap consumed by Google, Bing, and friends.', external: true },
      { path: '/robots.txt',  label: 'robots.txt',  description: 'Crawler rules and pointer to sitemap.xml.', external: true },
      { path: '/docs/api',    label: 'API & Webhooks docs', description: 'REST API for CI/CD scanning, scan-complete webhook spec, compliance-badge embeds.' },
    ],
  },
]

const accentMap: Record<Section['accent'], { ring: string; dot: string; text: string; bg: string; bgSoft: string }> = {
  emerald: { ring: 'ring-emerald-200', dot: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50',  bgSoft: 'from-emerald-100/40' },
  violet:  { ring: 'ring-violet-200',  dot: 'bg-violet-500',  text: 'text-violet-700',  bg: 'bg-violet-50',   bgSoft: 'from-violet-100/40' },
  blue:    { ring: 'ring-blue-200',    dot: 'bg-blue-500',    text: 'text-blue-700',    bg: 'bg-blue-50',     bgSoft: 'from-blue-100/40' },
  amber:   { ring: 'ring-amber-200',   dot: 'bg-amber-500',   text: 'text-amber-700',   bg: 'bg-amber-50',    bgSoft: 'from-amber-100/40' },
  slate:   { ring: 'ring-slate-200',   dot: 'bg-slate-500',   text: 'text-slate-700',   bg: 'bg-slate-100',   bgSoft: 'from-slate-100/40' },
  red:     { ring: 'ring-red-200',     dot: 'bg-red-500',     text: 'text-red-700',     bg: 'bg-red-50',      bgSoft: 'from-red-100/40' },
  cyan:    { ring: 'ring-cyan-200',    dot: 'bg-cyan-500',    text: 'text-cyan-700',    bg: 'bg-cyan-50',     bgSoft: 'from-cyan-100/40' },
}

/**
 * Build the full canonical URL for a route. Anchors (#scanner) and brackets
 * ([id]) are preserved so the displayed string is the literal route shape.
 */
function fullUrl(path: string): string {
  return `${SITE_URL}${path}`
}

export default function SitemapPage() {
  const totalRoutes = sections.reduce((acc, s) => acc + s.routes.length, 0)

  return (
    <>
      <Nav />

      <main id="main-content" className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">

        {/* Hero */}
        <section className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-12 sm:pt-20 pb-12 text-center overflow-hidden">
          <div aria-hidden="true" className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] max-w-[110vw] bg-gradient-to-br from-emerald-200/30 via-violet-200/15 to-transparent rounded-full blur-3xl" />

          <div className="relative">
            <div className="inline-flex items-center gap-2 bg-white border border-slate-200 rounded-full px-4 py-1.5 mb-6 shadow-sm">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-xs font-semibold text-slate-700">{totalRoutes} routes mapped</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-5xl text-slate-900 mb-4 leading-tight tracking-tight">
              Every page on Accessly,<br />
              <span className="bg-gradient-to-r from-emerald-600 to-violet-600 bg-clip-text text-transparent">in one place.</span>
            </h1>
            <p className="text-slate-500 text-sm sm:text-lg max-w-2xl mx-auto leading-relaxed">
              Public marketing, the customer dashboard, admin console, sales portal, and machine-readable indexes — all linking back to <code className="font-mono text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded text-xs sm:text-sm">{SITE_URL.replace(/^https?:\/\//, '')}</code>.
            </p>

            {/* Quick jump chips */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
              {sections.map(section => {
                const a = accentMap[section.accent]
                const slug = section.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
                return (
                  <a
                    key={section.title}
                    href={`#${slug}`}
                    className={`inline-flex items-center gap-2 ${a.bg} ${a.text} px-3 py-1.5 rounded-full text-xs font-semibold border border-transparent hover:border-current/20 transition`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${a.dot}`} />
                    {section.title}
                    <span className="text-[10px] font-normal opacity-60">{section.routes.length}</span>
                  </a>
                )
              })}
            </div>
          </div>
        </section>

        {/* Sections */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-20 space-y-12">
          {sections.map(section => {
            const a = accentMap[section.accent]
            const slug = section.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')

            return (
              <div key={section.title} id={slug} className="scroll-mt-24">
                <div className="flex items-start gap-3 mb-5">
                  <div className={`w-10 h-10 rounded-xl ${a.bg} ring-1 ${a.ring} flex items-center justify-center shrink-0`}>
                    {section.gated ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={a.text}>
                        <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                      </svg>
                    ) : (
                      <span className={`w-2.5 h-2.5 rounded-full ${a.dot}`} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-3 flex-wrap">
                      <h2 className="font-serif text-2xl text-slate-900 leading-tight">{section.title}</h2>
                      <span className="text-xs text-slate-400">{section.routes.length} {section.routes.length === 1 ? 'route' : 'routes'}</span>
                    </div>
                    <p className="text-sm text-slate-500 mt-0.5">{section.description}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {section.routes.map(route => {
                    const isDynamic = route.path.includes('[')
                    const url = fullUrl(route.path)
                    // For dynamic routes, navigating doesn't make sense — render as a non-link card.
                    const Comp: React.ElementType = isDynamic ? 'div' : 'a'
                    const linkProps = isDynamic
                      ? {}
                      : {
                          href: url,
                          ...(route.external
                            ? { target: '_blank', rel: 'noopener noreferrer' }
                            : {}),
                        }
                    return (
                      <Comp
                        key={route.path}
                        {...linkProps}
                        className={`group relative bg-white border border-slate-200 rounded-2xl p-4 transition-all duration-200 block ${
                          isDynamic
                            ? 'opacity-90'
                            : 'hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5 cursor-pointer'
                        }`}
                      >
                        {!isDynamic && (
                          <div className={`absolute -inset-px rounded-2xl bg-gradient-to-br ${a.bgSoft} to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none`} aria-hidden="true" />
                        )}
                        <div className="relative">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <p className={`font-semibold text-slate-900 ${isDynamic ? '' : 'group-hover:text-slate-700'} transition`}>
                              {route.label}
                            </p>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {route.badge && (
                                <span className={`text-[9px] font-bold uppercase tracking-widest ${a.bg} ${a.text} px-1.5 py-0.5 rounded-full whitespace-nowrap`}>
                                  {route.badge}
                                </span>
                              )}
                              {isDynamic ? (
                                <span className="text-[9px] font-bold uppercase tracking-widest bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">
                                  Dynamic
                                </span>
                              ) : (
                                <svg
                                  width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                                  className="text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition shrink-0"
                                  aria-hidden="true"
                                >
                                  {route.external ? (
                                    <>
                                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                                      <polyline points="15 3 21 3 21 9"/>
                                      <line x1="10" y1="14" x2="21" y2="3"/>
                                    </>
                                  ) : (
                                    <>
                                      <line x1="5" y1="12" x2="19" y2="12"/>
                                      <polyline points="12 5 19 12 12 19"/>
                                    </>
                                  )}
                                </svg>
                              )}
                            </div>
                          </div>
                          <p className="text-xs text-slate-500 leading-relaxed mb-2">{route.description}</p>
                          <p className="text-[10px] font-mono text-slate-400 break-all leading-tight" title={url}>
                            {url}
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

        {/* Closing CTA */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-20">
          <div className="bg-slate-900 text-white rounded-3xl px-6 sm:px-10 py-10 sm:py-12 text-center relative overflow-hidden">
            <div aria-hidden="true" className="pointer-events-none absolute -top-12 -right-12 w-48 h-48 bg-emerald-400/20 rounded-full blur-3xl" />
            <div aria-hidden="true" className="pointer-events-none absolute -bottom-12 -left-12 w-48 h-48 bg-violet-400/15 rounded-full blur-3xl" />
            <div className="relative">
              <h3 className="font-serif text-3xl mb-3">Need something else?</h3>
              <p className="text-white/70 text-sm max-w-md mx-auto mb-6 leading-relaxed">
                Dynamic routes (scans, portfolios, salespeople) show as placeholders — they only render with a real id from the dashboard.
              </p>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <a
                  href={`${SITE_URL}/login`}
                  className="px-5 py-2.5 bg-emerald-400 text-slate-900 font-bold text-sm rounded-xl hover:bg-emerald-300 transition"
                >
                  Log in
                </a>
                <a
                  href="mailto:contact@accessly.us"
                  className="px-5 py-2.5 bg-white/10 border border-white/15 text-white font-semibold text-sm rounded-xl hover:bg-white/20 transition"
                >
                  Email contact@accessly.us
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}
