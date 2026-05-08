'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'

interface Props {
  apiKey: string | null
  siteUrl: string
}

function CopyButton({ text }: { text: string }) {
  const t = useTranslations('dashboard.settings')
  const [copied, setCopied] = useState(false)

  async function copy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={copy}
      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-slate-200
        rounded-lg text-slate-600 hover:bg-slate-50 transition shrink-0"
    >
      {copied ? (
        <>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-green-500">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <span className="text-green-600">{t('copied')}</span>
        </>
      ) : (
        <>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
          {t('copy')}
        </>
      )}
    </button>
  )
}

export default function ApiKeySection({ apiKey, siteUrl }: Props) {
  const t = useTranslations('dashboard.settings')
  const [revealed, setRevealed] = useState(false)

  if (!apiKey) {
    const before = t('apiNoKey', { var: '__VAR__' }).split('__VAR__')
    return (
      <div className="space-y-3">
        <p className="text-sm text-slate-500">
          {before[0]}
          <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded font-mono">CICD_API_KEY</code>
          {before[1]}
        </p>
        <pre className="text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-500">
          CICD_API_KEY=your-secret-key
        </pre>
      </div>
    )
  }

  const masked  = '•'.repeat(Math.max(0, apiKey.length - 4)) + apiKey.slice(-4)
  const display = revealed ? apiKey : masked
  const endpoint = `${siteUrl}/api/v1/scan`

  const curlCommand =
`curl -X POST ${endpoint} \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{"url": "https://example.com"}'`

  const exampleResponse =
`{
  "url": "https://example.com",
  "score": 87,
  "errors": 2,
  "warnings": 3,
  "passes": 42,
  "scannedAt": "2026-05-07T12:00:00.000Z",
  "violations": [
    {
      "id": "image-alt",
      "impact": "critical",
      "help": "Images must have alternate text",
      "wcag": "wcag2a, wcag412",
      "nodes": [
        {
          "html": "<img src=\\"hero.jpg\\">",
          "target": "#hero > img",
          "failureSummary": "Fix any of the following: Element does not have an alt attribute",
          "impact": "critical"
        }
      ]
    }
  ]
}`

  return (
    <div className="space-y-5">

      {/* Key display */}
      <div>
        <p className="text-xs font-medium text-slate-600 mb-2">{t('apiKeyLabel')}</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 min-w-0 font-mono text-sm bg-slate-50 border border-slate-200
            rounded-xl px-4 py-2.5 text-slate-800 truncate">
            {display}
          </code>
          <button
            onClick={() => setRevealed(r => !r)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-slate-200
              rounded-lg text-slate-600 hover:bg-slate-50 transition shrink-0"
          >
            {revealed ? (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
                {t('hide')}
              </>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
                {t('show')}
              </>
            )}
          </button>
          <CopyButton text={apiKey} />
        </div>
        <p className="text-xs text-slate-400 mt-2">
          {t('apiKeyHint')}
        </p>
      </div>

      {/* Endpoint */}
      <div>
        <p className="text-xs font-medium text-slate-600 mb-2">{t('apiEndpointLabel')}</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 font-mono text-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 truncate">
            POST {endpoint}
          </code>
          <CopyButton text={endpoint} />
        </div>
      </div>

      {/* Curl example */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-slate-600">{t('apiExampleLabel')}</p>
          <CopyButton text={curlCommand} />
        </div>
        <pre className="text-xs font-mono bg-slate-950 text-emerald-400 rounded-xl px-4 py-4
          overflow-x-auto leading-relaxed whitespace-pre">
          {curlCommand}
        </pre>
      </div>

      {/* Response shape */}
      <div>
        <p className="text-xs font-medium text-slate-600 mb-2">{t('apiResponseLabel')}</p>
        <pre className="text-xs font-mono bg-slate-50 border border-slate-200 text-slate-600 rounded-xl
          px-4 py-4 overflow-x-auto leading-relaxed whitespace-pre">
          {exampleResponse}
        </pre>
      </div>

    </div>
  )
}
