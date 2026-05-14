'use client'

import { useState } from 'react'

interface Props {
  /** Most recent scan id for this user, if any. */
  latestScanId: string | null
  /** Canonical base URL (https://accessly.us in prod). */
  siteUrl: string
}

/**
 * Customer-facing badge embed section in /dashboard/settings.
 *
 * Hands the customer two copy-paste snippets (Markdown + HTML) for the
 * "Audited by Accessly" badge that points back to their latest real scan.
 */
export default function BadgeSection({ latestScanId, siteUrl }: Props) {
  const [style, setStyle] = useState<'full' | 'compact'>('full')
  const [copied, setCopied] = useState<'markdown' | 'html' | null>(null)

  // Fall back to a "preview" id so the section still renders something when
  // the user hasn't scanned anything yet — they can see what they'd get.
  const id = latestScanId ?? 'preview'
  const badgeUrl = `${siteUrl}/api/badge/${id}${style === 'compact' ? '?style=compact' : ''}`
  const verifyUrl = `${siteUrl}/scan/${id}`
  const html = `<a href="${verifyUrl}" target="_blank" rel="noopener"><img src="${badgeUrl}" alt="Audited by Accessly — WCAG 2.2"${style === 'full' ? ' width="220" height="72"' : ' width="144" height="20"'} /></a>`
  const markdown = `[![Audited by Accessly](${badgeUrl})](${verifyUrl})`

  async function copy(kind: 'markdown' | 'html') {
    try {
      await navigator.clipboard.writeText(kind === 'markdown' ? markdown : html)
      setCopied(kind)
      setTimeout(() => setCopied(null), 1800)
    } catch {
      // no-op
    }
  }

  return (
    <div className="space-y-5">
      {/* Live preview */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col items-center justify-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={badgeUrl}
          alt="Audited by Accessly preview"
          width={style === 'full' ? 220 : 144}
          height={style === 'full' ? 72 : 20}
        />
        {!latestScanId && (
          <p className="text-xs text-slate-400">Run your first scan to unlock a live badge. This is a preview.</p>
        )}
      </div>

      {/* Style toggle */}
      <div className="flex gap-1.5">
        {(['full', 'compact'] as const).map(s => (
          <button
            key={s}
            type="button"
            onClick={() => setStyle(s)}
            className={`flex-1 text-xs font-semibold py-2 rounded-lg border transition capitalize ${
              style === s
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
            }`}
          >
            {s} badge
          </button>
        ))}
      </div>

      {/* Snippets */}
      {(['markdown', 'html'] as const).map(kind => (
        <div key={kind}>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">{kind}</label>
            <button
              type="button"
              onClick={() => copy(kind)}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 rounded px-2 py-1"
            >
              {copied === kind ? '✓ Copied' : 'Copy'}
            </button>
          </div>
          <pre className="bg-slate-900 text-emerald-200 text-xs font-mono px-4 py-3 rounded-xl overflow-x-auto whitespace-pre-wrap break-all leading-relaxed">
            {kind === 'markdown' ? markdown : html}
          </pre>
        </div>
      ))}

      <p className="text-xs text-slate-400 leading-relaxed">
        The badge always reflects your <strong>latest</strong> scan score. Clicking it opens the full report — proof for visitors, customers, and procurement teams that your site was actually audited.
      </p>
    </div>
  )
}
