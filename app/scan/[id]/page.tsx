import { createAdminClient } from '@/lib/supabase/admin'
import { getTranslations, getLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'

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

const impactStyles: Record<string, string> = {
  critical: 'bg-red-100 text-red-700',
  serious:  'bg-orange-100 text-orange-700',
  moderate: 'bg-amber-100 text-amber-700',
  minor:    'bg-slate-100 text-slate-500',
}

function hostname(url: string) {
  try { return new URL(url).hostname } catch { return url }
}

function formatDate(iso: string, locale: string) {
  return new Date(iso).toLocaleDateString(locale, {
    month: 'long', day: 'numeric', year: 'numeric',
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

export default async function PublicScanReportPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const t = await getTranslations('scanReport')
  const locale = await getLocale()
  const { id } = await params
  const supabase = createAdminClient()

  const { data: scan } = await supabase
    .from('scans')
    .select('id, url, score, errors, warnings, passes, violations, created_at')
    .eq('id', id)
    .single()

  if (!scan) notFound()

  const violations: Violation[] = ((scan.violations as Violation[]) ?? [])
    .slice()
    .sort((a, b) => (impactOrder[a.impact] ?? 9) - (impactOrder[b.impact] ?? 9))

  const circumference = 2 * Math.PI * 56
  const color = gaugeColor(scan.score)

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Nav */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-emerald-400 rounded-lg flex items-center justify-center shrink-0">
              <span className="text-slate-900 text-xs font-bold">A</span>
            </div>
            <span className="font-serif text-lg text-slate-900">Accessly</span>
          </Link>
          <Link
            href="/signup"
            className="text-sm font-semibold bg-slate-900 text-white px-4 py-1.5 rounded-lg hover:bg-slate-700 transition"
          >
            {t('publicHeader')}
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10 space-y-5">
        {/* Report header */}
        <div className="bg-white border border-slate-200 rounded-2xl px-6 py-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">{t('reportLabel')}</p>
              <a
                href={scan.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-800 font-medium hover:text-emerald-600 transition break-all text-lg"
              >
                {scan.url}
              </a>
            </div>
            <span className="text-xs text-slate-400 whitespace-nowrap pt-1">{formatDate(scan.created_at, locale)}</span>
          </div>
        </div>

        {/* Score gauge + metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-4">{t('score')}</p>
            <div className="relative w-36 h-36">
              <svg className="-rotate-90" width="144" height="144" viewBox="0 0 144 144">
                <circle cx="72" cy="72" r="56" fill="none" stroke="#f1f5f9" strokeWidth="12" />
                <circle cx="72" cy="72" r="56" fill="none" stroke={color} strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference * (1 - scan.score / 100)} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`font-serif text-4xl ${scoreTextColor(scan.score)}`}>{scan.score}</span>
                <span className="text-xs text-slate-400">/100</span>
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

        {/* Violations table */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <div className="font-semibold text-slate-900">{t('violations')}</div>
            <div className="text-xs text-slate-400 mt-0.5">
              {violations.length === 0
                ? t('noViolations')
                : t('issuesDetected', { count: violations.length })}
            </div>
          </div>

          {violations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mb-3">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <p className="text-slate-600 text-sm font-medium">{t('noViolations')}</p>
              <p className="text-slate-400 text-xs mt-1">{t('noViolationsSub')}</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide w-28">{t('tableImpact')}</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">{t('tableIssue')}</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide w-28">{t('tableElements')}</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide w-40">{t('tableWcag')}</th>
                  <th className="px-4 py-3 w-28" />
                </tr>
              </thead>
              <tbody>
                {violations.map((v, i) => (
                  <tr key={v.id + i} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition align-top">
                    <td className="px-5 py-4">
                      <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${impactStyles[v.impact] ?? 'bg-slate-100 text-slate-500'}`}>
                        {v.impact}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-medium text-slate-800 mb-0.5">{v.help}</div>
                      <div className="text-xs text-slate-400 leading-relaxed max-w-md">{v.description}</div>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600 whitespace-nowrap">
                      {t('elementCount', { count: v.nodes.length })}
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-xs text-slate-500 font-mono">{v.wcag || '—'}</span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <a
                        href={v.helpUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold text-emerald-600 hover:underline whitespace-nowrap"
                      >
                        {t('learnMore')}
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer CTA */}
        <div className="text-center py-4">
          <p className="text-xs text-slate-400">
            {t('footerPrefix')}{' '}
            <Link href="/" className="text-emerald-600 font-semibold hover:underline">Accessly</Link>
            {' '}{t('footerSuffix')}
          </p>
        </div>
      </main>
    </div>
  )
}
