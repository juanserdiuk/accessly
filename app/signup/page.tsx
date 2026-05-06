'use client'
import { useState } from 'react'
import Link from 'next/link'

const plans = ['Free','Pro','Agency']
const prices: Record<string, string> = { Free: '$0/mo', Pro: '$29/mo', Agency: '$99/mo' }

function getStrength(pw: string) {
  let s = 0
  if (pw.length >= 8) s++
  if (/[A-Z]/.test(pw)) s++
  if (/[0-9]/.test(pw)) s++
  if (/[^A-Za-z0-9]/.test(pw)) s++
  return s
}

export default function SignupPage() {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' })
  const [plan, setPlan] = useState('Pro')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const strength = getStrength(form.password)
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strength]
  const strengthColor = ['', 'bg-red-400', 'bg-amber-400', 'bg-emerald-400', 'bg-green-500'][strength]

  function update(k: string, v: string) {
    setForm(p => ({ ...p, [k]: v }))
    setErrors(p => ({ ...p, [k]: '' }))
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!form.firstName) e.firstName = 'Required.'
    if (!form.lastName) e.lastName = 'Required.'
    if (!form.email.includes('@')) e.email = 'Please enter a valid email.'
    if (form.password.length < 8) e.password = 'Must be at least 8 characters.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit() {
    if (!validate()) return
    setLoading(true)
    await new Promise(r => setTimeout(r, 1600))
    setLoading(false)
    setDone(true)
  }

  if (done) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="bg-white border border-slate-200 rounded-2xl p-10 max-w-sm w-full text-center shadow-xl">
        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-5">
          <span className="text-3xl">✓</span>
        </div>
        <h2 className="font-serif text-2xl text-slate-900 mb-2">Account created!</h2>
        <p className="text-sm text-slate-500 mb-6">Check your inbox — we sent a confirmation to <strong>{form.email}</strong></p>
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
          Start making<br />your site<br /><em className="text-emerald-400 not-italic">accessible.</em>
        </h2>
        <p className="text-white/50 font-light leading-relaxed mb-8">
          Join 50,000+ developers who use Accessly to build inclusive, WCAG-compliant experiences.
        </p>
        <div className="space-y-3">
          {['Unlimited free scans to start','Full WCAG 2.2 coverage','14-day Pro trial, no card needed'].map(item => (
            <div key={item} className="flex items-center gap-3 text-sm text-white/70">
              <span className="text-emerald-400 font-bold">✓</span>
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-10 bg-slate-50">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-10 shadow-xl">
          <h3 className="font-serif text-2xl text-slate-900 mb-1">Create your account</h3>
          <p className="text-sm text-slate-500 mb-7">
            Already have one? <Link href="/login" className="text-emerald-600 font-medium hover:underline">Sign in</Link>
          </p>

          <div className="grid grid-cols-2 gap-3 mb-4">
            {[['firstName','First name','Jane'],['lastName','Last name','Doe']].map(([k, label, ph]) => (
              <div key={k}>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
                <input
                  type="text"
                  value={form[k as keyof typeof form]}
                  onChange={e => update(k, e.target.value)}
                  placeholder={ph}
                  className={`w-full px-3 py-3 border rounded-xl text-sm bg-slate-50 focus:outline-none focus:border-emerald-400 transition ${errors[k] ? 'border-red-400' : 'border-slate-200'}`}
                />
                {errors[k] && <p className="text-xs text-red-500 mt-1">{errors[k]}</p>}
              </div>
            ))}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Work email</label>
            <input
              type="email"
              value={form.email}
              onChange={e => update('email', e.target.value)}
              placeholder="you@company.com"
              className={`w-full px-4 py-3 border rounded-xl text-sm bg-slate-50 focus:outline-none focus:border-emerald-400 transition ${errors.email ? 'border-red-400' : 'border-slate-200'}`}
            />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={form.password}
                onChange={e => update('password', e.target.value)}
                placeholder="Min. 8 characters"
                className={`w-full px-4 py-3 pr-11 border rounded-xl text-sm bg-slate-50 focus:outline-none focus:border-emerald-400 transition ${errors.password ? 'border-red-400' : 'border-slate-200'}`}
              />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-medium">
                {showPass ? 'Hide' : 'Show'}
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
            {form.password.length > 0 && (
              <div className="mt-2">
                <div className="flex gap-1 mb-1">
                  {[1,2,3,4].map(i => (
                    <div key={i} className={`flex-1 h-1 rounded-full transition-all ${i <= strength ? strengthColor : 'bg-slate-100'}`} />
                  ))}
                </div>
                <p className="text-xs text-slate-400">{strengthLabel}</p>
              </div>
            )}
          </div>

          <div className="mb-5">
            <label className="block text-sm font-medium text-slate-700 mb-2">Choose a plan</label>
            <div className="grid grid-cols-3 gap-2">
              {plans.map(p => (
                <button key={p} type="button" onClick={() => setPlan(p)}
                  className={`border rounded-xl py-2.5 text-center transition ${plan === p ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 hover:border-slate-300'}`}>
                  <div className={`text-sm font-semibold ${plan === p ? 'text-emerald-700' : 'text-slate-800'}`}>{p}</div>
                  <div className={`text-xs mt-0.5 ${plan === p ? 'text-emerald-500' : 'text-slate-400'}`}>{prices[p]}</div>
                </button>
              ))}
            </div>
          </div>

          <button onClick={handleSubmit} disabled={loading}
            className="w-full bg-slate-900 text-white font-semibold py-3.5 rounded-xl hover:bg-slate-700 transition disabled:opacity-60 flex items-center justify-center gap-2">
            {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
            {loading ? 'Creating account…' : plan === 'Free' ? 'Create free account' : `Start ${plan} trial`}
          </button>

          <div className="flex items-center gap-3 my-4">
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

          <p className="text-xs text-slate-400 text-center mt-4">
            By signing up you agree to our{' '}
            <a href="#" className="underline">Terms</a> and{' '}
            <a href="#" className="underline">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  )
}