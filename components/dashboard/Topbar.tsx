'use client'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import GlobalSearch from './GlobalSearch'

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
        <button className="relative w-9 h-9 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100 transition">
          🔔
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white" />
        </button>
        <button className="hidden md:flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition">
          ↓ {t('export')}
        </button>
        <Link href="/dashboard/scans/new"
          className="hidden sm:flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-700 transition">
          {t('addSite')}
        </Link>
      </div>
    </div>
  )
}
