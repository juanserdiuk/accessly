'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'

export default function ScanNowButton({ url }: { url: string }) {
  const t = useTranslations('dashboard.monitor')
  const [scanning, setScanning] = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const router = useRouter()

  async function handleScan() {
    setScanning(true)
    setError(null)
    try {
      const res  = await fetch('/api/scan', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ url }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        setError(data.error ?? t('scanFailed'))
      } else {
        router.refresh()
      }
    } catch {
      setError(t('networkError'))
    } finally {
      setScanning(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleScan}
        disabled={scanning}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold
          bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg
          hover:bg-emerald-100 transition disabled:opacity-50 whitespace-nowrap"
      >
        {scanning ? (
          <>
            <svg className="animate-spin" width="11" height="11" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
            {t('scanning')}
          </>
        ) : (
          <>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
            {t('scanNow')}
          </>
        )}
      </button>
      {error && <span className="text-[10px] text-red-500 text-right">{error}</span>}
    </div>
  )
}
