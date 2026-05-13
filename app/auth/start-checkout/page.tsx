'use client'
import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

function StartCheckout() {
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const plan = (searchParams.get('plan') ?? '').toLowerCase()
    const billing = searchParams.get('billing') === 'annual' ? 'annual' : 'monthly'

    if (!['pro', 'agency'].includes(plan)) {
      setError('Invalid plan')
      return
    }

    let cancelled = false

    async function go() {
      try {
        const res = await fetch('/api/stripe/create-checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'subscription', plan, billing }),
        })
        const data = await res.json().catch(() => ({}))
        if (cancelled) return

        if (data.url) {
          window.location.href = data.url
          return
        }
        setError(data?.error ?? `Checkout failed (${res.status})`)
      } catch (err: any) {
        if (!cancelled) setError(err?.message ?? 'Network error')
      }
    }

    go()
    return () => { cancelled = true }
  }, [searchParams])

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-10 max-w-md w-full shadow-xl">
        {error ? (
          <div className="text-center">
            <h1 className="font-serif text-2xl text-slate-900 mb-2">Couldn&apos;t start checkout</h1>
            <p className="text-sm text-slate-500 mb-6">{error}</p>
            <Link
              href="/dashboard"
              className="inline-block bg-slate-900 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-slate-700 transition text-sm"
            >
              Go to dashboard
            </Link>
          </div>
        ) : (
          <div className="text-center">
            <span className="inline-block w-8 h-8 border-2 border-slate-200 border-t-emerald-500 rounded-full animate-spin mb-4" />
            <h1 className="font-serif text-xl text-slate-900 mb-1">Starting your checkout…</h1>
            <p className="text-sm text-slate-500">You&rsquo;ll be redirected to Stripe in a moment.</p>
          </div>
        )}
      </div>
    </main>
  )
}

export default function StartCheckoutPage() {
  return (
    <Suspense>
      <StartCheckout />
    </Suspense>
  )
}
