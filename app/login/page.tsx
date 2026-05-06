'use client'
import { useState } from 'react'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate() {
    const e: Record<string, string> = {}
    if (!email.includes('@')) e.email = 'Please enter a valid email.'
    if (!password) e.password = 'Password is required.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit() {
    if (!validate()) return
    setLoading(true)
    await new Promise(r => setTimeout(r, 1400))
    setLoading(false)
    setDone(true)
  }

  if (done) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="bg-white border border-slate-200 rounded-2xl p-10 max-w-sm w-full text-center shadow-xl">
        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-5">
          <span className="text-3xl">✓</span>
        </div>
        <h2 className="font-serif text-2xl text-slate-900 mb-2">Signed in!</h2>
        <p className="text-sm text-slate-500 mb-6">Welcome back. Your dashboard is ready.</p>
        <Link href="/dashboard" className="block bg-emerald-400 text-slate-900 font-semibold py-3 rounded-xl hover:bg-emerald-300 transition">
          Go to dashboard →
        </Link>
      </div>
    </div>
  )

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
            <span className="text-xs text-slate-400">or</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {['Google', 'GitHub'].map(p => (
              <button key={p} className="flex items-center justify-center gap-2 border border-slate-200 rounded-xl py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition">
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}