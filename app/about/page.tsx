import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import { createAdminClient } from '@/lib/supabase/admin'

export const metadata: Metadata = {
  title: 'About — Accessly',
  description: 'Built in Southern California by a senior accessibility consultant who spent 18+ years auditing the web by hand. Now we automate the boring parts so you don\'t have to.',
}

/**
 * Pull the founder's avatar from the admin profile so the page stays in
 * sync with whatever Juan has uploaded in /dashboard/settings.
 */
async function getFounderAvatar(): Promise<string | null> {
  const adminEmail = (process.env.ADMIN_EMAIL ?? process.env.NEXT_PUBLIC_ADMIN_EMAIL)?.trim().toLowerCase()
  if (!adminEmail) return null
  try {
    const admin = createAdminClient()
    const { data: users } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 })
    const founder = users?.users?.find(u => u.email?.toLowerCase() === adminEmail)
    if (!founder) return null
    const { data: profile } = await admin
      .from('profiles')
      .select('avatar_url')
      .eq('id', founder.id)
      .single()
    return profile?.avatar_url ?? null
  } catch {
    return null
  }
}

const STATS = [
  { value: '18+',  label: 'Years in accessibility',  sub: 'Front-end + WCAG since 2008' },
  { value: '34%',  label: 'Performance gain',         sub: 'Led ST Math Flash→HTML5 rebuild' },
  { value: '3',    label: 'Languages spoken',         sub: 'English · Spanish · Portuguese' },
  { value: 'AAA',  label: 'WCAG depth',                sub: 'Audited to 2.1 AA + AAA standards' },
]

const TIMELINE: { year: string; role: string; where: string; note: string }[] = [
  {
    year: 'pre-2008',
    role: 'Studied at',
    where: 'UC Irvine',
    note: 'Cut my teeth on the engineering fundamentals at UCI in the late 2000s — Orange County\'s anchor for web technology talent.',
  },
  {
    year: '2008',
    role: 'First front-end role',
    where: 'Ekko Media',
    note: 'Started shipping pixel-perfect sites from Photoshop. The web was simpler. Screen readers weren\'t.',
  },
  {
    year: '2012',
    role: 'Founded a studio',
    where: '99 Trees Media',
    note: 'Built and led a multidisciplinary team — designers, devs, data — across full project lifecycles. Closed our first million-dollar contract by 2015.',
  },
  {
    year: '2016',
    role: 'Senior front-end',
    where: 'MIND Research Institute',
    note: 'Led the ST Math rebuild from Flash to HTML5. +34% performance, +29% mobile engagement, full WAI-ARIA integration. The kind of work that taught me how much manual accessibility audits cost in human time.',
  },
  {
    year: '2022',
    role: 'Scrum Master + Tester',
    where: 'Level Access',
    note: 'Coordinated international teams across three continents and ran code reviews + accessibility QA at scale. Saw the same WCAG patterns flag, week after week, audit after audit.',
  },
  {
    year: '2023',
    role: 'Accessibility consultant',
    where: '99 Trees Media (back to my own studio)',
    note: 'Started consulting for individual clients. Realized I was charging for things a good scanner could catch in seconds.',
  },
  {
    year: '2026',
    role: 'Founder',
    where: 'Accessly',
    note: 'Built the tool I wished I had on day one of every audit. Automated the boring 60% so consultants (and dev teams) can focus on the judgment calls that actually matter.',
    highlight: true,
  } as never,
]

