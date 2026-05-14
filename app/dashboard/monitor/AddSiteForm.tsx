'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { addSite, addSitesBulk } from './actions'

export default function AddSiteForm() {
  const t = useTranslations('dashboard.monitor')
  const tCommon = useTranslations('dashboard.common')
  const [mode, setMode] = useState<'single' | 'bulk'>('single')
  const [state, action, pending] = useActionState(addSite, null)
  const [bulkState, bulkAction, bulkPending] = useActionState(addSitesBulk, null)
  const inputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Clear the input after a successful add
  useEffect(() => {
    if (state?.success && inputRef.current) {
      inputRef.current.value = ''
    }
  }, [state])

  useEffect(() => {
    if (bulkState && bulkState.added && bulkState.added > 0 && textareaRef.current) {
      textareaRef.current.value = ''
    }
  }, [bulkState])

  return (
    <div className="space-y-3">
      {/* Mode toggle */}
      <div className="flex gap-1.5">
        {(['single', 'bulk'] as const).map(m => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            aria-pressed={mode === m}
            className={`text-xs font-semibold py-1.5 px-3 rounded-lg border transition ${
              mode === m
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
            }`}
          >
            {m === 'single' ? 'Add one' : 'Paste a list'}
          </button>
        ))}
      </div>

      {mode === 'single' ? (
        <form action={action} className="space-y-2">
          <div className="flex gap-3">
            <label htmlFor="add-site-url" className="sr-only">{t('addSection')}</label>
            <input
              id="add-site-url"
              ref={inputRef}
              name="url"
              type="url"
              placeholder={tCommon('scanPlaceholder')}
              className="flex-1 px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white
                focus:outline-none focus:border-emerald-400 focus-visible:ring-2 focus-visible:ring-emerald-400 transition placeholder:text-slate-300"
            />
            <button
              type="submit"
              disabled={pending}
              className="px-4 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-xl
                hover:bg-slate-700 transition disabled:opacity-50 shrink-0"
            >
              {pending ? t('adding') : t('addSubmit')}
            </button>
          </div>
          {state?.error && (
            <p role="alert" className="text-xs text-red-500">{state.error}</p>
          )}
        </form>
      ) : (
        <form action={bulkAction} className="space-y-2">
          <label htmlFor="add-sites-bulk" className="sr-only">Paste URL list</label>
          <textarea
            id="add-sites-bulk"
            ref={textareaRef}
            name="urls"
            rows={6}
            placeholder={`https://acme.com\nhttps://blog.acme.com\nhttps://docs.acme.com\n…paste one URL per line (or comma-separated). Cap is 100.`}
            className="w-full px-4 py-3 text-sm font-mono border border-slate-200 rounded-xl bg-white
              focus:outline-none focus:border-emerald-400 focus-visible:ring-2 focus-visible:ring-emerald-400 transition placeholder:text-slate-300 resize-y"
          />
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-slate-400 leading-relaxed">
              One per line, or separated by commas / spaces. Duplicates and invalid URLs are skipped.
            </p>
            <button
              type="submit"
              disabled={bulkPending}
              className="px-4 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-xl
                hover:bg-slate-700 transition disabled:opacity-50 shrink-0"
            >
              {bulkPending ? 'Adding…' : 'Add all'}
            </button>
          </div>
          {bulkState?.error && (
            <p role="alert" className="text-xs text-red-500">{bulkState.error}</p>
          )}
          {bulkState && !bulkState.error && (bulkState.added !== undefined) && (
            <div role="status" aria-live="polite" className="text-xs bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl px-3 py-2.5 space-y-1">
              <p className="font-semibold">
                ✓ Added {bulkState.added} {bulkState.added === 1 ? 'site' : 'sites'}
              </p>
              {!!bulkState.duplicates && (
                <p className="text-emerald-700/80">{bulkState.duplicates} already in your watchlist (skipped)</p>
              )}
              {!!bulkState.invalid && (
                <p className="text-amber-700">
                  {bulkState.invalid} invalid URL{bulkState.invalid === 1 ? '' : 's'} skipped
                  {bulkState.invalidUrls && bulkState.invalidUrls.length > 0 && (
                    <span className="text-amber-600/70"> — e.g. <code className="font-mono">{bulkState.invalidUrls.slice(0, 3).join(', ')}</code></span>
                  )}
                </p>
              )}
            </div>
          )}
        </form>
      )}
    </div>
  )
}
