import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import GuestScanner from './GuestScanner'
import DocScanner from '@/components/DocScanner'

type Props = { params: Promise<{ token: string }> }

function ExpiredState({ label }: { label: string }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-slate-900 px-6 h-14 flex items-center gap-3 shrink-0">
        <div className="w-7 h-7 bg-emerald-400 rounded-lg flex items-center justify-center shrink-0">
          <span className="text-slate-900 text-xs font-bold">A</span>
        </div>
        <span className="font-serif text-lg text-white">Accessly</span>
      </header>
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center max-w-md w-full shadow-xl">
          <div className="w-14 h-14 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
          </div>
          <h1 className="font-serif text-2xl text-slate-900 mb-2">This link has expired</h1>
          <p className="text-sm text-slate-500 mb-1">
            The guest access link <span className="font-medium text-slate-700">&ldquo;{label}&rdquo;</span> is no longer active.
          </p>
          <p className="text-sm text-slate-400 mb-8">Create a free account to get started.</p>
          <div className="flex gap-3 justify-center">
            <Link href="/signup"
              className="bg-slate-900 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-slate-700 transition text-sm">
              Create free account
            </Link>
            <Link href="/"
              className="bg-slate-100 text-slate-700 font-semibold px-5 py-2.5 rounded-xl hover:bg-slate-200 transition text-sm">
              Learn more
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default async function GuestPage({ params }: Props) {
  const { token } = await params

  const admin = createAdminClient()
  const { data: gt, error } = await admin
    .from('guest_tokens')
    .select('id, label, expires_at, is_active')
    .eq('token', token)
    .single()

  if (error || !gt) notFound()

  const expired = new Date(gt.expires_at) < new Date()
  if (!gt.is_active || expired) return <ExpiredState label={gt.label} />

  const daysLeft = Math.ceil((new Date(gt.expires_at).getTime() - Date.now()) / 86_400_000)

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">

      {/* Header */}
      <header className="bg-slate-900 px-6 h-14 flex items-center justify-between shrink-0 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-emerald-400 rounded-lg flex items-center justify-center shrink-0">
            <span className="text-slate-900 text-xs font-bold">A</span>
          </div>
          <span className="font-serif text-lg text-white">Accessly</span>
          <span className="hidden sm:inline-flex items-center gap-1.5 ml-2 text-xs font-medium text-white/50 bg-white/8 border border-white/10 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            {gt.label}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-white/30 hidden sm:block">
            {daysLeft}d left
          </span>
          <Link href="/signup"
            className="bg-emerald-400 text-slate-900 text-xs font-semibold px-3.5 py-2 rounded-lg hover:bg-emerald-300 transition">
            Create free account →
          </Link>
        </div>
      </header>

      {/* Welcome banner */}
      <div className="bg-emerald-600 px-6 py-3 text-center">
        <p className="text-sm text-white/90">
          You have full access to all Accessly tools.{' '}
          <Link href="/signup" className="font-semibold text-white hover:underline">
            Sign up free
          </Link>{' '}
          to save your results and scan history.
        </p>
      </div>

      {/* Main content */}
      <div className="flex-1 py-10 px-6">
        <div className="max-w-4xl mx-auto">

          <div className="text-center mb-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600 mb-3">
              Guest access · {gt.label}
            </p>
            <h1 className="font-serif text-3xl text-slate-900 mb-2">
              Check your site&apos;s accessibility
            </h1>
            <p className="text-slate-500">
              Full WCAG 2.1 scanner — no limits, no sign-up required.
            </p>
          </div>

          <div className="space-y-10">
            <GuestScanner />
            <DocScanner />
          </div>

        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 px-6 py-6 text-center mt-auto">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <p className="text-sm text-white/40">
            Like what you see?{' '}
            <Link href="/signup" className="text-emerald-400 font-semibold hover:underline">
              Create your free Accessly account
            </Link>
          </p>
          <span className="hidden sm:block text-white/20">·</span>
          <p className="text-xs text-white/25">
            Powered by{' '}
            <Link href="/" className="hover:text-white/50 transition">Accessly</Link>
          </p>
        </div>
      </footer>

    </div>
  )
}
