'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'

/**
 * Triggers a CSV download of all the user's scans via /api/dashboard/export/scans.
 */
export default function ExportButton() {
  const t = useTranslations('dashboard.common')
  const [busy, setBusy] = useState(false)

  async function downloadCsv() {
    setBusy(true)
    try {
      const res = await fetch('/api/dashboard/export/scans')
      if (!res.ok) {
        throw new Error(`Export failed (${res.status})`)
      }
      const blob = await res.blob()
      // Try to pull filename from Content-Disposition; fall back to today.
      const cd = res.headers.get('content-disposition') ?? ''
      const match = /filename="?([^";]+)"?/.exec(cd)
      const filename = match?.[1] ?? `accessly-scans-${new Date().toISOString().slice(0, 10)}.csv`

      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(blobUrl)
    } catch (err) {
      console.error('[export] failed:', err)
      alert('Export failed. Please try again in a moment.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      onClick={downloadCsv}
      disabled={busy}
      aria-label={busy ? 'Preparing export…' : 'Export scans as CSV'}
      className="hidden md:flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 transition disabled:opacity-60"
    >
      {busy ? (
        <>
          <span aria-hidden="true" className="w-3.5 h-3.5 border-2 border-slate-300 border-t-slate-700 rounded-full animate-spin" />
          Exporting…
        </>
      ) : (
        <>
          <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          {t('export')}
        </>
      )}
    </button>
  )
}
