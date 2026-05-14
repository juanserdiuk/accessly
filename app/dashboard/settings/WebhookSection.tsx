'use client'

import { useState, useTransition } from 'react'
import { saveWebhookUrl } from './actions'

interface Props {
  current: string | null
}

/**
 * Settings UI for the per-user scan-complete webhook URL.
 *
 * The webhook fires POST <url> with a JSON payload every time a scan
 * completes (both dashboard scans and CI/CD API scans). Receivers can
 * verify the signature via X-Accessly-Signature when WEBHOOK_SIGNING_SECRET
 * is set on Vercel.
 */
export default function WebhookSection({ current }: Props) {
  const [value, setValue] = useState(current ?? '')
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<{ kind: 'ok' | 'error'; message: string } | null>(null)

  function onSave() {
    setResult(null)
    startTransition(async () => {
      const res = await saveWebhookUrl(value.trim())
      if (res.error) setResult({ kind: 'error', message: res.error })
      else setResult({ kind: 'ok', message: res.cleared ? 'Webhook cleared.' : 'Webhook saved.' })
    })
  }

  return (
    <div className="space-y-3">
      <label htmlFor="webhook-url" className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
        Webhook URL
      </label>
      <input
        id="webhook-url"
        type="url"
        inputMode="url"
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder="https://your-server.com/accessly-webhook"
        className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-emerald-400 focus-visible:ring-2 focus-visible:ring-emerald-400 transition placeholder:text-slate-300"
      />

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onSave}
          disabled={isPending}
          className="px-4 py-2 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-700 transition disabled:opacity-50"
        >
          {isPending ? 'Saving…' : (value.trim() ? 'Save webhook' : 'Clear webhook')}
        </button>
        <a
          href="/docs/api"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 transition"
        >
          API docs →
        </a>
      </div>

      {result && (
        <p
          role={result.kind === 'error' ? 'alert' : 'status'}
          className={`text-xs ${result.kind === 'error' ? 'text-red-500' : 'text-emerald-700'}`}
        >
          {result.message}
        </p>
      )}

      <div className="text-xs text-slate-400 leading-relaxed space-y-1.5 pt-2">
        <p>
          We&apos;ll POST a JSON payload to this URL every time a scan completes — both dashboard scans and CI/CD API scans.
        </p>
        <p>
          For signature verification, set <code className="font-mono bg-slate-100 px-1 rounded text-slate-700">WEBHOOK_SIGNING_SECRET</code> in your project env (we&apos;ll send <code className="font-mono bg-slate-100 px-1 rounded text-slate-700">X-Accessly-Signature</code> as an HMAC-SHA256 of the body).
        </p>
        <p>
          See the <a className="text-emerald-700 hover:underline" href="/docs/api" target="_blank" rel="noopener noreferrer">API docs</a> for the full payload schema.
        </p>
      </div>
    </div>
  )
}
