'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface ResultItem {
  type: 'scan' | 'site' | 'portfolio' | 'page'
  title: string
  subtitle?: string
  href: string
}

const TYPE_LABEL: Record<ResultItem['type'], string> = {
  page: 'Page',
  scan: 'Scan',
  site: 'Site',
  portfolio: 'Portfolio',
}

const TYPE_ICON: Record<ResultItem['type'], React.ReactNode> = {
  page: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  scan: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  site: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
  portfolio: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>,
}

export default function GlobalSearch() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [results, setResults] = useState<ResultItem[]>([])
  const [active, setActive] = useState(0)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Global Cmd+K / Ctrl+K to open
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen(true)
      }
      if (e.key === 'Escape' && open) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  // Focus the input when opened
  useEffect(() => {
    if (open) {
      setQ('')
      setResults([])
      setActive(0)
      setTimeout(() => inputRef.current?.focus(), 50)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!q.trim()) {
      setResults([])
      setLoading(false)
      return
    }
    setLoading(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/dashboard/search?q=${encodeURIComponent(q)}`, {
          headers: { 'Content-Type': 'application/json' },
        })
        const data = await res.json().catch(() => ({}))
        setResults(data.results ?? [])
        setActive(0)
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 180)
  }, [q])

  const navigate = useCallback((item: ResultItem) => {
    setOpen(false)
    router.push(item.href)
  }, [router])

  function onKeyInInput(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive(i => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && results[active]) {
      e.preventDefault()
      navigate(results[active])
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Search (⌘K)"
        className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-400 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 hover:text-slate-700 transition"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <span className="hidden md:inline">Search…</span>
        <kbd className="hidden md:inline-block px-1.5 py-0.5 text-[10px] font-semibold bg-white border border-slate-200 rounded text-slate-400">⌘K</kbd>
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Search dashboard"
          className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] px-4"
        >
          <div
            onClick={() => setOpen(false)}
            aria-hidden="true"
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm animate-[fadeIn_120ms_ease-out]"
          />
          <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-[searchIn_180ms_cubic-bezier(0.22,1,0.36,1)]">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 shrink-0">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={q}
                onChange={e => setQ(e.target.value)}
                onKeyDown={onKeyInInput}
                placeholder="Search scans, sites, portfolios, pages…"
                className="flex-1 bg-transparent text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none"
              />
              {loading && <span className="w-3.5 h-3.5 border-2 border-slate-200 border-t-emerald-500 rounded-full animate-spin" />}
              <kbd className="text-[10px] font-semibold bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-slate-400">ESC</kbd>
            </div>

            <div className="max-h-[60vh] overflow-y-auto">
              {q.trim() === '' ? (
                <p className="px-5 py-10 text-center text-xs text-slate-400">
                  Type to search · ↑ ↓ to navigate · ↵ to open
                </p>
              ) : results.length === 0 ? (
                <p className="px-5 py-10 text-center text-xs text-slate-400">
                  {loading ? 'Searching…' : 'No matches.'}
                </p>
              ) : (
                <ul role="listbox" className="py-1">
                  {results.map((r, i) => (
                    <li key={`${r.type}-${r.href}-${i}`}>
                      <button
                        type="button"
                        onMouseEnter={() => setActive(i)}
                        onClick={() => navigate(r)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition ${
                          active === i ? 'bg-slate-50' : 'bg-white hover:bg-slate-50'
                        }`}
                      >
                        <span className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                          {TYPE_ICON[r.type]}
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="block text-sm font-medium text-slate-800 truncate">{r.title}</span>
                          {r.subtitle && <span className="block text-xs text-slate-400 truncate">{r.subtitle}</span>}
                        </span>
                        <span className="text-[10px] uppercase tracking-wider text-slate-300 shrink-0">{TYPE_LABEL[r.type]}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <style>{`
            @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
            @keyframes searchIn {
              from { opacity: 0; transform: translateY(-12px) scale(0.98) }
              to   { opacity: 1; transform: translateY(0) scale(1) }
            }
          `}</style>
        </div>
      )}
    </>
  )
}
