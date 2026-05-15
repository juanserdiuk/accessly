'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

type Item = {
  kind: 'scan' | 'hint'
  title: string
  sub: string
  href: string
  impact?: 'good' | 'bad' | 'info'
  when: string
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  const hours = Math.floor(mins / 60)
  const days = Math.floor(hours / 24)
  if (mins < 1)   return 'just now'
  if (mins < 60)  return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7)   return `${days}d ago`
  return new Date(iso).toLocaleDateString()
}

const impactDot: Record<string, string> = {
  good: 'bg-emerald-500',
  bad:  'bg-red-500',
  info: 'bg-amber-500',
}

export default function NotificationsButton() {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<Item[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [hasUnread, setHasUnread] = useState(true)
  const ref = useRef<HTMLDivElement>(null)

  async function loadIfNeeded() {
    if (items !== null || loading) return
    setLoading(true)
    try {
      const res = await fetch('/api/dashboard/recent-activity')
      const data = await res.json().catch(() => ({}))
      setItems(Array.isArray(data.items) ? data.items : [])
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  function toggle() {
    setOpen(o => !o)
    if (!open) {
      setHasUnread(false)
      loadIfNeeded()
    }
  }

  // Close on Escape, click outside
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onClickOutside)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onClickOutside)
    }
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={toggle}
        aria-label="Notifications"
        aria-expanded={open}
        aria-haspopup="dialog"
        className="relative w-9 h-9 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 transition"
      >
        <span aria-hidden="true">🔔</span>
        {hasUnread && (
          <span aria-hidden="true" className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white" />
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Recent activity"
          className="absolute right-0 mt-2 w-80 sm:w-96 max-h-[70vh] overflow-y-auto bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 animate-[notifFadeIn_120ms_ease-out]"
        >
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900">Recent activity</p>
            <Link
              href="/dashboard/scans"
              onClick={() => setOpen(false)}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 transition"
            >
              View all →
            </Link>
          </div>

          {loading && (
            <div className="px-4 py-8 text-center text-xs text-slate-400">Loading…</div>
          )}

          {!loading && items !== null && items.length === 0 && (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-slate-500 mb-1">No activity yet</p>
              <p className="text-xs text-slate-400">Run your first scan to see it here.</p>
            </div>
          )}

          {!loading && items && items.length > 0 && (
            <ul className="divide-y divide-slate-100">
              {items.map((item, i) => (
                <li key={i}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition"
                  >
                    <span
                      aria-hidden="true"
                      className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${impactDot[item.impact ?? 'info']}`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{item.title}</p>
                      <p className="text-xs text-slate-500 truncate">{item.sub}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{timeAgo(item.when)}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <style>{`
        @keyframes notifFadeIn {
          0% { opacity: 0; transform: translateY(-4px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
