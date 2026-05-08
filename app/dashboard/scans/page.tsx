import { createClient } from '@/lib/supabase/server'
import { getTranslations, getLocale } from 'next-intl/server'
import Link from 'next/link'
import Topbar from '@/components/dashboard/Topbar'

const PAGE_SIZE = 20

function hostname(url: string) {
  try { return new URL(url).hostname } catch { return url }
}

function formatDate(iso: string, locale: string) {
  return new Date(iso).toLocaleDateString(locale, {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function scoreColor(score: number) {
  if (score >= 80) return 'text-green-600'
  if (score >= 60) return 'text-amber-500'
  return 'text-red-500'
}

export default async function ScansPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const t = await getTranslations('dashboard.scans')
  const locale = await getLocale()
  const { page: pageParam } = await searchParams
  const page = Math.max(1, parseInt(String(pageParam ?? '1'), 10))
  const offset = (page - 1) * PAGE_SIZE

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: scans, count } = await supabase
    .from('scans')
    .select('id, url, score, errors, warnings, created_at', { count: 'exact' })
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)

  const total = count ?? 0
  const totalPages = Math.ceil(total / PAGE_SIZE)
  const rows = scans ?? []

  return (
    <div className="flex-1 overflow-y-auto">
      <Topbar
        title={t('title')}
        subtitle={total === 0 ? t('noScansYet') : t('totalCount', { count: total })}
      />

      <div className="p-7">
        {total === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl flex flex-col items-center justify-center py-20 text-center">
            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mb-4">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </div>
            <p className="text-slate-500 text-sm mb-4">{t('emptyMessage')}</p>
            <Link href="/dashboard" className="text-sm font-semibold text-emerald-600 hover:underline">
              {t('goToDashboard')}
            </Link>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">{t('tableUrl')}</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">{t('tableDate')}</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">{t('tableScore')}</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">{t('tableErrors')}</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">{t('tableWarnings')}</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {rows.map(s => (
                  <tr key={s.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition">
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-slate-800">{hostname(s.url)}</div>
                      <div className="text-xs text-slate-400 truncate max-w-[280px]">{s.url}</div>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-400 whitespace-nowrap">
                      {formatDate(s.created_at, locale)}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`font-bold text-sm ${scoreColor(s.score)}`}>{s.score}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs font-bold bg-red-50 text-red-500 px-2.5 py-0.5 rounded-full">
                        {s.errors}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs font-bold bg-amber-50 text-amber-500 px-2.5 py-0.5 rounded-full">
                        {s.warnings}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Link
                        href={`/dashboard/scans/${s.id}`}
                        className="text-xs font-semibold text-emerald-600 hover:underline whitespace-nowrap"
                      >
                        {t('viewReport')}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100 bg-slate-50">
                <p className="text-xs text-slate-400">
                  {t('showing', { from: offset + 1, to: Math.min(offset + PAGE_SIZE, total), total })}
                </p>
                <div className="flex gap-2">
                  {page > 1 && (
                    <Link
                      href={`/dashboard/scans?page=${page - 1}`}
                      className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg text-slate-600 hover:bg-white transition"
                    >
                      {t('prev')}
                    </Link>
                  )}
                  <span className="px-3 py-1.5 text-xs text-slate-400">
                    {page} / {totalPages}
                  </span>
                  {page < totalPages && (
                    <Link
                      href={`/dashboard/scans?page=${page + 1}`}
                      className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg text-slate-600 hover:bg-white transition"
                    >
                      {t('next')}
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
