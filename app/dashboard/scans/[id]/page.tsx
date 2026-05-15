import { createClient } from '@/lib/supabase/server'
import { getTranslations, getLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Topbar from '@/components/dashboard/Topbar'
import ShareButton from '@/components/dashboard/ShareButton'
import PrintButton from '@/components/dashboard/PrintButton'
import ViolationAccordion from '@/components/dashboard/ViolationAccordion'

type NodeDetail = {
  html: string
  target: string | null
  failureSummary: string | null
  impact: string | null
}

type Violation = {
  id: string
  impact: 'critical' | 'serious' | 'moderate' | 'minor'
  description: string
  help: string
  helpUrl: string
  wcag: string
  nodes: NodeDetail[]
}

const impactOrder: Record<string, number> = { critical: 0, serious: 1, moderate: 2, minor: 3 }

function hostname(url: string) {
  try { return new URL(url).hostname } catch { return url }
}

function formatDate(iso: string, locale: string) {
  return new Date(iso).toLocaleDateString(locale, {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function gaugeColor(score: number) {
  if (score >= 80) return '#22c55e'
  if (score >= 60) return '#f59e0b'
  return '#ef4444'
}

function scoreTextColor(score: number) {
  if (score >= 80) return 'text-green-600'
  if (score >= 60) return 'text-amber-500'
  return 'text-red-500'
}

export default async function ScanReportPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const t = await getTranslations('scanReport')
  const locale = await getLocale()
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: scan } = await supabase
    .from('scans')
    .select('id, url, score, errors, warnings, passes, violations, created_at')
    .eq('id', id)
    .eq('user_id', user!.id)
    .single()

  if (!scan) notFound()

  const violations: Violation[] = ((scan.violations as Violation[]) ?? [])
    .slice()
    .sort((a, b) => (impactOrder[a.impact] ?? 9) - (impactOrder[b.impact] ?? 9))

  // Comparison panel: find the most recent earlier scan of the SAME URL by
  // the same user so we can show what got fixed / regressed since last time.
  const { data: previousScan } = await supabase
    .from('scans')
    .select('id, score, errors, warnings, violations, created_at')
    .eq('user_id', user!.id)
    .eq('url', scan.url)
    .lt('created_at', scan.created_at)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  // Rule-level diff. Match violations by their WCAG rule id (e.g.
  // 'color-contrast'). This is more actionable than node-level — the user
  // wants to know "did we fix the contrast issue?" not "did node #4 get
  // re-styled?".
  const prevViolations: Violation[] = (previousScan?.violations as Violation[] | null) ?? []
  const currIds = new Set(violations.map(v => v.id))
  const prevIds = new Set(prevViolations.map(v => v.id))
  const fixedViolations    = prevViolations.filter(v => !currIds.has(v.id))
  const newViolations      = violations.filter(v => !prevIds.has(v.id))
  const carriedViolations  = violations.filter(v => prevIds.has(v.id))
  const scoreDelta = previousScan ? scan.score - (previousScan.score ?? 0) : null

  const circumference = 2 * Math.PI * 56
  const color = gaugeColor(scan.score)

  return (
    <div className="dashboard-scroll flex-1 overflow-y-auto">
      <Topbar title={t('title')} subtitle={hostname(scan.url)} />

      <div className="p-4 sm:p-7 space-y-5 max-w-5xl print:max-w-none print:p-0">

        {/* Print-only header — hidden on screen */}
        <div className="hidden print:flex items-center justify-between border-b border-slate-200 pb-5 mb-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-emerald-400 rounded-lg flex items-center justify-center shrink-0">
              <span className="text-slate-900 text-xs font-bold">A</span>
            </div>
            <span className="font-serif text-lg text-slate-900">Accessly</span>
          </div>
          <span className="text-xs text-slate-400">{t('scanLine', { date: formatDate(scan.created_at, locale) })}</span>
        </div>

        {/* Back + actions — hidden when printing */}
        <div className="flex items-center justify-between print:hidden">
          <Link
            href="/dashboard/scans"
            className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-700 transition"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            {t('allScans')}
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">{formatDate(scan.created_at, locale)}</span>
            <ShareButton scanId={scan.id} />
            <PrintButton />
          </div>
        </div>

        {/* URL */}
        <div className="bg-white border border-slate-200 rounded-2xl px-6 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">{t('scannedUrl')}</p>
          <a
            href={scan.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-800 font-medium hover:text-emerald-600 transition break-all"
          >
            {scan.url}
          </a>
        </div>

        {/* Score gauge + 3 metric cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-4">{t('score')}</p>
            <div className="relative w-40 h-40 overflow-visible">
              <svg
                className="-rotate-90"
                width="160"
                height="160"
                viewBox="-16 -16 176 176"
                overflow="visible"
                style={{ overflow: 'visible' }}
              >
                <circle cx="72" cy="72" r="54" fill="none" stroke="#f1f5f9" strokeWidth="12" />
                <circle cx="72" cy="72" r="54" fill="none" stroke={color} strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 54}
                  strokeDashoffset={2 * Math.PI * 54 * (1 - scan.score / 100)} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
                <span className={`font-serif text-4xl leading-none ${scoreTextColor(scan.score)}`}>{scan.score}</span>
                <span className="text-xs text-slate-400 leading-none">/100</span>
              </div>
            </div>
          </div>

          {([
            {
              label: t('errors'), value: scan.errors,
              bg: 'bg-red-50', text: 'text-red-600', ring: 'ring-red-100',
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              ),
            },
            {
              label: t('warnings'), value: scan.warnings,
              bg: 'bg-amber-50', text: 'text-amber-500', ring: 'ring-amber-100',
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              ),
            },
            {
              label: t('passes'), value: scan.passes,
              bg: 'bg-green-50', text: 'text-green-600', ring: 'ring-green-100',
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              ),
            },
          ] as const).map(({ label, value, bg, text, ring, icon }) => (
            <div key={label} className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${bg} ring-2 ${ring} flex items-center justify-center`}>
                {icon}
              </div>
              <div className="text-center">
                <div className={`font-serif text-4xl ${text}`}>{value}</div>
                <div className="text-xs text-slate-400 font-medium uppercase tracking-wide mt-1">{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Comparison vs previous scan of the same URL */}
        {previousScan ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 print:hidden">
            <div className="flex items-start justify-between gap-3 flex-wrap mb-5">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                  Compared to last scan
                </p>
                <h2 className="font-serif text-xl text-slate-900 leading-tight">
                  {scoreDelta != null && scoreDelta > 0 && <>You fixed things since <span className="text-slate-500 font-normal">{formatDate(previousScan.created_at, locale)}</span></>}
                  {scoreDelta != null && scoreDelta < 0 && <>Score regressed since <span className="text-slate-500 font-normal">{formatDate(previousScan.created_at, locale)}</span></>}
                  {scoreDelta === 0 && <>No change since <span className="text-slate-500 font-normal">{formatDate(previousScan.created_at, locale)}</span></>}
                </h2>
              </div>
              <Link
                href={`/dashboard/scans/${previousScan.id}`}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 transition shrink-0"
              >
                View previous scan →
              </Link>
            </div>

            {/* Three delta tiles: score, fixed, new */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-5">
              <div className="text-center">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1">Score</p>
                <p className={`font-serif text-3xl sm:text-4xl ${
                  scoreDelta != null && scoreDelta > 0 ? 'text-green-600' :
                  scoreDelta != null && scoreDelta < 0 ? 'text-red-500' : 'text-slate-700'
                }`}>
                  {scoreDelta != null && scoreDelta > 0 && '+'}
                  {scoreDelta != null ? scoreDelta : '—'}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">{previousScan.score} → {scan.score}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1">Fixed</p>
                <p className={`font-serif text-3xl sm:text-4xl ${fixedViolations.length > 0 ? 'text-green-600' : 'text-slate-300'}`}>
                  {fixedViolations.length}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">issue{fixedViolations.length === 1 ? '' : 's'} resolved</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1">New</p>
                <p className={`font-serif text-3xl sm:text-4xl ${newViolations.length > 0 ? 'text-red-500' : 'text-slate-300'}`}>
                  {newViolations.length}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">{newViolations.length === 1 ? 'regression' : 'regressions'}</p>
              </div>
            </div>

            {/* Expandable detail lists — only render the sections that have items */}
            {(fixedViolations.length > 0 || newViolations.length > 0) && (
              <div className="space-y-2 border-t border-slate-100 pt-4">
                {fixedViolations.length > 0 && (
                  <details className="group bg-emerald-50/40 border border-emerald-100 rounded-xl overflow-hidden hover:border-emerald-200 transition">
                    <summary className="flex items-center justify-between gap-3 px-4 py-3 cursor-pointer select-none list-none">
                      <span className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
                        <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        {fixedViolations.length} issue{fixedViolations.length === 1 ? '' : 's'} you fixed
                      </span>
                      <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-700 transition-transform group-open:rotate-180">
                        <polyline points="6 9 12 15 18 9"/>
                      </svg>
                    </summary>
                    <ul className="px-4 pb-4 space-y-2">
                      {fixedViolations.map(v => (
                        <li key={v.id} className="bg-white border border-emerald-100 rounded-lg px-3 py-2.5 text-xs">
                          <div className="flex items-baseline gap-2 mb-0.5 flex-wrap">
                            <code className="font-mono font-semibold text-emerald-800">{v.id}</code>
                            <span className="text-slate-400">·</span>
                            <span className="text-slate-600">WCAG {v.wcag}</span>
                          </div>
                          <p className="text-slate-600 leading-relaxed">{v.description}</p>
                        </li>
                      ))}
                    </ul>
                  </details>
                )}

                {newViolations.length > 0 && (
                  <details className="group bg-red-50/40 border border-red-100 rounded-xl overflow-hidden hover:border-red-200 transition">
                    <summary className="flex items-center justify-between gap-3 px-4 py-3 cursor-pointer select-none list-none">
                      <span className="flex items-center gap-2 text-sm font-semibold text-red-800">
                        <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                        </svg>
                        {newViolations.length} new issue{newViolations.length === 1 ? '' : 's'} since last scan
                      </span>
                      <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-700 transition-transform group-open:rotate-180">
                        <polyline points="6 9 12 15 18 9"/>
                      </svg>
                    </summary>
                    <ul className="px-4 pb-4 space-y-2">
                      {newViolations.map(v => (
                        <li key={v.id} className="bg-white border border-red-100 rounded-lg px-3 py-2.5 text-xs">
                          <div className="flex items-baseline gap-2 mb-0.5 flex-wrap">
                            <code className="font-mono font-semibold text-red-800">{v.id}</code>
                            <span className="text-slate-400">·</span>
                            <span className="text-slate-600">WCAG {v.wcag}</span>
                            <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full ${
                              v.impact === 'critical' ? 'bg-red-100 text-red-700' :
                              v.impact === 'serious'  ? 'bg-orange-100 text-orange-700' :
                              v.impact === 'moderate' ? 'bg-amber-100 text-amber-700' :
                                                        'bg-slate-100 text-slate-600'
                            }`}>{v.impact}</span>
                          </div>
                          <p className="text-slate-600 leading-relaxed">{v.description}</p>
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
            )}

            {carriedViolations.length > 0 && (
              <p className="text-xs text-slate-400 mt-4 pt-4 border-t border-slate-100">
                <span className="font-semibold text-slate-600">{carriedViolations.length}</span> issue{carriedViolations.length === 1 ? '' : 's'} still present in both scans — see the full list below.
              </p>
            )}
          </div>
        ) : (
          <div className="bg-slate-50 border border-slate-200 border-dashed rounded-2xl p-6 sm:p-7 print:hidden">
            <div className="flex items-center gap-3">
              <div aria-hidden="true" className="w-9 h-9 bg-white border border-slate-200 rounded-xl flex items-center justify-center shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
              <div>
                <p className="font-semibold text-slate-700 text-sm">First scan for this URL</p>
                <p className="text-xs text-slate-500 mt-0.5">Re-scan this URL later to see fixed / new issues compared to today.</p>
              </div>
            </div>
          </div>
        )}

        {/* Violations */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-semibold text-slate-900">{t('violations')}</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {violations.length === 0
                  ? t('noViolations')
                  : t('issuesDetectedClickable', { count: violations.length })}
              </p>
            </div>
          </div>

          {violations.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mb-3">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <p className="text-slate-600 text-sm font-medium">{t('noViolations')}</p>
              <p className="text-slate-400 text-xs mt-1">{t('noViolationsSub')}</p>
            </div>
          ) : (
            <ViolationAccordion violations={violations} />
          )}
        </div>

      </div>
    </div>
  )
}