const VALUES = [
  {
    title: 'Accessibility-first, always',
    sub: 'Every screen we ship gets the same WCAG 2.2 treatment we run on yours. Dogfooding isn\'t marketing — it\'s how we catch regressions before you do.',
    accent: 'emerald',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/><line x1="20" y1="12" x2="22" y2="12"/><line x1="2" y1="12" x2="4" y2="12"/>
      </svg>
    ),
  },
  {
    title: 'Honest pricing, no traps',
    sub: 'Free tier is real — 3 scans, full reports, no card. Pro and Agency are flat. Pay-per-scan is genuinely pay-only-when-you-need-it. Cancel any time from the Stripe portal — one click, no friction.',
    accent: 'violet',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
      </svg>
    ),
  },
  {
    title: 'Built by a practitioner',
    sub: 'I\'ve filed the bug reports and written the remediation plans. Every feature here exists because I personally needed it on a real audit — not because a market research deck suggested it.',
    accent: 'amber',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
  },
  {
    title: 'Made in Southern California',
    sub: 'Headquartered in Corona, California (Greater LA / OC border). Three languages — English, Spanish, Portuguese — one ocean view, zero VC pressure. We answer email from real humans, within hours, not days.',
    accent: 'cyan',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.5 19a2.5 2.5 0 0 1-2.5-2.5V8.5A2.5 2.5 0 0 1 17.5 6a2.5 2.5 0 0 1 2.5 2.5V19"/><path d="M9 9c0-3.866 3-7 6.5-7"/><path d="M3 19h20"/><path d="M3 19a4 4 0 0 1 4-4h0"/><path d="M9 19V9"/>
      </svg>
    ),
  },
]

