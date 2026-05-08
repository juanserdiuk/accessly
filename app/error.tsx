'use client'
import { useEffect } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations('errors')

  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="w-14 h-14 mx-auto mb-5 bg-red-50 border border-red-100 rounded-2xl flex items-center justify-center">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h1 className="text-2xl font-semibold text-slate-900 mb-3">{t('errorTitle')}</h1>
        <p className="text-slate-500 mb-8">{t('errorSub')}</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="bg-slate-900 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-slate-700 transition text-sm"
          >
            {t('errorCta')}
          </button>
          <Link
            href="/"
            className="border border-slate-200 text-slate-700 font-semibold px-5 py-2.5 rounded-xl hover:bg-slate-50 transition text-sm"
          >
            {t('errorHome')}
          </Link>
        </div>
      </div>
    </main>
  )
}
