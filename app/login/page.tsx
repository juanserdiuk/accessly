'use client'
import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<'google' | 'github' | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    if (searchParams.get('error') === 'oauth') {
      setErrors({ oauth: 'Sign-in failed. Please try again or use email and password.' })
    }
  }, [searchParams])

  function validate() {
    const e: Record<string, string> = {}
    if (!email.includes('@')) e.email = 'Please enter a valid email.'
    if (!password) e.password = 'Password is required.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleOAuth(provider: 'google' | 'github') {
    setOauthLoading(provider)
    setErrors({})
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${siteUrl}/auth/callback` },
    })
    if (error) {
      setOauthLoading(null)
      setErrors({ oauth: error.message })
    }
    // On success the browser navigates away — no cleanup needed
  }

  async function handleSubmit() {
    if (!validate()) return
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      setErrors({ password: error.message })
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex w-[420px] shrink-0 bg-slate-900 flex-col p-10 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_10%_110%,rgba(0,212,170,0.2),transparent)] pointer-events-none" />
        <Link href="/" className="flex items-center gap-2 font-serif text-xl text-white mb-14">
          <div className="w-8 h-8 bg-emerald-400 rounded-lg flex items-center justify-center">
            <span className="text-slate-900 text-sm font-bold">A</span>
          </div>
          Accessly
        </Link>
        <h2 className="font-serif text-4xl text-white leading-tight mb-4">
          Welcome<br />back.
        </h2>
        <p className="text-white/50 font-light leading-relaxed">
          Sign in to your dashboard and keep your sites accessible and compliant.
        </p>
        <div className="mt-auto">
          <div className="flex mb-3">
            {['JR','SK','ML','TP'].map((av, i) => (
              <div key={av} className="w-8 h-8 rounded-full border-2 border-slate-900 flex items-center justify-center text-xs font-semibold text-white -mr-2"
                style={{ background: ['#7c3aed','#0891b2','#be185d','#15803d'][i] }}>
                {av}
              </div>
            ))}
          </div>
          <p className="text-xs text-white/40">
            <span className="text-white/70 font-medium">50,000+ teams</span> trust Accessly for WCAG compliance.
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6 bg-slate-50">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-10 shadow-xl">
          <h3 className="font-serif text-2xl text-slate-900 mb-1">Sign in</h3>
          <p className="text-sm text-slate-500 mb-7">
            No account? <Link href="/signup" className="text-emerald-600 font-medium hover:underline">Create one free</Link>
          </p>

          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Email address</label>
            <input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: '' })) }}
              placeholder="you@company.com"
              className={`w-full px-4 py-3 border rounded-xl text-sm bg-slate-50 focus:outline-none focus:border-emerald-400 transition ${errors.email ? 'border-red-400' : 'border-slate-200'}`}
            />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
          </div>

          <div className="mb-2">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: '' })) }}
                placeholder="••••••••"
                className={`w-full px-4 py-3 pr-11 border rounded-xl text-sm bg-slate-50 focus:outline-none focus:border-emerald-400 transition ${errors.password ? 'border-red-400' : 'border-slate-200'}`}
              />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-medium">
                {showPass ? 'Hide' : 'Show'}
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
          </div>

          <div className="flex justify-end mb-6">
            <button className="text-xs text-emerald-600 font-medium hover:underline">Forgot password?</button>
          </div>

          <button onClick={handleSubmit} disabled={loading}
            className="w-full bg-slate-900 text-white font-semibold py-3.5 rounded-xl hover:bg-slate-700 transition disabled:opacity-60 flex items-center justify-center gap-2">
            {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
            {loading ? 'Signing in…' : 'Sign in'}
          </button>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400">or continue with</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {errors.oauth && (
            <div className="mb-3 flex items-start gap-2 text-xs text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500 shrink-0 mt-0.5">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {errors.oauth}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleOAuth('google')}
              disabled={oauthLoading !== null}
              className="flex items-center justify-center gap-2 border border-slate-200 rounded-xl py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {oauthLoading === 'google' ? (
                <span className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              )}
              {oauthLoading === 'google' ? 'Redirecting…' : 'Google'}
            </button>
            <button
              onClick={() => handleOAuth('github')}
              disabled={oauthLoading !== null}
              className="flex items-center justify-center gap-2 border border-slate-200 rounded-xl py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {oauthLoading === 'github' ? (
                <span className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>
              )}
              {oauthLoading === 'github' ? 'Redirecting…' : 'GitHub'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}