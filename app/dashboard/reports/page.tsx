import { createClient } from '@/lib/supabase/server'
import { getTranslations, getLocale } from 'next-intl/server'
import Link from 'next/link'
import Topbar from '@/components/dashboard/Topbar'

type Scan = {
  id: string
  url: string
  score: number
  errors: number
  warnings: number
  created_at: string
}

type Domain = {
  hostname: string
  scans: Scan[]        // chronological, oldest → newest
  latest: Scan
  latestScore: number
  prevScore: number | null
  delta: number | null // positive = improved, negative = regressed, null = only 1 scan
}

function hostname(url: string) {
  try { return new URL(url).hostname } catch { return url }
}

function relativeDate(iso: string, t: (k: string, p?: any) => string, locale: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days  = Math.floor(diff / 86_400_000)
  if (mins  < 1)  return t('justNow')
  if (mins  < 60) return t('minutesAgo', { count: mins })
  if (hours < 24) return t('hoursAgo', { count: hours })
  if (days  < 30) return t('daysAgo', { count: days })
  return new Date(iso).toLocaleDateString(locale, { month: 'short', day: 'numeric' })
}

function scoreColor(score: number) {
  if (score >= 80) return 'text-green-600'
  if (score >= 60) return 'text-amber-500'
  return 'text-red-500'
}

function Sparkline({ scores, regressed }: { scores: number[]; regressed: boolean }) {
  if (scores.length < 2) {
    return (
      <div className="w-28 flex items-center justify-center">
        <span className="text-[11px] text-slate-300">–</span>
      </div>
    )
  }

  const W = 112
  const H = 32
  const pad = 2

  const min = Math.min(...scores)
  const max = Math.max(...scores)
  const range = max - min || 1

  const pts = scores.map((s, i) => {
    const x = pad + (i / (scores.length - 1)) * (W - pad * 2)
    const y = H - pad - ((s - min) / range) * (H - pad * 2)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')

  const stroke = regressed ? '#ef4444' : '#22c55e'

  const lastX = W - pad
  const lastY = H - pad - ((scores[scores.length - 1] - min) / range) * (H - pad * 2)

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="shrink-0">
      <polyline points={pts} fill="none" stroke={stroke} strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lastX.toFixed(1)} cy={lastY.toFixed(1)} r="2.5" fill={stroke} />
    </svg>
  )
}

function DeltaBadge({ delta }: { delta: number | null }) {
  if (delta === null) return <span className="text-xs text-slate-300">–</span>

  if (delta === 0) {
    return (
      <span className="flex items-center gap-0.5 text-xs font-medium text-slate-400">
        <span>±0</span>
      </span>
    )
  }

  const up = delta > 0
  return (
    <span className={`flex items-center gap-0.5 text-xs font-semibold ${up ? 'text-green-600' : 'text-red-500'}`}>
      {/* Arrow */}
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        {up
          ? <><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></>
          : <><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></>
        }
      </svg>
      {up ? '+' : ''}{delta}
    </span>
  )
}

export default async function ReportsPage() {
  const t = await getTranslations('dashboard.reports')
  const tTime = await getTranslations('dashboard.time')
  const locale = await getLocale()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: rows } = await supabase
    .from('scans')
    .select('id, url, score, errors, warnings, created_at')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: true })

  const allScans: Scan[] = rows ?? []

  // Group by hostname; scans stay in ascending order (oldest first)
  const map = new Map<string, Scan[]>()
  for (const scan of allScans) {
    const host = hostname(scan.url)
    if (!map.has(host)) map.set(host, [])
    map.get(host)!.push(scan)
  }

  const domains: Domain[] = Array.from(map.entries()).map(([host, scans]) => {
    const latest = scans[scans.length - 1]
    const prev   = scans.length >= 2 ? scans[scans.length - 2] : null
    const delta  = prev ? latest.score - prev.score : null
    return {
      hostname: host,
      scans,
      latest,
      latestScore: latest.score,
      prevScore: prev?.score ?? null,
      delta,
    }
  })

  // Sort by most recently scanned
  domains.sort((a, b) =>
    new Date(b.latest.created_at).getTime() - new Date(a.latest.created_at).getTime()
  )

  const regressionCount = domains.filter(d => d.delta !== null && d.delta < 0).length

  return (
    <div className="dashboard-scroll flex-1 overflow-y-auto">
      <Topbar title={t('title')} subtitle={t('subtitle')} />

      <div className="p-7 max-w-5xl space-y-5">

        {/* Summary bar */}
        {domains.length > 0 && (
          <div className="flex items-center gap-4 text-sm">
            <span className="text-slate-500">
              {t('domainsTracked', { count: domains.length })}
            </span>

            {regressionCount > 0 && (
              <span className="flex items-center gap-1.5 font-medium text-red-600">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {t('regressionsDetected', { count: regressionCount })}
              </span>
            )}

            {regressionCount === 0 && domains.length > 0 && (
              <span className="flex items-center gap-1.5 font-medium text-green-600">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                {t('allStable')}
              </span>
            )}
          </div>
        )}

        {/* Table */}
        {domains.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl flex flex-col items-center justify-center py-20 text-center">
            <div className="w-12 h-12 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center mb-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
            </div>
            <p className="text-sm font-medium text-slate-700 mb-1">{t('emptyTitle')}</p>
            <p className="text-xs text-slate-400 mb-5">{t('emptySub')}</p>
            <Link href="/dashboard"
              className="text-sm font-semibold bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition">
              {t('goToDashboard')}
            </Link>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            {/* Header row */}
            <div className="grid grid-cols-[1fr_80px_96px_64px_120px_80px] gap-4 px-5 py-3 border-b border-slate-100 bg-slate-50">
              {[
                ['domain', t('tableDomain')],
                ['score', t('tableScore')],
                ['change', t('tableChange')],
                ['scans', t('tableScans')],
                ['trend', t('tableTrend')],
                ['actions', ''],
              ].map(([k, label]) => (
                <span key={k} className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  {label}
                </span>
              ))}
            </div>

            <div className="divide-y divide-slate-50">
              {domains.map(d => {
                const regressed = d.delta !== null && d.delta < 0
                const scores = d.scans.map(s => s.score)

                return (
                  <div
                    key={d.hostname}
                    className={`grid grid-cols-[1fr_80px_96px_64px_120px_80px] gap-4 items-center px-5 py-4 transition-colors hover:bg-slate-50 ${
                      regressed ? 'bg-red-50/40 hover:bg-red-50/60' : ''
                    }`}
                  >
                    {/* Domain */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-slate-800 text-sm truncate">{d.hostname}</span>
                        {regressed && (
                          <span className="shrink-0 text-[11px] font-semibold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                            {t('regressionTag')}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-400">{relativeDate(d.latest.created_at, tTime, locale)}</span>
                    </div>

                    {/* Latest score */}
                    <div className={`font-serif text-2xl leading-none ${scoreColor(d.latestScore)}`}>
                      {d.latestScore}
                    </div>

                    {/* Change arrow + number */}
                    <DeltaBadge delta={d.delta} />

                    {/* Scan count */}
                    <div className="text-sm text-slate-600 font-medium">{d.scans.length}</div>

                    {/* Sparkline */}
                    <Sparkline scores={scores} regressed={regressed} />

                    {/* Link */}
                    <div className="text-right">
                      <Link
                        href={`/dashboard/scans/${d.latest.id}`}
                        className="text-xs font-semibold text-emerald-600 hover:underline whitespace-nowrap"
                      >
                        {t('report')}
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
