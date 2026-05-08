'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function TokenForm() {
  const [label, setLabel]         = useState('')
  const [expiry, setExpiry]       = useState('30')
  const [creating, setCreating]   = useState(false)
  const [created, setCreated]     = useState<{ token: string } | null>(null)
  const [error, setError]         = useState('')
  const [copied, setCopied]       = useState(false)
  const router = useRouter()

  const guestUrl = created
    ? `${window.location.origin}/guest/${created.token}`
    : ''

  async function create(e: React.FormEvent) {
    e.preventDefault()
    if (!label.trim()) return
    setError('')
    setCreating(true)
    setCreated(null)

    try {
      const res = await fetch('/api/guest/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: label.trim(), expiresInDays: Number(expiry) }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        setError(data.error ?? 'Failed to create token')
      } else {
        setCreated(data)
        setLabel('')
        router.refresh()
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setCreating(false)
    }
  }

  async function copy() {
    await navigator.clipboard.writeText(guestUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6">
      <h2 className="font-semibold text-slate-900 mb-1">Create guest link</h2>
      <p className="text-sm text-slate-400 mb-5">
        Generate a shareable link for product launches, demos, or influencer campaigns.
      </p>

      <form onSubmit={create} className="flex gap-3 flex-wrap">
        <input
          required
          type="text"
          placeholder="e.g. ProductHunt Launch"
          value={label}
          onChange={e => setLabel(e.target.value)}
          className="flex-1 min-w-48 px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50
            focus:outline-none focus:border-emerald-400 transition placeholder:text-slate-300"
        />
        <select
          value={expiry}
          onChange={e => setExpiry(e.target.value)}
          className="px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50
            focus:outline-none focus:border-emerald-400 transition text-slate-700 cursor-pointer"
        >
          <option value="7">7 days</option>
          <option value="14">14 days</option>
          <option value="30">30 days</option>
          <option value="90">90 days</option>
          <option value="365">1 year</option>
        </select>
        <button
          type="submit"
          disabled={creating}
          className="px-5 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-xl
            hover:bg-slate-700 transition disabled:opacity-50 shrink-0"
        >
          {creating ? 'Creating…' : 'Create link'}
        </button>
      </form>

      {error && <p className="text-xs text-red-500 mt-3">{error}</p>}

      {created && guestUrl && (
        <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
          <p className="text-xs font-semibold text-emerald-700 mb-2">Guest link created — share this URL:</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs text-emerald-800 bg-white border border-emerald-200 rounded-lg px-3 py-2 truncate font-mono">
              {guestUrl}
            </code>
            <button
              onClick={copy}
              className="shrink-0 text-xs font-semibold px-3 py-2 rounded-lg bg-emerald-600 text-white
                hover:bg-emerald-700 transition"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
