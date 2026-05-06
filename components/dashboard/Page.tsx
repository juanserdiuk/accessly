'use client'
import { useState } from 'react'
import Topbar from '@/components/dashboard/Topbar'
import MetricCard from '@/components/dashboard/MetricCard'
import SiteRow from '@/components/dashboard/SiteRow'

const sites = [
  { favicon: 'A', faviconBg: 'bg-blue-100', faviconColor: 'text-blue-700', name: 'acme-corp.com', meta: 'Scanned 2h ago · 142 pages', score: 91 },
  { favicon: 'S', faviconBg: 'bg-pink-100', faviconColor: 'text-pink-700', name: 'shopify-store.com', meta: 'Scanned 6h ago · 58 pages', score: 61 },
  { favicon: 'B', faviconBg: 'bg-emerald-100', faviconColor: 'text-emerald-700', name: 'blog.acme-corp.com', meta: 'Scanned 1d ago · 34 pages', score: 88 },
  { favicon: 'D', faviconBg: 'bg-amber-100', faviconColor: 'text-amber-700', name: 'docs.acme-corp.com', meta: 'Scanned 2d ago · 210 pages', score: 74 },
  { favicon: 'P', faviconBg: 'bg-violet-100', faviconColor: 'text-violet-700', name: 'portal.acme-corp.com', meta: 'Scanned 3d ago · 28 pages', score: 85 },
]

const scans = [
  { url: 'shopify-store.com', time: 'Today 09:14', errors: 7, warnings: 4, score: 61, scoreColor: 'text-red-500' },
  { url: 'acme-corp.com', time: 'Today 07:00', errors: 1, warnings: 2, score: 91, scoreColor: 'text-green-600' },
  { url: 'blog.acme-corp.com', time: 'Yesterday', errors: 2, warnings: 3, score: 88, scoreColor: 'text-green-600' },
  { url: 'docs.acme-corp.com', time: '2 days ago', errors: 4, warnings: 6, score: 74, scoreColor: 'text-amber-500' },
  { url: 'portal.acme-corp.com', time: '3 days ago', errors: 2, warnings: 1, score: 85, scoreColor: 'text-green-600' },
]

const chartPoints = [74, 76, 73, 79, 81, 80, 82]
const chartLabels = ['Apr 29', 'Apr 30', 'May 1', 'May 2', 'May 3', 'May 4', 'May 5']

function ScoreChart() {
  const W = 500, H = 140, PL = 20, PR = 10, PT = 10, PB = 24
  const cw = W - PL - PR, ch = H - PT - PB
  const px = (i: number) => PL + (i / (chartPoints.length - 1)) * cw
  const py = (v: number) => PT + ch - ((v - 0) / 100) * ch
  const pts = chartPoints.map((v, i) => [px(i), py(v)] as [number, number])

  let d = `M ${pts[0][0]} ${pts[0][1]}`
  for (let i = 1; i < pts.length; i++) {
    const cpx = (pts[i - 1][0] + pts[i][0]) / 2
    d += ` C ${cpx} ${pts[i - 1][1]} ${cpx} ${pts[i][1]} ${pts[i][0]} ${pts[i][1]}`
  }
  const area = d + ` L ${pts[pts.length - 1][0]} ${H} L ${pts[0][0]} ${H} Z`

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="overflow-visible">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#00d4aa" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#00d4aa" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[25, 50, 75, 100].map(v => (
        <line key={v} x1={PL} y1={py(v)} x2={W - PR} y2={py(v)} stroke="#f1f5f9" strokeWidth="1" />
      ))}
      <path d={area} fill="url(#g)" />
      <path d={d} fill="none" stroke="#00d4aa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i === pts.length - 1 ? 5 : 3.5}
          fill={i === pts.length - 1 ? '#00d4aa' : '#fff'}
          stroke="#00d4aa" strokeWidth="2" />
      ))}
      {chartLabels.map((l, i) => (
        <text key={l} x={px(i)} y={H} fontSize="9" fill="#94a3b8" textAnchor="middle" fontFamily="system-ui">{l}</text>
      ))}
    </svg>
  )
}

