import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Topbar from '@/components/dashboard/Topbar'
import CreatePortfolioForm from './CreatePortfolioForm'
import { deletePortfolio } from './actions'

type Portfolio = {
  id: string
  name: string
  description: string | null
  color: string
  created_at: string
}

type Site = { id: string; url: string; portfolio_id: string | null }
type Scan = { id: string; url: string; score: number; created_at: string }

function hostname(url: string) {
  try { return new URL(url).hostname } catch { return url }
}

export default async function PortfoliosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Plan gate: pro / agency only
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
        <Topbar title="Portfolios" subtitle="Group sites by client" />
        <div className="p-4 sm:p-7 max-w-3xl">
          <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center">
            <div className="w-12 h-12 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-center mx-auto mb-4">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" className="text-amber-500">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </div>
            <h2 className="font-serif text-xl text-slate-900 mb-2">Portfolios are a Pro / Agency feature</h2>
            <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto">
              Group sites by client, keep their scan history separate, and ship branded reports. Upgrade to unlock.
            </p>
            <Link
              href="/upgrade"
              className="inline-block bg-slate-900 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-slate-700 transition text-sm"
            >
              View plans
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const [{ data: portfolios }, { data: sites }, { data: scans }] = await Promise.all([
    supabase
      .from('portfolios')
      .select('id, name, description, color, created_at')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('sites')
      .select('id, url, portfolio_id')
      .eq('user_id', user!.id),
    supabase
      .from('scans')
      .select('id, url, score, created_at')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false }),
  ])

  const portfolioList: Portfolio[] = portfolios ?? []
  const siteList: Site[] = sites ?? []
  const scanList: Scan[] = scans ?? []

  // Most recent scan per URL
  const latestScanByUrl = new Map<string, Scan>()
  for (const s of scanList) {
    if (!latestScanByUrl.has(s.url)) latestScanByUrl.set(s.url, s)
  }

  function statsFor(portfolioId: string) {
    const portfolioSites = siteList.filter(s => s.portfolio_id === portfolioId)
    const scanned = portfolioSites
      .map(s => latestScanByUrl.get(s.url))
      .filter((s): s is Scan => !!s)
    const avgScore = scanned.length > 0
      ? Math.round(scanned.reduce((acc, s) => acc + s.score, 0) / scanned.length)
      : null
    return { count: portfolioSites.length, avgScore }
  }

  const unassignedCount = siteList.filter(s => !s.portfolio_id).length

  return (
    <div className="flex-1 overflow-y-auto">
      <Topbar title="Portfolios" subtitle="Group sites by client for cleaner reporting" />

      <div className="p-4 sm:p-7 max-w-5xl space-y-5">

        {/* Create portfolio */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
            New portfolio
          </p>
          <CreatePortfolioForm />
        </div>

        {/* Portfolios grid */}
        {portfolioList.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center mb-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <p className="text-sm font-medium text-slate-700 mb-1">No portfolios yet</p>
            <p className="text-xs text-slate-400">Create one above to group sites by client.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {portfolioList.map(p => {
              const { count, avgScore } = statsFor(p.id)
              return (
                <div key={p.id} className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: `${p.color}22`, color: p.color }}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-slate-900 truncate">{p.name}</h3>
                        <p className="text-xs text-slate-400">{count} site{count === 1 ? '' : 's'}</p>
                      </div>
                    </div>
                    <form action={deletePortfolio}>
                      <input type="hidden" name="id" value={p.id} />
                      <button
                        type="submit"
                        title="Delete portfolio"
                        className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    </form>
                  </div>

                  <div className="flex items-end justify-between">
                    <div>
                      {avgScore !== null ? (
                        <>
                          <div className={`font-serif text-3xl ${avgScore >= 80 ? 'text-green-600' : avgScore >= 60 ? 'text-amber-500' : 'text-red-500'}`}>
                            {avgScore}
                          </div>
                          <p className="text-xs text-slate-400">avg score</p>
                        </>
                      ) : (
                        <p className="text-xs text-slate-400 italic">No scans yet</p>
                      )}
                    </div>
                    <Link
                      href={`/dashboard/portfolios/${p.id}`}
                      className="text-xs font-semibold text-emerald-600 hover:underline whitespace-nowrap"
                    >
                      Open →
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Hint when there are unassigned sites */}
        {unassignedCount > 0 && portfolioList.length > 0 && (
          <p className="text-xs text-slate-400 text-center">
            {unassignedCount} site{unassignedCount === 1 ? '' : 's'} not yet assigned to a portfolio.
            Open any portfolio to add sites.
          </p>
        )}

      </div>
    </div>
  )
}