const accentMap: Record<string, { ring: string; dot: string; text: string; bg: string }> = {
  emerald: { ring: 'ring-emerald-200', dot: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50' },
  violet:  { ring: 'ring-violet-200',  dot: 'bg-violet-500',  text: 'text-violet-700',  bg: 'bg-violet-50' },
  amber:   { ring: 'ring-amber-200',   dot: 'bg-amber-500',   text: 'text-amber-700',   bg: 'bg-amber-50' },
  cyan:    { ring: 'ring-cyan-200',    dot: 'bg-cyan-500',    text: 'text-cyan-700',    bg: 'bg-cyan-50' },
}

export default async function AboutPage() {
  const avatarUrl = await getFounderAvatar()

  return (
    <>
      <Nav />

      <main id="main-content" className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">

        {/* Hero */}
        <section className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-16 sm:pt-20 pb-12 text-center">
          <div aria-hidden="true" className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-gradient-to-br from-emerald-200/30 via-violet-200/15 to-transparent rounded-full blur-3xl" />

          <div className="relative">
            <div className="inline-flex items-center gap-2 bg-white border border-slate-200 rounded-full px-4 py-1.5 mb-6 shadow-sm">
              <span className="text-base leading-none">🌴</span>
              <span className="text-xs font-semibold text-slate-700">Made in Southern California</span>
            </div>

            <h1 className="font-serif text-4xl sm:text-6xl text-slate-900 mb-5 leading-[1.05] tracking-tight">
              Accessibility,<br />
              <span className="bg-gradient-to-r from-emerald-600 via-cyan-600 to-violet-600 bg-clip-text text-transparent">audited honestly.</span>
            </h1>
            <p className="text-slate-500 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
              Accessly was founded in Corona, California by a senior accessibility consultant who spent 18 years filing the same WCAG bug reports — and got tired of charging clients to do work a good scanner can do in seconds.
            </p>
          </div>
        </section>

        {/* Founder card */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-16">
          <div className="relative bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-xl shadow-slate-200/40 overflow-hidden">
            {/* Decorative gradient orbs */}
            <div aria-hidden="true" className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 bg-gradient-to-br from-emerald-300/30 via-cyan-300/20 to-transparent rounded-full blur-3xl" />
            <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 -left-24 w-72 h-72 bg-gradient-to-br from-violet-300/20 via-emerald-200/10 to-transparent rounded-full blur-3xl" />

            <div className="relative grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-6 sm:gap-10 items-center">

              {/* Photo with enhancement treatment */}
              <div className="relative shrink-0 mx-auto sm:mx-0">
                {/* Outer glow + gradient ring */}
                <div aria-hidden="true" className="absolute -inset-3 bg-gradient-to-br from-emerald-400 via-cyan-400 to-violet-500 rounded-full blur-md opacity-60" />
                <div className="relative w-40 h-40 sm:w-44 sm:h-44 rounded-full overflow-hidden ring-4 ring-white shadow-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                  {avatarUrl ? (
                    <>
                      {/* The avatar with subtle filters to make it pop */}
                      <Image
                        src={avatarUrl}
                        alt="Juan Serdiuk, founder of Accessly"
                        fill
                        sizes="(min-width: 640px) 176px, 160px"
                        unoptimized
                        className="object-cover"
                        style={{ filter: 'brightness(1.04) contrast(1.06) saturate(1.1)' }}
                      />
                      {/* Soft duotone overlay — emerald top-right, violet bottom-left */}
                      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-br from-emerald-400/10 via-transparent to-violet-500/15 mix-blend-overlay" />
                      {/* Gentle vignette for premium feel */}
                      <div aria-hidden="true" className="absolute inset-0 shadow-[inset_0_-30px_40px_-20px_rgba(0,0,0,0.25)] rounded-full" />
                    </>
                  ) : (
                    // Fallback when no avatar is uploaded yet
                    <div className="absolute inset-0 flex items-center justify-center text-5xl font-serif text-emerald-400 font-bold">
                      JS
                    </div>
                  )}
                </div>
                {/* Verified badge */}
                <div className="absolute -bottom-1 -right-1 w-9 h-9 bg-emerald-500 rounded-full border-4 border-white flex items-center justify-center shadow-lg" title="Founder">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
              </div>

              {/* Bio */}
              <div className="text-center sm:text-left min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 mb-2">Founder & Builder</p>
                <h2 className="font-serif text-3xl sm:text-4xl text-slate-900 mb-1 leading-tight">Juan Serdiuk</h2>
                <p className="text-sm text-slate-500 mb-4 leading-relaxed">
                  Senior accessibility consultant · 18+ years front-end · UC Irvine · ex-Level Access · ex-MIND Research Institute · trilingual (EN · ES · PT) · Corona, CA.
                </p>
                <p className="text-base text-slate-700 leading-relaxed">
                  I started in 2008 making pixel-perfect sites from Photoshop. I&apos;ve since led international teams across three continents, rebuilt a 100M-user education product from Flash to HTML5 (+34% performance), and audited more sites for WCAG 2.1 AA/AAA than I can count.
                  Accessly is what I wanted on day one of every single one of those audits.
                </p>
                <div className="mt-5 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <a href="https://www.linkedin.com/in/juan-serdiuk-72962b99" target="_blank" rel="noopener noreferrer"
                     className="inline-flex items-center gap-1.5 text-xs font-semibold bg-slate-900 text-white px-3.5 py-2 rounded-lg hover:bg-slate-700 transition">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
                    Juan on LinkedIn
                  </a>
                  <a href="https://www.linkedin.com/company/accessly-web-scanner/" target="_blank" rel="noopener noreferrer"
                     className="inline-flex items-center gap-1.5 text-xs font-semibold border border-slate-200 text-slate-700 px-3.5 py-2 rounded-lg hover:bg-slate-50 transition">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
                    Accessly on LinkedIn
                  </a>
                  <a href="mailto:contact@accessly.us"
                     className="inline-flex items-center gap-1.5 text-xs font-semibold border border-slate-200 text-slate-700 px-3.5 py-2 rounded-lg hover:bg-slate-50 transition">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                    Email
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* By the numbers */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-16">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {STATS.map((s) => (
              <div key={s.label} className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 hover:border-slate-300 hover:shadow-md transition">
                <p className="font-serif text-4xl sm:text-5xl bg-gradient-to-br from-slate-900 to-slate-600 bg-clip-text text-transparent mb-1">{s.value}</p>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-700 mb-0.5">{s.label}</p>
                <p className="text-xs text-slate-400 leading-relaxed">{s.sub}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Origin story */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-16">
          <div className="mb-8 text-center">
            <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-700 mb-2">Why this exists</p>
            <h2 className="font-serif text-3xl sm:text-4xl text-slate-900 mb-2">The origin story.</h2>
            <p className="text-sm text-slate-400">Short version: I built it because I had to.</p>
          </div>
          <div className="space-y-5 text-slate-700 leading-relaxed">
            <p>
              In 2022 I was running accessibility QA on a project for a Fortune 500 client at Level Access. Same workflow as every audit before it: spin up the staging URL, open DevTools, run axe-core, walk every page with a screen reader, file 40 Jira tickets, write a 12-page PDF. Repeat.
            </p>
            <p>
              The pattern was so consistent that one Tuesday I just&hellip; counted. <strong className="text-slate-900">60% of the violations</strong> on a typical audit were ones a good scanner could catch automatically. The remaining 40% — the judgment calls about heading hierarchy, the contrast on stylized text, the keyboard trap inside a custom widget — that&apos;s where I earned my fee. But the first 60% was billable hours spent on stuff that should have been a CI step.
            </p>
            <p>
              That weekend I started writing what would become Accessly. A scanner that catches the boring 60% the second you push a commit, so consultants like me can focus on the part of accessibility work that actually requires a human. And so dev teams can stop being surprised in production.
            </p>
            <p className="text-slate-500 italic">
              That&apos;s the entire pitch. There is no clever VC narrative. I just wanted a tool that didn&apos;t exist.
            </p>
          </div>
        </section>

        {/* Values */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-16">
          <div className="mb-8 text-center">
            <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-700 mb-2">What we believe</p>
            <h2 className="font-serif text-3xl sm:text-4xl text-slate-900 mb-2">Four things, in order.</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {VALUES.map((v) => {
              const a = accentMap[v.accent]
              return (
                <div key={v.title} className="group relative bg-white border border-slate-200 rounded-2xl p-6 hover:border-slate-300 hover:shadow-md transition">
                  <div className={`w-11 h-11 rounded-xl ${a.bg} ring-1 ${a.ring} flex items-center justify-center mb-4 ${a.text}`}>
                    {v.icon}
                  </div>
                  <h3 className="font-serif text-xl text-slate-900 mb-2 leading-tight">{v.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{v.sub}</p>
                </div>
              )
            })}
          </div>
        </section>

        {/* Timeline */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-16">
          <div className="mb-8 text-center">
            <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-700 mb-2">How we got here</p>
            <h2 className="font-serif text-3xl sm:text-4xl text-slate-900 mb-2">18 years of receipts.</h2>
            <p className="text-sm text-slate-400">Real jobs, real outcomes. Not a startup origin story arc.</p>
          </div>
          <ol className="relative border-l-2 border-slate-200 ml-3">
            {TIMELINE.map((t) => {
              const highlighted = (t as { highlight?: boolean }).highlight
              return (
                <li key={t.year + t.where} className="relative pl-8 pb-8 last:pb-0">
                  <div className={`absolute -left-[9px] w-4 h-4 rounded-full ring-4 ring-white ${
                    highlighted ? 'bg-emerald-500' : 'bg-slate-300'
                  }`} />
                  <div className="flex items-baseline gap-3 flex-wrap mb-1">
                    <span className={`font-mono text-xs font-bold tracking-wide ${
                      highlighted ? 'text-emerald-700' : 'text-slate-400'
                    }`}>
                      {t.year}
                    </span>
                    <span className="font-semibold text-slate-900">{t.role}</span>
                    <span className="text-xs text-slate-400">at {t.where}</span>
                  </div>
                  <p className={`text-sm leading-relaxed ${highlighted ? 'text-slate-700' : 'text-slate-500'}`}>
                    {t.note}
                  </p>
                </li>
              )
            })}
          </ol>
        </section>

        {/* Closing CTA */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-20">
          <div className="bg-slate-900 text-white rounded-3xl px-6 sm:px-12 py-12 sm:py-16 text-center relative overflow-hidden">
            <div aria-hidden="true" className="pointer-events-none absolute -top-16 -right-16 w-64 h-64 bg-emerald-400/20 rounded-full blur-3xl" />
            <div aria-hidden="true" className="pointer-events-none absolute -bottom-16 -left-16 w-64 h-64 bg-violet-400/15 rounded-full blur-3xl" />
            <div className="relative">
              <h3 className="font-serif text-3xl sm:text-4xl mb-4">Run your first scan free.</h3>
              <p className="text-white/70 text-sm sm:text-base max-w-md mx-auto mb-8 leading-relaxed">
                3 scans, full WCAG 2.2 report, no card. No demo call required. Drop a URL and see what we&apos;d catch.
              </p>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 bg-emerald-400 text-slate-900 font-bold px-6 py-3 rounded-xl hover:bg-emerald-300 transition text-sm"
                >
                  Start free
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                  </svg>
                </Link>
                <a
                  href="mailto:contact@accessly.us"
                  className="inline-flex items-center gap-2 bg-white/10 border border-white/15 text-white font-semibold px-6 py-3 rounded-xl hover:bg-white/20 transition text-sm"
                >
                  Email Juan directly
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
