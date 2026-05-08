'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

const SCAN_LIMIT = 3
const STORAGE_KEY = 'accessly_scan_count'

interface Violation {
  id: string
  impact: string
  help: string
  description: string
  helpUrl: string
  wcag: string
  nodes: { html: string; target: string | null; failureSummary: string | null; impact: string | null }[] | number
}

interface ScanResults {
  violations: Violation[]
  passes: number
  errors: number
  warnings: number
  score: number
}

export default function Scanner({ unlimited = false }: { unlimited?: boolean }) {
  const [url, setUrl] = useState('')
  const [scanning, setScanning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [step, setStep] = useState('')
  const [done, setDone] = useState(false)
  const [results, setResults] = useState<ScanResults | null>(null)
  const [scanCount, setScanCount] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (unlimited) return
    const stored = parseInt(localStorage.getItem(STORAGE_KEY) ?? '0', 10)
    setScanCount(stored)
  }, [unlimited])

  function startProgressTimer() {
    setProgress(0)
    intervalRef.current = setInterval(() => {
      setProgress(p => (p < 95 ? Math.min(p + 3, 95) : p))
    }, 500)
  }

  function stopProgressTimer() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  async function runScan() {
    if (!url || (!unlimited && scanCount >= SCAN_LIMIT)) return
    const normalized = /^https?:\/\//i.test(url) ? url : 'https://' + url
    if (normalized !== url) setUrl(normalized)
    setDone(false)
    setResults(null)
    setScanning(true)
    setStep('Scanning…')
    startProgressTimer()

    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: normalized }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        stopProgressTimer()
        setStep('Error: ' + (data.error || `HTTP ${res.status}`))
        setScanning(false)
        return
      }
      if (!unlimited) {
        const newCount = scanCount + 1
        localStorage.setItem(STORAGE_KEY, String(newCount))
        setScanCount(newCount)
      }
      stopProgressTimer()
      setProgress(100)
      setResults(data)
      setScanning(false)
      setDone(true)
    } catch {
      stopProgressTimer()
      setStep('Failed to reach the URL.')
      setScanning(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden flex flex-col">
      {/* Panel header */}
      <div className="bg-slate-900 px-5 py-4 flex items-center gap-3">
        <div className="w-8 h-8 bg-emerald-400/15 rounded-lg flex items-center justify-center text-emerald-400 shrink-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
          </svg>
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-white">URL Scanner</div>
          <div className="text-xs text-white/40">Scan any public webpage</div>
        </div>
        <span className="ml-auto shrink-0 text-xs font-medium bg-emerald-400/20 text-emerald-400 px-2.5 py-1 rounded-full">
          Free
        </span>
      </div>

      {/* Panel body */}
      <div className="p-6 flex-1 flex flex-col">
        {!unlimited && scanCount >= SCAN_LIMIT ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-10">
            <div className="w-12 h-12 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center mb-4">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <p className="text-slate-700 font-medium mb-1">You&apos;ve used your 3 free scans</p>
            <p className="text-sm text-slate-400 mb-5">Sign up for unlimited scans.</p>
            <Link href="/signup" className="bg-emerald-400 text-slate-900 font-semibold px-5 py-2.5 rounded-xl hover:bg-emerald-300 transition text-sm">
              Create free account →
            </Link>
          </div>
        ) : (
          <>
            <div className="flex gap-3">
              <input
                type="url"
                value={url}
                onChange={e => setUrl(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && runScan()}
                placeholder="https://example.com"
                className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-sm bg-slate-50
                  focus:outline-none focus:border-emerald-400 transition placeholder:text-slate-300"
              />
              <button
                onClick={runScan}
                disabled={scanning}
                className="bg-slate-900 text-white px-5 py-3 rounded-xl text-sm font-semibold
                  hover:bg-slate-700 transition disabled:opacity-60 shrink-0"
              >
                {scanning ? 'Scanning…' : 'Scan now'}
              </button>
            </div>
            {!unlimited && (
              <p className="text-xs text-slate-400 mt-2 mb-4">
                {SCAN_LIMIT - scanCount} free scan{SCAN_LIMIT - scanCount !== 1 ? 's' : ''} remaining
              </p>
            )}
          </>
        )}

        {scanning && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
              <span>{step}</span>
              <span>{progress}%</span>
            </div>
            <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-400 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {done && results && (
          <div>
            <div className="grid grid-cols-4 gap-3 mb-4">
              {([
                [results.errors,   'Errors',   'text-red-500'],
                [results.warnings, 'Warnings', 'text-amber-500'],
                [results.passes,   'Passed',   'text-green-600'],
                [results.score,    'Score',    'text-slate-900'],
              ] as const).map(([val, label, color]) => (
                <div key={label} className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                  <div className={`font-serif text-2xl ${color}`}>{val}</div>
                  <div className="text-xs text-slate-400 uppercase tracking-wide mt-1">{label}</div>
                </div>
              ))}
            </div>

            <div className="space-y-2.5">
              {results.violations.slice(0, 5).map(v => (
                <div key={v.id} className="flex items-start gap-3 p-3 border border-slate-200 rounded-xl text-sm">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full mt-0.5 shrink-0 ${
                    v.impact === 'critical' || v.impact === 'serious'
                      ? 'bg-red-100 text-red-600'
                      : 'bg-amber-100 text-amber-600'
                  }`}>
                    {v.impact}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-800">{v.help}</div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {Array.isArray(v.nodes) ? v.nodes.length : v.nodes} element{(Array.isArray(v.nodes) ? v.nodes.length : v.nodes) !== 1 ? 's' : ''} affected
                    </div>
                  </div>
                  <a href={v.helpUrl} target="_blank" rel="noopener noreferrer"
                    className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md shrink-0 hover:underline">
                    {v.wcag || 'Learn'}
                  </a>
                </div>
              ))}
            </div>

            {results.violations.length > 5 && (
              <p className="text-center text-xs text-slate-400 mt-4">
                Showing 5 of {results.violations.length} issues.{' '}
                <a href="#pricing" className="text-emerald-600 font-semibold">Upgrade</a>{' '}
                for the full report.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
