import { createClient } from '@/lib/supabase/server'
import { getTranslations, getLocale } from 'next-intl/server'
import Topbar from '@/components/dashboard/Topbar'
import MetricCard from '@/components/dashboard/MetricCard'
import QuickScan from '@/components/dashboard/QuickScan'

type Scan = {
  id: string
  url: string
  score: number
  errors: number
  warnings: number
  passes: number
  created_at: string
}

function hostname(url: string) {
  try { return new URL(url).hostname } catch { return url }
}

function relativeTime(iso: string, t: (k: string, p?: any) => string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(mins / 60)
  const days = Math.floor(hours / 24)
  if (mins < 60) return t('minutesAgo', { count: mins })
  if (hours < 24) return t('hoursAgo', { count: hours })
  if (days === 1) return t('yesterday')
  return t('daysAgo', { count: days })
}

function scoreColor(score: number) {
  if (score >= 80) return 'text-green-600'
  if (score >= 60) return 'text-amber-500'
  return 'text-red-500'
}

function scoreBadgeBg(score: number) {
  if (score >= 80) return 'bg-green-50 text-green-600'
  if (score >= 60) return 'bg-amber-50 text-amber-600'
  return 'bg-red-50 text-red-500'
}

function ScoreChart({ scans, locale }: { scans: Scan[]; locale: string }) {
  if (scans.length < 2) return null
  const chrono = [...scans].reverse()
  const scores = chrono.map(s => s.score)
  const labels = chrono.map(s =>
    new Date(s.created_at).toLocaleDateString(locale, { month: 'short', day: 'numeric' })
  )

  const W = 500, H = 140, PL = 20, PR = 10, PT = 10, PB = 24
  const cw = W - PL - PR, ch = H - PT - PB
  const px = (i: number) => PL + (i / Math.max(scores.length - 1, 1)) * cw
  const py = (v: number) => PT + ch - (v / 100) * ch
  const pts = scores.map((v, i) => [px(i), py(v)] as [number, number])

  let d = `M ${pts[0][0]} ${pts[0][1]}`
  for (let i = 1; i < pts.length; i++) {
    const cpx = (pts[i - 1][0] + pts[i][0]) / 2
    d += ` C ${cpx} ${pts[i - 1][1]} ${cpx} ${pts[i][1]} ${pts[i][0]} ${pts[i][1]}`
  }
  const area = d + ` L ${pts[pts.length - 1][0]} ${H} L ${pts[0][0]} ${H} Z`

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="overflow-visible">
      <defs>
        <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#00d4aa" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#00d4aa" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[25, 50, 75, 100].map(v => (
        <line key={v} x1={PL} y1={py(v)} x2={W - PR} y2={py(v)} stroke="#f1f5f9" strokeWidth="1" />
      ))}
      <path d={area} fill="url(#scoreGrad)" />
      <path d={d} fill="none" stroke="#00d4aa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i === pts.length - 1 ? 5 : 3.5}
          fill={i === pts.length - 1 ? '#00d4aa' : '#fff'}
          stroke="#00d4aa" strokeWidth="2" />
      ))}
      {labels.map((l, i) => (
        <text key={l + i} x={px(i)} y={H} fontSize="9" fill="#94a3b8" textAnchor="middle" fontFamily="system-ui">{l}</text>
      ))}
    </svg>
  )
}

async function EmptyState() {
  const t = await getTranslations('dashboard.home')
  return (
    <div className="flex-1 overflow-y-auto">
      <Topbar title={t('title')} />
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-8 text-center">
        <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-5">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </div>
        <h2 className="font-serif text-2xl text-slate-900 mb-2">{t('emptyTitle')}</h2>
        <p className="text-slate-500 text-sm mb-8 max-w-sm leading-relaxed">
          {t('emptySub')}
        </p>
        <div className="w-full max-w-md">
          <QuickScan />
        </div>
      </div>
    </div>
  )
}

