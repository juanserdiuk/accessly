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

const SCAN_STEPS = [
  { msg: 'Connecting to URL...',             pct: 6  },
  { msg: 'Loading page resources...',        pct: 15 },
  { msg: 'Analyzing DOM structure...',       pct: 27 },
  { msg: 'Running WCAG 2.2 checks...',      pct: 43 },
  { msg: 'Checking color contrast...',      pct: 56 },
  { msg: 'Validating ARIA labels...',       pct: 69 },
  { msg: 'Checking keyboard navigation...', pct: 81 },
  { msg: 'Generating accessibility report...', pct: 91 },
] as const

// ms to stay on each step before advancing (undefined = hold until API returns)
const STEP_DURATIONS: (number | undefined)[] = [900, 1600, 2100, 3100, 2600, 2600, 2000, undefined]

export default function Scanner({ unlimited = false }: { unlimited?: boolean }) {
  const [url, setUrl]               = useState('')
  const [scanning, setScanning]     = useState(false)
  const [progress, setProgress]     = useState(0)
  const [currentStep, setCurrentStep] = useState(0)
  const [errorMsg, setErrorMsg]     = useState('')
  const [done, setDone]             = useState(false)
  const [results, setResults]       = useState<ScanResults | null>(null)
  const [scanCount, setScanCount]     = useState(0)
  const [displayScore, setDisplayScore] = useState(0)
  const [revealedCards, setRevealedCards] = useState(0)

  const stepTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const stepIndexRef = useRef(0)

  useEffect(() => {
    if (unlimited) return
    const stored = parseInt(localStorage.getItem(STORAGE_KEY) ?? '0', 10)
    setScanCount(stored)
  }, [unlimited])

  useEffect(() => {
    if (!results) {
      setRevealedCards(0)
      setDisplayScore(0)
      return
    }
    // Stagger card reveals: 0ms, 200ms, 400ms, 600ms
    const timers = [0, 200, 400, 600].map((delay, i) =>
      setTimeout(() => setRevealedCards(n => Math.max(n, i + 1)), delay)
    )
    // Count score up from 0 → final over 1500ms with ease-out cubic
    const start = performance.now()
    const target = results.score
    let rafId: number
    function tick(now: number) {
      const t = Math.min((now - start) / 1500, 1)
      setDisplayScore(Math.round((1 - Math.pow(1 - t, 3)) * target))
      if (t < 1) rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)
    return () => {
      timers.forEach(clearTimeout)
      cancelAnimationFrame(rafId)
    }
  }, [results])

  function clearStepTimer() {
    if (stepTimerRef.current) {
      clearTimeout(stepTimerRef.current)
      stepTimerRef.current = null
    }
  }

  function scheduleNextStep() {
    const next = stepIndexRef.current + 1
    if (next >= SCAN_STEPS.length) return
    stepIndexRef.current = next
    setCurrentStep(next)
    setProgress(SCAN_STEPS[next].pct)
    const dur = STEP_DURATIONS[next]
    if (dur !== undefined) {
      stepTimerRef.current = setTimeout(scheduleNextStep, dur)
    }
  }

  function startScanAnimation() {
    clearStepTimer()
    stepIndexRef.current = 0
    setCurrentStep(0)
    setProgress(SCAN_STEPS[0].pct)
    const dur = STEP_DURATIONS[0]
    if (dur !== undefined) stepTimerRef.current = setTimeout(scheduleNextStep, dur)
  }

  async function runScan() {
    if (!url || (!unlimited && scanCount >= SCAN_LIMIT)) return
    const normalized = /^https?:\/\//i.test(url) ? url : 'https://' + url
    if (normalized !== url) setUrl(normalized)

    setDone(false)
    setResults(null)
    setErrorMsg('')
    setScanning(true)
    startScanAnimation()

    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: normalized }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        clearStepTimer()
        setErrorMsg(data.error || `HTTP ${res.status}`)
        setScanning(false)
        setProgress(0)
        return
      }
      if (!unlimited) {
        const newCount = scanCount + 1
        localStorage.setItem(STORAGE_KEY, String(newCount))
        setScanCount(newCount)
      }
      clearStepTimer()
      setProgress(100)
      setResults(data)
      setScanning(false)
      setDone(true)
    } catch {
      clearStepTimer()
      setErrorMsg('Failed to reach the URL. Check that it is public and try again.')
      setScanning(false)
      setProgress(0)
    }
  }

  function hostname(u: string) {
    try { return new URL(u).hostname } catch { return u }
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
          <div className="text-xs text-white/40">Scan any public webpage for WCAG violations</div>
        </div>
        <span className="ml-auto shrink-0 text-xs font-medium bg-emerald-400/20 text-emerald-400 px-2.5 py-1 rounded-full">
          Free
        </span>
      </div>

      {/* Panel body */}
      <div className="p-6 flex-1 flex flex-col gap-4">

        {/* Upgrade wall */}
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
            {/* Input row */}
            <div className="flex gap-3">
              <input
                type="url"
                value={url}
                onChange={e => setUrl(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && runScan()}
                placeholder="https://example.com"
                disabled={scanning}
                className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-sm bg-slate-50
                  focus:outline-none focus:border-emerald-400 transition placeholder:text-slate-300
                  disabled:opacity-60 disabled:cursor-not-allowed"
              />
              <button
                onClick={runScan}
                disabled={scanning || !url.trim()}
                className="bg-slate-900 text-white px-5 py-3 rounded-xl text-sm font-semibold
                  hover:bg-slate-700 transition disabled:opacity-50 shrink-0 flex items-center gap-2"
              >
                {scanning ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Scanning…
                  </>
                ) : 'Scan now'}
              </button>
            </div>

            {!unlimited && !scanning && !done && (
              <p className="text-xs text-slate-400 -mt-2">
                {SCAN_LIMIT - scanCount} free scan{SCAN_LIMIT - scanCount !== 1 ? 's' : ''} remaining
              </p>
            )}

            {/* Error */}
            {errorMsg && !scanning && (
              <div className="flex items-start gap-2.5 text-xs text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500 shrink-0 mt-0.5">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {errorMsg}
              </div>
            )}
          </>
        )}

        {/* ── Scanning animation ────────────────────────────── */}
        {scanning && (
          <div className="space-y-3">

            {/* "Scanning X" header */}
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 px-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              Deep scanning
              <span className="text-slate-800 truncate max-w-[180px]">{hostname(url)}</span>
              <span className="ml-auto font-mono text-emerald-600 tabular-nums">{progress}%</span>
            </div>

            {/* Step list */}
            <div className="rounded-xl border border-slate-100 overflow-hidden divide-y divide-slate-50">
              {SCAN_STEPS.map((step, i) => {
                const isDone    = i < currentStep
                const isActive  = i === currentStep
                const isPending = i > currentStep
                return (
                  <div
                    key={i}
                    className={`flex items-center gap-3 px-4 py-2.5 transition-colors duration-300 ${
                      isActive  ? 'bg-emerald-50/70 border-l-2 border-emerald-400' : 'border-l-2 border-transparent'
                    } ${isDone ? 'bg-white' : isPending ? 'bg-slate-50/50' : ''}`}
                  >
                    {/* State icon */}
                    <div className="shrink-0 w-4 h-4 flex items-center justify-center">
                      {isDone ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      ) : isActive ? (
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                      ) : (
                        <span className="w-2.5 h-2.5 rounded-full border-2 border-slate-200" />
                      )}
                    </div>

                    {/* Step label */}
                    <span className={`text-sm leading-none transition-colors duration-300 ${
                      isDone    ? 'text-slate-300'
                      : isActive  ? 'text-slate-900 font-semibold'
                      : 'text-slate-400'
                    }`}>
                      {step.msg}
                    </span>

                    {/* Active: elapsed indicator dots */}
                    {isActive && (
                      <span className="ml-auto flex gap-1">
                        <span className="w-1 h-1 rounded-full bg-emerald-300 animate-bounce [animation-delay:0ms]"    />
                        <span className="w-1 h-1 rounded-full bg-emerald-300 animate-bounce [animation-delay:150ms]"  />
                        <span className="w-1 h-1 rounded-full bg-emerald-300 animate-bounce [animation-delay:300ms]"  />
                      </span>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Progress bar */}
            <div className="space-y-1.5">
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-300"
                  style={{
                    width: `${progress}%`,
                    transition: 'width 1.6s cubic-bezier(0.25, 1, 0.5, 1)',
                  }}
                />
              </div>
            </div>

          </div>
        )}

        {/* ── Results ───────────────────────────────────────── */}
        {done && results && (
          <div>
            <div className="grid grid-cols-4 gap-3 mb-4">
              {([
                [results.errors,   'Errors',   'text-red-500'],
                [results.warnings, 'Warnings', 'text-amber-500'],
                [results.passes,   'Passed',   'text-green-600'],
                [displayScore,     'Score',    'text-slate-900'],
              ] as const).map(([val, label, color], i) => (
                <div
                  key={label}
                  className={`bg-slate-50 border border-slate-200 rounded-xl p-3 text-center transition-all duration-500 ${
                    revealedCards > i ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                  }`}
                >
                  <div className={`font-serif text-2xl ${color}`}>{val}</div>
                  <div className="text-xs text-slate-400 uppercase tracking-wide mt-1">{label}</div>
                </div>
              ))}
            </div>

            <div className="space-y-2.5">
              {results.violations.slice(0, 5).map(v => (
                <div key={v.id} className="flex items-start gap-3 p-3 border border-slate-200 rounded-xl text-sm">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full mt-0.5 shrink-0 capitalize ${
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
