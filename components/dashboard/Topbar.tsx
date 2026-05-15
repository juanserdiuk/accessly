'use client'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import GlobalSearch from './GlobalSearch'
import NotificationsButton from './NotificationsButton'
import ExportButton from './ExportButton'

interface Props {
  title: string
  subtitle?: string
}

export default function Topbar({ title, subtitle }: Props) {
  const t = useTranslations('dashboard.common')
  return (
    <div className="bg-white border-b border-slate-200 px-4 sm:px-7 py-3 sm:py-0 sm:h-15 flex items-center justify-between shrink-0 print:hidden gap-3">
      <div className="min-w-0 flex-1">
        <h1 className="font-serif text-lg sm:text-xl text-slate-900 truncate">{title}</h1>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5 truncate">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <GlobalSearch />
        <NotificationsButton />
        <ExportButton />
        <Link href="/dashboard/scans/new"
          className="hidden sm:flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-700 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2">
          {t('addSite')}
        </Link>
      </div>
    </div>
  )
}
