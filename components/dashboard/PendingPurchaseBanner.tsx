'use client'

import { useState, useTransition } from 'react'
import { clearPendingIntent } from '@/app/dashboard/actions'

export interface PendingIntent {
  type: 'pack' | 'subscription'
  plan: string
  billing?: 'monthly' | 'annual'
  code?: string
}

// Pretty labels — kept in sync with signup's PACK_INFO / SUB_INFO.
const PACK_INFO: Record<string, { label: string; price: string; pages: number }> = {
  starter:       { label: 'Starter Scan Pack',  price: '$9',  pages: 10 },
  basic:         { label: 'Basic Scan Pack',    price: '$19', pages: 25 },
  'pro-pack':    { label: 'Pro Scan Pack',      price: '$29', pages: 50 },
  'agency-pack': { label: 'Agency Scan Pack',   price: '$49', pages: 100 },
}
const SUB_INFO: Record<string, { label: string; monthly: number }> = {
  pro:    { label: 'Pro plan',    monthly: 29 },
  agency: { label: 'Agency plan', monthly: 99 },
}

function describe(intent: PendingIntent): { label: string; priceLabel: string } {
  if (intent.type === 'pack') {
    const info = PACK_INFO[intent.plan]
    if (!info) return { label: 'Your purchase', priceLabel: '' }
    return { label: info.label, priceLabel: `${info.price} · ${info.pages} pages` }
  }
  const info = SUB_INFO[intent.plan]
  if (!info) return { label: 'Your subscription', priceLabel: '' }
  const yearly = Math.round(info.monthly * 12 * 0.8)
  return {
    label: info.label,
    priceLabel: intent.billing === 'annual'
      ? `$${yearly} / yr (save 20%)`
      : `$${info.monthly} / month`,
  }
}

export default function PendingPurchaseBanner({ intent }: { intent: PendingIntent }) {
  const { label, priceLabel } = describe(intent)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  async function continueCheckout() {
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: intent.type,
          plan: intent.plan,
          billing: intent.billing ?? 'monthly',
          promoCode: intent.code,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (data.url) {
        window.location.href = data.url
        return
      }
      setError(data.error ?? `Checkout failed (${res.status})`)
    } catch {
      setError('Network error — please retry.')
    } finally {
      setLoading(false)
    }
  }

  function dismiss() {
    startTransition(async () => {
      await clearPendingIntent()
    })
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 text-white shadow-xl shadow-emerald-500/20">
      <div aria-hidden="true" className="pointer-events-none absolute -top-12 -right-12 w-48 h-48 bg-white/15 rounded-full blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-8 -left-8 w-40 h-40 bg-cyan-300/20 rounded-full blur-3xl" />

      <div className="relative p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
        <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center shrink-0">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-widest bg-white/20 border border-white/20 px-2 py-0.5 rounded-full">
              One step left
            </span>
          </div>
          <p className="font-serif text-xl sm:text-2xl leading-tight">
            Complete your <span className="font-bold">{label}</span> purchase
          </p>
          <p className="text-sm text-white/85 mt-1">
            {priceLabel}
            {intent.code && (
              <> · promo <code className="font-mono bg-white/15 px-1.5 py-0.5 rounded">{intent.code}</code></>
            )}
          </p>
          {error && (
            <p className="text-sm text-amber-100 bg-red-500/30 border border-red-400/30 rounded-lg px-3 py-1.5 mt-2 inline-block">
              {error}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={dismiss}
            disabled={isPending}
            className="px-3 py-2.5 text-sm font-medium text-white/75 hover:text-white transition disabled:opacity-50"
          >
            {isPending ? 'Removing…' : 'Maybe later'}
          </button>
          <button
            type="button"
            onClick={continueCheckout}
            disabled={loading}
            className="inline-flex items-center gap-2 bg-white text-emerald-700 font-bold px-5 py-2.5 rounded-xl hover:bg-white/90 transition text-sm shadow-lg disabled:opacity-70"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-emerald-300 border-t-emerald-700 rounded-full animate-spin" />
                Opening Stripe…
              </>
            ) : (
              <>
                Continue to checkout
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                </svg>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
