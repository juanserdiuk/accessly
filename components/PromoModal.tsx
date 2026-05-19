'use client'

import { useEffect, useState } from 'react'

interface Props {
  open: boolean
  onClose: () => void
  /** Receives the validated promo code (or null = continue without). */
  onContinue: (code: string | null) => void
}

type ValidateState =
  | { phase: 'idle' }
  | { phase: 'checking' }
  | { phase: 'valid'; code: string; discountPercent: number }
  | { phase: 'invalid'; error: string }

export default function PromoModal({ open, onClose, onContinue }: Props) {
  const [code, setCode] = useState('')
  const [state, setState] = useState<ValidateState>({ phase: 'idle' })

  // Reset whenever the modal opens
  useEffect(() => {
    if (open) {
      setCode('')
      setState({ phase: 'idle' })
    }
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  async function validate() {
    const trimmed = code.trim()
    if (!trimmed) {
      setState({ phase: 'invalid', error: 'Enter a code first.' })
      return
    }
    setState({ phase: 'checking' })
    try {
      const res = await fetch('/api/promo/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: trimmed }),
      })
      const data = await res.json().catch(() => ({}))
      if (data.ok) {
        setState({ phase: 'valid', code: data.code, discountPercent: data.discountPercent })
      } else {
        setState({ phase: 'invalid', error: data?.error ?? "We couldn't validate that code." })
      }
    } catch {
      setState({ phase: 'invalid', error: 'Network error. Try again.' })
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="promo-modal-title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm animate-[fadeIn_180ms_ease-out]"
      />

      {/* Card */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-[scaleIn_220ms_cubic-bezier(0.22,1,0.36,1)]">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <h2 id="promo-modal-title" className="font-serif text-xl text-slate-900">Have a promo code?</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close promo code modal"
            className="w-11 h-11 inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition -mr-2"
          >
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="p-6">
          <p className="text-sm text-slate-500 mb-4">
            Enter your code below to apply your discount. Skip this step to continue with the regular price.
          </p>

          <label htmlFor="promo-code-input" className="sr-only">Promo code</label>
          <div className="flex gap-2 mb-3">
            <input
              id="promo-code-input"
              type="text"
              value={code}
              onChange={e => { setCode(e.target.value.toUpperCase()); setState({ phase: 'idle' }) }}
              onKeyDown={e => e.key === 'Enter' && validate()}
              placeholder="e.g. SUMMER10"
              autoFocus
              autoComplete="off"
              aria-describedby={state.phase === 'invalid' ? 'promo-code-error' : undefined}
              aria-invalid={state.phase === 'invalid' || undefined}
              className="flex-1 px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:border-emerald-400 focus-visible:ring-2 focus-visible:ring-emerald-400 transition uppercase placeholder:normal-case placeholder:text-slate-300"
            />
            <button
              type="button"
              onClick={validate}
              disabled={state.phase === 'checking' || !code.trim()}
              className="px-4 min-h-[44px] bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-700 transition disabled:opacity-50"
            >
              {state.phase === 'checking' ? 'Checking…' : 'Apply'}
            </button>
          </div>

          {state.phase === 'valid' && (
            <div role="status" aria-live="polite" className="flex items-start gap-2.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 mb-4">
              <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600 shrink-0 mt-0.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <div>
                <strong className="font-semibold">{state.code}</strong> applied — {state.discountPercent}% off at checkout.
              </div>
            </div>
          )}
          {state.phase === 'invalid' && (
            <div id="promo-code-error" role="alert" className="flex items-start gap-2.5 text-xs text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-4">
              <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500 shrink-0 mt-0.5">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {state.error}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 mt-2">
            <button
              onClick={() => onContinue(state.phase === 'valid' ? state.code : null)}
              className="flex-1 px-5 py-3 bg-emerald-400 text-slate-900 font-bold rounded-xl hover:bg-emerald-300 transition text-sm"
            >
              {state.phase === 'valid' ? 'Continue with discount →' : 'Continue without code →'}
            </button>
            <button
              onClick={onClose}
              className="px-5 py-3 border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition text-sm"
            >
              Cancel
            </button>
          </div>
        </div>

        <style>{`
          @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
          @keyframes scaleIn {
            from { opacity: 0; transform: scale(0.95) translateY(8px) }
            to   { opacity: 1; transform: scale(1) translateY(0) }
          }
        `}</style>
      </div>
    </div>
  )
}
