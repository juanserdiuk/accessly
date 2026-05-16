'use client'

import { useState } from 'react'

interface Tier {
  slug: string
  dbPlan: string
  email: string
  label: string
  description: string
}

interface IssuedSession {
  url: string
  email: string
  plan: string
  tier: string
  label: string
}

interface SetupNeeded {
  email: string
  steps: string[]
  targetPlan: string
  tierLabel: string
}

/**
 * Tier-card grid for /admin/services-health. Each card:
 *   - Renders the tier label + plain-English description
 *   - "Generate test session" button → POST /api/admin/impersonate
 *   - On success, opens a modal with the magic-link URL + copy button
 *     + an "Open in new tab" affordance (caveat: same-browser cookies
 *     will replace the admin session; use incognito instead)
 *   - On 404 ("test user not found"), renders a structured setup
 *     panel with the email + step-by-step Supabase instructions so
 *     a first-time admin can finish the one-time fixture setup.
 */
export default function TierCards({ tiers }: { tiers: Tier[] }) {
  const [loadingSlug, setLoadingSlug] = useState<string | null>(null)
  const [issued, setIssued] = useState<IssuedSession | null>(null)
  const [setupNeeded, setSetupNeeded] = useState<SetupNeeded | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [emailCopied, setEmailCopied] = useState(false)

  async function generate(slug: string) {
    setLoadingSlug(slug)
    setError(null)
    setSetupNeeded(null)
    setCopied(false)
    setEmailCopied(false)
    try {
      const res = await fetch('/api/admin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: slug }),
      })
      const data = await res.json()
      if (!res.ok) {
        // Structured 404 from the API: test user hasn't been created
        // yet in Supabase. Render the dedicated setup panel instead
        // of a generic red error blob so the next step is obvious.
        if (res.status === 404 && data?.setupInstructions) {
          const tier = tiers.find(t => t.slug === slug)
          setSetupNeeded({
            email: data.setupInstructions.email,
            steps: data.setupInstructions.steps,
            targetPlan: data.setupInstructions.targetPlan,
            tierLabel: tier?.label ?? slug,
          })
          return
        }
        // Surface the Supabase diagnostic alongside the user-friendly
        // error so the failure mode is debuggable from the UI. The
        // admin route is gated by isAdminEmail, so leaking the raw
        // Supabase error here is fine — it isn't reachable by non-admins.
        // supabaseError can be: string | { message, code?, status? } |
        // Array<{ type, message, code?, status? }> (the link-retry case).
        const detail = data?.supabaseError
        const fmtSingle = (e: { type?: string; message?: string; code?: string; status?: number }) =>
          `${e.type ? `[${e.type}] ` : ''}${e.message ?? ''}${e.code ? ` (code: ${e.code})` : ''}${e.status ? ` [HTTP ${e.status}]` : ''}`
        const detailStr = !detail
          ? ''
          : typeof detail === 'string'
            ? detail
            : Array.isArray(detail)
              ? detail.map(fmtSingle).join('\n')
              : fmtSingle(detail)
        setError(
          detailStr
            ? `${data.error ?? `Failed (${res.status})`}\n→ ${detailStr}`
            : (data.error ?? `Failed (${res.status})`),
        )
        return
      }
      setIssued(data as IssuedSession)
    } catch (err) {
      setError((err as Error)?.message ?? 'Network error')
    } finally {
      setLoadingSlug(null)
    }
  }

  function copyUrl() {
    if (!issued) return
    navigator.clipboard.writeText(issued.url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function copySetupEmail() {
    if (!setupNeeded) return
    navigator.clipboard.writeText(setupNeeded.email).then(() => {
      setEmailCopied(true)
      setTimeout(() => setEmailCopied(false), 2000)
    })
  }

  return (
    <>
      {setupNeeded && (
        <div role="alert" className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700 mb-1">
                One-time setup needed
              </p>
              <h3 className="font-serif text-lg text-amber-950 leading-tight">
                Create the {setupNeeded.tierLabel} test account in Supabase
              </h3>
              <p className="text-xs text-amber-800 mt-1">
                Plan target after creation: <span className="font-mono">{setupNeeded.targetPlan}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSetupNeeded(null)}
              aria-label="Dismiss setup instructions"
              className="w-7 h-7 rounded-lg text-amber-600 hover:text-amber-900 hover:bg-amber-100 flex items-center justify-center transition shrink-0"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div className="bg-white border border-amber-200 rounded-xl px-3 py-2 mb-3 flex items-center justify-between gap-3">
            <code className="font-mono text-xs text-slate-800 break-all">{setupNeeded.email}</code>
            <button
              type="button"
              onClick={copySetupEmail}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-amber-100 text-amber-900 hover:bg-amber-200 transition shrink-0"
            >
              {emailCopied ? 'Copied' : 'Copy email'}
            </button>
          </div>

          <ol className="space-y-1.5 text-xs text-amber-900 leading-relaxed list-decimal list-inside marker:text-amber-600 marker:font-bold">
            {setupNeeded.steps.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>

          <p className="text-[11px] text-amber-700 mt-3 leading-relaxed">
            Why manually? Supabase&rsquo;s admin <code className="font-mono">createUser</code> API
            returns <code className="font-mono">unexpected_failure</code> in this project, likely
            from a project-level Auth hook. Creating the QA users once by hand is more reliable
            and lets us pre-set fixture state.
          </p>
        </div>
      )}

      {error && (
        <div role="alert" className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 whitespace-pre-line">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {tiers.map(t => (
          <div
            key={t.slug}
            className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-emerald-300 hover:shadow-md transition flex flex-col"
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <h2 className="font-serif text-lg text-slate-900 leading-tight">
                {t.label}
              </h2>
              <span className="text-[10px] font-bold uppercase tracking-widest bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full whitespace-nowrap">
                DB: {t.dbPlan}
              </span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed mb-4 flex-1">
              {t.description}
            </p>

            <p className="text-[11px] text-slate-400 font-mono mb-3 truncate" title={t.email}>
              {t.email}
            </p>

            <button
              type="button"
              onClick={() => generate(t.slug)}
              disabled={loadingSlug !== null}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-700 transition disabled:opacity-50"
            >
              {loadingSlug === t.slug ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generating…
                </>
              ) : (
                <>
                  Generate test session
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </>
              )}
            </button>
          </div>
        ))}
      </div>

      {/* Modal — appears after a successful impersonate call */}
      {issued && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="impersonate-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4"
        >
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700 mb-1">
                  Session ready
                </p>
                <h3 id="impersonate-modal-title" className="font-serif text-xl text-slate-900 leading-tight">
                  Test session for {issued.label}
                </h3>
                <p className="text-xs text-slate-500 mt-1 font-mono">
                  {issued.email} · plan: {issued.plan}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIssued(null)}
                aria-label="Close"
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition shrink-0"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4">
              <p className="text-xs text-amber-900 leading-relaxed">
                <strong>Open this URL in an incognito / private window.</strong> If
                you open it in your normal browser, the magic-link sign-in
                will replace your admin session and you&rsquo;ll have to log
                back in afterward.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-1.5">
                Magic-link URL (single-use, ~1h expiry)
              </p>
              <p className="font-mono text-[11px] text-slate-700 break-all leading-relaxed">
                {issued.url}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={copyUrl}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition"
              >
                {copied ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Copied
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                    Copy URL
                  </>
                )}
              </button>
              <a
                href={issued.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 transition"
              >
                Open in new tab
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
            </div>

            <p className="text-[11px] text-slate-400 mt-4 leading-relaxed">
              Tip: On macOS Safari, right-click the URL → &ldquo;Open in New
              Private Window&rdquo;. On Chrome, ⌘+Shift+N opens a new
              incognito window where you can paste it.
            </p>
          </div>
        </div>
      )}
    </>
  )
}
