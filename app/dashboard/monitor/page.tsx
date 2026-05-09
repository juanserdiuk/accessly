import { createClient } from '@/lib/supabase/server'
import { getTranslations, getLocale } from 'next-intl/server'
import Link from 'next/link'
import Topbar from '@/components/dashboard/Topbar'
import AddSiteForm from './AddSiteForm'
import ScanNowButton from './ScanNowButton'
import { removeSite } from './actions'

type Site = { id: string; url: string; created_at: string }
type Scan = { id: string; url: string; score: number; errors: number; warnings: number; created_at: string }

function getHostname(url: string) {
  try { return new URL(url).hostname } catch { return url }
}

function relativeDate(iso: string, t: (k: string, p?: any) => string, locale: string) {
  const diff  = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days  = Math.floor(diff / 86_400_000)
  if (mins  < 1)  return t('justNow')
  if (mins  < 60) return t('minutesAgo', { count: mins })
  if (hours < 24) return t('hoursAgo', { count: hours })
  if (days  <  7) return t('daysAgo', { count: days })
  return new Date(iso).toLocaleDateString(locale, { month: 'short', day: 'numeric' })
}

function scoreColor(score: number) {
  if (score >= 80) return 'text-green-600'
  if (score >= 60) return 'text-amber-500'
  return 'text-red-500'
}

function ScoreRing({ score }: { score: number }) {
  const r   = 18
  const circ = 2 * Math.PI * r
  const color = score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#ef4444'
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" className="-rotate-90">
      <circle cx="24" cy="24" r={r} fill="none" stroke="#f1f5f9" strokeWidth="4" />
      <circle cx="24" cy="24" r={r} fill="none" stroke={color} strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - score / 100)} />
    </svg>
  )
}

function SiteRow({ site, scan, t, tTime, locale }: { site: Site; scan: Scan | null; t: (k: string, p?: any) => string; tTime: (k: string, p?: any) => string; locale: string }) {
  const host = getHostname(site.url)

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center gap-5">

      {/* Score ring */}
      <div className="relative shrink-0">
        {scan ? (
          <>
            <ScoreRing score={scan.score} />
            <span className={`absolute inset-0 flex items-center justify-center text-xs font-bold ${scoreColor(scan.score)}`}>
              {scan.score}
            </span>
          </>
        ) : (
          <div className="w-12 h-12 rounded-full border-2 border-dashed border-slate-200 flex items-center justify-center">
            <span className="text-slate-300 text-xs font-medium">–</span>
          </div>
        )}
      </div>

      {/* Site info */}
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-slate-800 text-sm truncate">{host}</div>
        <div className="text-xs text-slate-400 truncate mt-0.5">{site.url}</div>
      </div>

      {/* Last scanned */}
      <div className="shrink-0 text-center hidden sm:block">
        <div className="text-sm text-slate-600 font-medium">
          {scan ? relativeDate(scan.created_at, tTime, locale) : t('never')}
        </div>
        <div className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">{t('lastScanned')}</div>
      </div>

      {/* Errors */}
      <div className="shrink-0 text-center hidden md:block w-14">
        <div className={`text-lg font-semibold ${scan ? 'text-red-500' : 'text-slate-300'}`}>
          {scan?.errors ?? '–'}
        </div>
        <div className="text-[10px] text-slate-400 uppercase tracking-wider">{t('errorsLabel')}</div>
      </div>

      {/* Warnings */}
      <div className="shrink-0 text-center hidden md:block w-16">
        <div className={`text-lg font-semibold ${scan ? 'text-amber-500' : 'text-slate-300'}`}>
          {scan?.warnings ?? '–'}
        </div>
        <div className="text-[10px] text-slate-400 uppercase tracking-wider">{t('warningsLabel')}</div>
      </div>

      {/* View report link */}
      {scan && (
        <Link
          href={`/dashboard/scans/${scan.id}`}
          className="shrink-0 text-xs font-semibold text-slate-400 hover:text-slate-700 transition hidden sm:block whitespace-nowrap"
        >
          {t('viewReport')}
        </Link>
      )}

      {/* Scan now */}
      <ScanNowButton url={site.url} />

      {/* Remove */}
      <form action={removeSite}>
        <input type="hidden" name="siteId" value={site.id} />
        <button
          type="submit"
          title={t('removeTooltip')}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-300
            hover:text-red-500 hover:bg-red-50 transition shrink-0"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </form>
    </div>
  )
}

export default async function MonitorPage() {
  const t = await getTranslations('dashboard.monitor')
  const tTime = await getTranslations('dashboard.time')
  const locale = await getLocale()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: sites }, { data: scans }] = await Promise.all([
    supabase
      .from('sites')
      .select('id, url, created_at')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('scans')
      .select('id, url, score, errors, warnings, created_at')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false }),
  ])

  // Build a url → latest scan map (scans are already desc by created_at)
  const latestByUrl = new Map<string, Scan>()
  for (const scan of (scans ?? [])) {
    if (!latestByUrl.has(scan.url)) latestByUrl.set(scan.url, scan)
  }

  const allSites: Site[] = sites ?? []

  return (
    <div className="dashboard-scroll flex-1 overflow-y-auto">
      <Topbar
        title={t('title')}
        subtitle={allSites.length > 0
          ? t('siteCount', { count: allSites.length })
          : t('subtitleEmpty')}
      />

      <div className="p-4 sm:p-7 max-w-4xl space-y-5">

        {/* Add site card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
            {t('addSection')}
          </p>
          <AddSiteForm />
        </div>

        {/* Sites */}
        {allSites.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl flex flex-col items-center justify-center py-20 text-center">
            <div className="w-12 h-12 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center mb-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </div>
            <p className="text-sm font-medium text-slate-700 mb-1">{t('emptyTitle')}</p>
            <p className="text-xs text-slate-400">{t('emptySub')}</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {allSites.map(site => (
              <SiteRow
                key={site.id}
                site={site}
                scan={latestByUrl.get(site.url) ?? null}
                t={t}
                tTime={tTime}
                locale={locale}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
