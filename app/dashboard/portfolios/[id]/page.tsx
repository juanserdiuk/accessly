import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Topbar from '@/components/dashboard/Topbar'
import { assignSiteToPortfolio } from '../actions'

function hostname(url: string) {
  try { return new URL(url).hostname } catch { return url }
}

function scoreColor(score: number) {
  if (score >= 80) return 'text-green-600'
  if (score >= 60) return 'text-amber-500'
  return 'text-red-500'
}

export default async function PortfolioDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: portfolio } = await supabase
    .from('portfolios')
    .select('id, name, description, color, created_at')
    .eq('id', id)
    .eq('user_id', user!.id)
    .single()
  if (!portfolio) notFound()

  const [{ data: allSites }, { data: scans }] = await Promise.all([
    supabase
      .from('sites')
      .select('id, url, portfolio_id, created_at')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('scans')
      .select('id, url, score, errors, warnings, created_at')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false }),
  ])

  const sites = allSites ?? []
  const sitesInPortfolio = sites.filter(s => s.portfolio_id === id)
  const availableToAdd = sites.filter(s => s.portfolio_id === null)
  const latestByUrl = new Map<string, { score: number; errors: number; warnings: number; created_at: string }>()
  for (const s of scans ?? []) {
    if (!latestByUrl.has(s.url)) latestByUrl.set(s.url, s)
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <Topbar
        title={portfolio.name}
        subtitle={`${sitesInPortfolio.length} site${sitesInPortfolio.length === 1 ? '' : 's'} in portfolio`}
      />

      <div className="p-4 sm:p-7 max-w-5xl space-y-5">

        <Link
          href="/dashboard/portfolios"
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-700 transition"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          All portfolios
        </Link>

        {/* Sites in portfolio */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: `${portfolio.color}22`, color: portfolio.color }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <div>
              <p className="font-semibold text-slate-900">Sites</p>
              <p className="text-xs text-slate-400 mt-0.5">{sitesInPortfolio.length} in this portfolio</p>
            </div>
          </div>

          {sitesInPortfolio.length === 0 ? (
            <div className="px-5 py-14 text-center">
              <p className="text-sm text-slate-500 mb-1">No sites in this portfolio yet</p>
              <p className="text-xs text-slate-400">Add some below, then run scans from the Monitor tab.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Site</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Score</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Issues</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {sitesInPortfolio.map(s => {
                    const latest = latestByUrl.get(s.url)
                    return (
                      <tr key={s.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition">
                        <td className="px-5 py-3.5">
                          <div className="font-medium text-slate-800">{hostname(s.url)}</div>
                          <div className="text-xs text-slate-400 truncate max-w-[280px]">{s.url}</div>
                        </td>
                        <td className="px-4 py-3.5">
                          {latest ? (
                            <span className={`font-bold text-sm ${scoreColor(latest.score)}`}>{latest.score}</span>
                          ) : (
                            <span className="text-xs text-slate-300">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          {latest ? (
                            <div className="flex gap-1.5">
                              <span className="text-xs font-bold bg-red-50 text-red-500 px-2 py-0.5 rounded-full">{latest.errors}E</span>
                              <span className="text-xs font-bold bg-amber-50 text-amber-500 px-2 py-0.5 rounded-full">{latest.warnings}W</span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-300">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <form action={assignSiteToPortfolio}>
                            <input type="hidden" name="siteId" value={s.id} />
                            <input type="hidden" name="portfolioId" value="" />
                            <button
                              type="submit"
                              className="text-xs font-medium text-slate-400 hover:text-red-500 transition"
                              title="Remove from portfolio"
                            >
                              Remove
                            </button>
                          </form>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add sites */}
        {availableToAdd.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Add a site to this portfolio
            </p>
            <div className="space-y-2">
              {availableToAdd.map(s => (
                <form
                  key={s.id}
                  action={assignSiteToPortfolio}
                  className="flex items-center justify-between gap-3 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5"
                >
                  <input type="hidden" name="siteId" value={s.id} />
                  <input type="hidden" name="portfolioId" value={id} />
                  <div className="min-w-0">
                    <div className="font-medium text-slate-800 text-sm truncate">{hostname(s.url)}</div>
                    <div className="text-xs text-slate-400 truncate">{s.url}</div>
                  </div>
                  <button
                    type="submit"
                    className="text-xs font-semibold bg-slate-900 text-white px-3.5 py-2 rounded-lg hover:bg-slate-700 transition whitespace-nowrap"
                  >
                    Add
                  </button>
                </form>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
