'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  email: string
}

export default function ResendVerifyButton({ email }: Props) {
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [error, setError] = useState('')

  async function resend() {
    setState('sending')
    setError('')
    try {
      const supabase = createClient()
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin
      const { error: err } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent('/dashboard')}`,
        },
      })
      if (err) {
        setState('error')
        setError(err.message)
        return
      }
      setState('sent')
    } catch (err) {
      setState('error')
      setError((err as Error).message ?? 'Could not resend')
    }
  }

  if (state === 'sent') {
    return (
      <div role="status" className="w-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium px-4 py-3 rounded-xl flex items-center justify-center gap-2">
        <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        Verification email sent — check your inbox.
      </div>
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={resend}
        disabled={state === 'sending'}
        className="w-full bg-slate-900 text-white font-semibold py-3 rounded-xl hover:bg-slate-700 transition disabled:opacity-60 flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2"
      >
        {state === 'sending' ? (
          <>
            <span aria-hidden="true" className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Sending…
          </>
        ) : (
          'Resend verification email'
        )}
      </button>
      {state === 'error' && error && (
        <p role="alert" className="mt-3 text-xs text-red-600 text-center">{error}</p>
      )}
    </>
  )
}