export default async function DashboardPage() {
  const t = await getTranslations('dashboard.home')
  const tTime = await getTranslations('dashboard.time')
  const locale = await getLocale()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [profileRes, scansRes] = await Promise.all([
    supabase.from('profiles').select('plan, scan_count').eq('id', user!.id).single(),
    supabase.from('scans')
      .select('id, url, score, errors, warnings, passes, created_at')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  const scans: Scan[] = scansRes.data ?? []

  if (scans.length === 0) return <EmptyState />

  // Derived metrics
  const avgScore = Math.round(scans.reduce((s, r) => s + r.score, 0) / scans.length)
  const openErrors = scans.slice(0, 10).reduce((s, r) => s + r.errors, 0)
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const scansThisMonth = scans.filter(s => s.created_at >= monthStart).length
  const distinctSites = new Set(scans.map(s => hostname(s.url))).size

  const chartScans = scans.slice(0, 7)
  const recentScans = scans.slice(0, 5)

  // Compliance ring (based on latest scan)
  const latest = scans[0]
  const ringScore = latest.score
  const circumference = 2 * Math.PI * 52

  const todayLabel = now.toLocaleDateString(locale, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })

  return (
    <div className="flex-1 overflow-y-auto">
      <Topbar title={t('title')} subtitle={`${todayLabel} · ${t('lastScan', { time: relativeTime(latest.created_at, tTime) })}`} />

      <div className="p-4 sm:p-7 space-y-5">

        {/* Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <MetricCard label={t('metricAvgScore')} value={avgScore} trendUp iconBg="bg-emerald-50" icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>
            </svg>
          } />
          <MetricCard label={t('metricOpenErrors')} value={openErrors} iconBg="bg-red-50" icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          } />
          <MetricCard label={t('metricScansThisMonth')} value={scansThisMonth} trendUp iconBg="bg-blue-50" icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          } />
          <MetricCard label={t('metricSitesScanned')} value={distinctSites} trendNeutral iconBg="bg-slate-50" icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500">
              <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            </svg>
          } />
        </div>

        {/* Chart + Ring */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="font-semibold text-slate-900">{t('scoreTrend')}</div>
                <div className="text-xs text-slate-400 mt-0.5">{t('scoreTrendSub', { count: chartScans.length })}</div>
              </div>
            </div>
            {chartScans.length >= 2
              ? <ScoreChart scans={chartScans} locale={locale} />
              : <div className="text-sm text-slate-400 text-center py-8">{t('needSecondScan')}</div>
            }
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <div className="font-semibold text-slate-900 mb-1">{t('latestScan')}</div>
            <div className="text-xs text-slate-400 mb-5 truncate">{hostname(latest.url)}</div>
            <div className="flex flex-col items-center">
              <div className="relative w-32 h-32 mb-5">
                <svg className="-rotate-90" width="128" height="128" viewBox="0 0 128 128">
                  <circle cx="64" cy="64" r="52" fill="none" stroke="#f1f5f9" strokeWidth="12" />
                  <circle cx="64" cy="64" r="52" fill="none" stroke="#00d4aa" strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference * (1 - ringScore / 100)} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
                  <span className="font-serif text-3xl leading-none text-slate-900">{ringScore}</span>
                  <span className="text-xs leading-none text-slate-400">/100</span>
                </div>
              </div>
              {[
                [t('errorsLabel'), latest.errors, 'bg-red-400'],
                [t('warningsLabel'), latest.warnings, 'bg-amber-400'],
                [t('passesLabel'), latest.passes, 'bg-green-500'],
              ].map(([l, v, c]) => (
                <div key={String(l)} className="flex items-center justify-between w-full mb-2 text-sm">
                  <div className="flex items-center gap-2 text-slate-500">
                    <div className={`w-2 h-2 rounded-full ${c}`} />
                    {l}
                  </div>
                  <span className="text-xs font-semibold text-slate-700">{String(v)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent scans */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div>
              <div className="font-semibold text-slate-900">{t('recentScans')}</div>
              <div className="text-xs text-slate-400 mt-0.5">{t('lastResults', { count: recentScans.length })}</div>
            </div>
          </div>
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[560px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-5 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">{t('tableUrl')}</th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">{t('tableWhen')}</th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">{t('tableIssues')}</th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">{t('tableScore')}</th>
              </tr>
            </thead>
            <tbody>
              {recentScans.map(s => (
                <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50 transition">
                  <td className="px-5 py-3">
                    <div className="font-medium text-slate-800 truncate max-w-[220px]">{hostname(s.url)}</div>
                    <div className="text-xs text-slate-400 truncate max-w-[220px]">{s.url}</div>
                  </td>
                  <td className="px-3 py-3 text-xs text-slate-400 whitespace-nowrap">{relativeTime(s.created_at, tTime)}</td>
                  <td className="px-3 py-3">
                    <div className="flex gap-1.5">
                      <span className="text-xs font-bold bg-red-50 text-red-500 px-2 py-0.5 rounded-full">{s.errors}E</span>
                      <span className="text-xs font-bold bg-amber-50 text-amber-500 px-2 py-0.5 rounded-full">{s.warnings}W</span>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <span className={`font-bold text-sm ${scoreColor(s.score)}`}>{s.score}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>

        {/* Quick scan */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="font-semibold text-slate-900 mb-1">{t('quickScan')}</div>
          <div className="text-xs text-slate-400 mb-4">{t('quickScanSub')}</div>
          <QuickScan />
        </div>

      </div>
    </div>
  )
}
