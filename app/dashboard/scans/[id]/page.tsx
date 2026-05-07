import { createClient } from '@/lib/supabase/server'
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

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
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

  const circumference = 2 * Math.PI * 56
  const color = gaugeColor(scan.score)

  return (
    <div className="dashboard-scroll flex-1 overflow-y-auto">
      <Topbar title="Scan Report" subtitle={hostname(scan.url)} />

      <div className="p-7 space-y-5 max-w-5xl print:max-w-none print:p-0">

        {/* Print-only header — hidden on screen */}
        <div className="hidden print:flex items-center justify-between border-b border-slate-200 pb-5 mb-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-emerald-400 rounded-lg flex items-center justify-center shrink-0">
              <span className="text-slate-900 text-xs font-bold">A</span>
            </div>
            <span className="font-serif text-lg text-slate-900">Accessly</span>
          </div>
          <span className="text-xs text-slate-400">Accessibility Report · {formatDate(scan.created_at)}</span>
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
            All scans
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">{formatDate(scan.created_at)}</span>
            <ShareButton scanId={scan.id} />
            <PrintButton />
          </div>
        </div>

        {/* URL */}
        <div className="bg-white border border-slate-200 rounded-2xl px-6 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">Scanned URL</p>
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
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-4">Score</p>
            <div className="relative w-36 h-36">
              <svg
                className="-rotate-90"
                width="144"
                height="144"
                viewBox="-8 -8 160 160"
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
              label: 'Errors', value: scan.errors,
              bg: 'bg-red-50', text: 'text-red-600', ring: 'ring-red-100',
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              ),
            },
            {
              label: 'Warnings', value: scan.warnings,
              bg: 'bg-amber-50', text: 'text-amber-500', ring: 'ring-amber-100',
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              ),
            },
            {
              label: 'Passes', value: scan.passes,
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

        {/* Violations */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-semibold text-slate-900">Violations</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {violations.length === 0
                  ? 'No violations detected'
                  : `${violations.length} issue${violations.length !== 1 ? 's' : ''} detected, sorted by severity — click to expand`}
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
              <p className="text-slate-600 text-sm font-medium">No violations detected</p>
              <p className="text-slate-400 text-xs mt-1">This page passed all checked accessibility rules.</p>
            </div>
          ) : (
            <ViolationAccordion violations={violations} />
          )}
        </div>

      </div>
    </div>
  )
}
