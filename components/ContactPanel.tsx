'use client'
import { useState } from 'react'

export default function ContactPanel() {
  const [form, setForm] = useState({ name: '', email: '', url: '', message: '' })
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  function update(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        setError(data.error || 'Something went wrong. Please try again.')
      } else {
        setSuccess(true)
      }
    } catch {
      setError('Could not reach the server. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const inputClass =
    'w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 ' +
    'focus:outline-none focus:border-emerald-400 focus:bg-white transition placeholder:text-slate-300'

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden flex flex-col">
      {/* Panel header */}
      <div className="bg-slate-900 px-5 py-4 flex items-center gap-3">
        <div className="w-8 h-8 bg-emerald-400/15 rounded-lg flex items-center justify-center text-emerald-400 shrink-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-white">Talk to an Expert</div>
          <div className="text-xs text-white/40">Get personalised guidance</div>
        </div>
        <span className="ml-auto shrink-0 text-xs font-medium bg-emerald-400/20 text-emerald-400 px-2.5 py-1 rounded-full">
          Free
        </span>
      </div>

      {/* Panel body */}
      <div className="p-6 flex-1 flex flex-col">
        {success ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-10">
            <div className="w-14 h-14 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-center mb-5">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Message sent!</h3>
            <p className="text-sm text-slate-500 max-w-xs">
              Thanks for reaching out. We&apos;ll get back to you within one business day.
            </p>
            <button
              onClick={() => { setSuccess(false); setForm({ name: '', email: '', url: '', message: '' }) }}
              className="mt-6 text-sm text-slate-400 hover:text-slate-600 transition"
            >
              Send another message
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-3 flex-1">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Name</label>
                <input
                  required
                  type="text"
                  placeholder="Jane Smith"
                  value={form.name}
                  onChange={update('name')}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Email</label>
                <input
                  required
                  type="email"
                  placeholder="jane@company.com"
                  value={form.email}
                  onChange={update('email')}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">
                Website URL <span className="text-slate-300 font-normal">(optional)</span>
              </label>
              <input
                type="url"
                placeholder="https://yoursite.com"
                value={form.url}
                onChange={update('url')}
                className={inputClass}
              />
            </div>

            <div className="flex-1 flex flex-col">
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Message</label>
              <textarea
                required
                rows={5}
                placeholder="Tell us about your accessibility goals or the challenges you're facing…"
                value={form.message}
                onChange={update('message')}
                className={inputClass + ' resize-none flex-1'}
              />
            </div>

            {error && <p className="text-xs text-red-500">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-slate-900 text-white text-sm font-semibold rounded-xl
                hover:bg-slate-700 transition disabled:opacity-50 mt-1"
            >
              {submitting ? 'Sending…' : 'Send message'}
            </button>

            <p className="text-xs text-slate-400 text-center">
              We typically respond within one business day.
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
