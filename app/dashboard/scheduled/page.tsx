import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Topbar from '@/components/dashboard/Topbar'
import CreateScheduleForm from './CreateScheduleForm'
import { toggleSchedule, deleteSchedule } from './actions'
import { CADENCE_LABELS } from './cadence'

type Schedule = {
  id: string
  url: string
  cadence: 'hourly' | 'every_6h' | 'daily' | 'weekly'
  next_run_at: string
  last_run_at: string | null
  last_score: number | null
  last_status: string | null
  active: boolean
  created_at: string
}

function hostname(url: string) {
  try { return new URL(url).hostname } catch { return url }
}

function fmt(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })
}

function scoreColor(score: number) {
  if (score >= 80) return 'text-green-600'
  if (score >= 60) return 'text-amber-500'
  return 'text-red-500'
}

export default async function ScheduledScansPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', user!.id)
    .single()
  const plan = (profile?.plan ?? 'free') as string
  const hasAccess = plan === 'pro' || plan === 'agency'

  if (!hasAccess) {
    return (
      <div className="flex-1 overflow-y-auto">
        <Topbar title="Scheduled scans" subtitle="Pro / Agency feature" />
        <div className="p-4 sm:p-7 max-w-3xl">
          <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center">
            <div className="w-12 h-12 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-center mx-auto mb-4">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <h2 className="font-serif text-xl text-slate-900 mb-2">Scheduled scans are a Pro / Agency feature</h2>
            <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto">
              Run your scans automatically — every hour, every 6 hours, daily, or weekly. Get alerted the moment a score drops.
            </p>
            <Link href="/upgrade" className="inline-block bg-slate-900 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-slate-700 transition text-sm">
              View plans
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const { data: schedules } = await supabase
    .from('scheduled_scans')
    .select('id, url, cadence, next_run_at, last_run_at, last_score, last_status, active, created_at')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })

  const rows: Schedule[] = schedules ?? []
  const activeCount = rows.filter(r => r.active).length

  return (
    <div className="flex-1 overflow-y-auto">
      <Topbar
        title="Scheduled scans"
        subtitle={rows.length > 0 ? `${activeCount} active · ${rows.length} total` : 'Automate your accessibility scans'}
      />

      <div className="p-4 sm:p-7 max-w-4xl space-y-5">

        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
            Add a scheduled scan
          </p>
          <CreateScheduleForm />
        </div>

        {rows.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center mb-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <p className="text-sm font-medium text-slate-700 mb-1">No scheduled scans yet</p>
            <p className="text-xs text-slate-400">Schedule a URL above to start automated monitoring.</p>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[680px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">URL</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Cadence</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Last run</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Next run</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Score</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {rows.map(s => (
                  <tr key={s.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition">
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-slate-800">{hostname(s.url)}</div>
                      <div className="text-xs text-slate-400 truncate max-w-[260px]">{s.url}</div>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-500 whitespace-nowrap">
                      {CADENCE_LABELS[s.cadence]}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-400 whitespace-nowrap">{fmt(s.last_run_at)}</td>
                    <td className="px-4 py-3.5 text-xs text-slate-400 whitespace-nowrap">
                      {s.active ? fmt(s.next_run_at) : <span className="italic">paused</span>}
                    </td>
                    <td className="px-4 py-3.5">
                      {s.last_score !== null ? (
                        <span className={`font-bold ${scoreColor(s.last_score)}`}>{s.last_score}</span>
                      ) : (
                        <span className="text-xs text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <form action={toggleSchedule} className="inline">
                        <input type="hidden" name="id" value={s.id} />
                        <input type="hidden" name="active" value={String(s.active)} />
                        <button
                          type="submit"
                          className={`text-xs font-semibold px-3 py-1 rounded-lg transition ${
                            s.active
                              ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          }`}
                        >
                          {s.active ? 'Pause' : 'Resume'}
                        </button>
                      </form>
                      <form action={deleteSchedule} className="inline ml-1.5">
                        <input type="hidden" name="id" value={s.id} />
                        <button
                          type="submit"
                          title="Delete schedule"
                          className="w-7 h-7 inline-flex items-center justify-center rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
