import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import ResendVerifyButton from './ResendVerifyButton'

/**
 * Pending-verification holding page. Shown when a signed-in user lands on
 * any protected route before they've confirmed their email. They can resend
 * the verification email or sign out from here.
 */
export default async function VerifyPendingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Not signed in at all → /login
  if (!user) redirect('/login')

  // Already verified → drop them on the dashboard (the layout guard would
  // also do this, but bouncing here makes the URL clean if they hit /auth/
  // verify-pending directly after confirming).
  if (user.email_confirmed_at) redirect('/dashboard')

  return (
    <main id="main-content" className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl p-8 sm:p-10">
        <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600" aria-hidden="true">
            <rect x="2" y="4" width="20" height="16" rx="2"/>
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
          </svg>
        </div>

        <h1 className="font-serif text-2xl text-slate-900 mb-2 text-center">Confirm your email first.</h1>
        <p className="text-sm text-slate-500 text-center mb-6 leading-relaxed">
          We sent a confirmation link to <strong className="text-slate-700 break-all">{user.email}</strong>.
          Click it to activate your account — then come back here.
        </p>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 text-xs text-slate-500 leading-relaxed">
          <p className="font-semibold text-slate-700 mb-1.5">Didn&apos;t get it?</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Check your <strong>spam folder</strong> — first-time delivery often lands there</li>
            <li>Confirm you typed the email correctly</li>
            <li>Hit <strong>Resend</strong> below — we&apos;ll send a fresh link</li>
          </ul>
        </div>

        <ResendVerifyButton email={user.email ?? ''} />

        <div className="mt-6 pt-6 border-t border-slate-100 text-center">
          <Link
            href="/api/auth/signout"
            className="text-xs font-medium text-slate-500 hover:text-slate-800 transition"
          >
            Wrong email? Sign out and try again
          </Link>
        </div>
      </div>
    </main>
  )
}