export default function DashboardPage() {
  const [url, setUrl] = useState('')
  const [dismissed, setDismissed] = useState(false)

  return (
    <div className="flex-1 overflow-y-auto">
      <Topbar title="Dashboard" subtitle="Tuesday, May 5 2026 · Last sync 4 min ago" />

      <div className="p-7 space-y-5">

        {/* Alert */}
        {!dismissed && (
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
            <span>⚠️</span>
            <span><strong>shopify-store.com</strong> regression detected — 3 new errors since yesterday's deploy.</span>
            <a href="#" className="ml-auto font-semibold underline shrink-0">View report</a>
            <button onClick={() => setDismissed(true)} className="text-amber-500 hover:text-amber-700 text-lg leading-none ml-2">×</button>
          </div>
        )}

        {/* Metrics */}
        <div className="grid grid-cols-4 gap-4">
          <MetricCard label="Avg score" value={82} trend="↑ 8%" trendUp icon="📈" iconBg="bg-emerald-50" />
          <MetricCard label="Open errors" value={14} trend="↑ 3 new" icon="🔴" iconBg="bg-red-50" />
          <MetricCard label="Scans this month" value={247} trend="↑ 12%" trendUp icon="🔍" iconBg="bg-blue-50" />
          <MetricCard label="Sites monitored" value={5} trend="stable" trendNeutral icon="🌐" iconBg="bg-slate-50" />
        </div>

        {/* Chart + Ring */}
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 bg-white border border-slate-200 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="font-semibold text-slate-900">Score trend</div>
                <div className="text-xs text-slate-400 mt-0.5">Avg accessibility score across all sites</div>
              </div>
              <a href="#" className="text-xs font-medium text-emerald-600 hover:underline">Full report →</a>
            </div>
            <ScoreChart />
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <div className="font-semibold text-slate-900 mb-1">Compliance</div>
            <div className="text-xs text-slate-400 mb-5">Based on last scan</div>
            <div className="flex flex-col items-center">
              <div className="relative w-32 h-32 mb-5">
                <svg className="-rotate-90" width="128" height="128" viewBox="0 0 128 128">
                  <circle cx="64" cy="64" r="52" fill="none" stroke="#f1f5f9" strokeWidth="12" />
                  <circle cx="64" cy="64" r="52" fill="none" stroke="#00d4aa" strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 52}
                    strokeDashoffset={2 * Math.PI * 52 * (1 - 82 / 100)} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-serif text-3xl text-slate-900">82</span>
                  <span className="text-xs text-slate-400">/100</span>
                </div>
              </div>
              {[['Passed','68%','bg-green-500'],['Warnings','20%','bg-amber-400'],['Errors','12%','bg-red-400']].map(([l, v, c]) => (
                <div key={l} className="flex items-center justify-between w-full mb-2 text-sm">
                  <div className="flex items-center gap-2 text-slate-500">
                    <div className={`w-2 h-2 rounded-full ${c}`} />
                    {l}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${c}`} style={{ width: v }} />
                    </div>
                    <span className="text-xs font-semibold text-slate-700 w-8 text-right">{v}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sites + Recent Scans */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div>
                <div className="font-semibold text-slate-900">Monitored sites</div>
                <div className="text-xs text-slate-400 mt-0.5">5 of 5 active</div>
              </div>
              <a href="#" className="text-xs font-medium text-emerald-600 hover:underline">+ Add site</a>
            </div>
            {sites.map(s => <SiteRow key={s.name} {...s} />)}
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div>
                <div className="font-semibold text-slate-900">Recent scans</div>
                <div className="text-xs text-slate-400 mt-0.5">Last 5 results</div>
              </div>
              <a href="#" className="text-xs font-medium text-emerald-600 hover:underline">View all →</a>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-5 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">Site</th>
                  <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">Issues</th>
                  <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">Score</th>
                </tr>
              </thead>
              <tbody>
                {scans.map(s => (
                  <tr key={s.url + s.time} className="border-b border-slate-50 hover:bg-slate-50 transition cursor-pointer">
                    <td className="px-5 py-3">
                      <div className="font-medium text-slate-800 truncate max-w-[140px]">{s.url}</div>
                      <div className="text-xs text-slate-400">{s.time}</div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex gap-1.5">
                        <span className="text-xs font-bold bg-red-50 text-red-500 px-2 py-0.5 rounded-full">{s.errors}E</span>
                        <span className="text-xs font-bold bg-amber-50 text-amber-500 px-2 py-0.5 rounded-full">{s.warnings}W</span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`font-bold text-sm ${s.scoreColor}`}>{s.score}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick scan */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="font-semibold text-slate-900 mb-1">Quick scan</div>
          <div className="text-xs text-slate-400 mb-4">Run an instant accessibility audit on any URL</div>
          <div className="flex gap-3">
            <input
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:border-emerald-400 transition"
            />
            <button className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-700 transition">
              Scan now
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}