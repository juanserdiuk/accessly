'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

const SCAN_LIMIT = 3
const STORAGE_KEY = 'accessly_scan_count'

// Percentages only — messages come from translations
const SCAN_PCTS = [6, 15, 27, 43, 56, 69, 81, 91] as const
const STEP_DURATIONS: (number | undefined)[] = [900, 1600, 2100, 3100, 2600, 2600, 2000, undefined]

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
  const t = useTranslations('scanner')

  const STEP_MSGS = [
    t('step1'), t('step2'), t('step3'), t('step4'),
    t('step5'), t('step6'), t('step7'), t('step8'),
  ]

  const [url, setUrl]                   = useState('')
  const [scanning, setScanning]         = useState(false)
  const [progress, setProgress]         = useState(0)
  const [currentStep, setCurrentStep]   = useState(0)
  const [errorMsg, setErrorMsg]         = useState('')
  const [done, setDone]                 = useState(false)
  const [results, setResults]           = useState<ScanResults | null>(null)
  const [scanCount, setScanCount]       = useState(0)
  const [displayScore, setDisplayScore] = useState(0)
  const [revealedCards, setRevealedCards] = useState(0)
  const [scannedUrl, setScannedUrl]     = useState('')
  const [shared, setShared]             = useState(false)
  const [sendEmail, setSendEmail]       = useState('')
  const [emailSent, setEmailSent]       = useState(false)
  const [emailSending, setEmailSending] = useState(false)

  const stepTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const stepIndexRef = useRef(0)

  useEffect(() => {
    if (unlimited) return
    const stored = parseInt(localStorage.getItem(STORAGE_KEY) ?? '0', 10)
    setScanCount(stored)
  }, [unlimited])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const p = params.get('url')
    if (p) setUrl(p)
  }, [])

  useEffect(() => {
    if (!results) {
      setRevealedCards(0)
      setDisplayScore(0)
      return
    }
    const timers = [0, 200, 400, 600].map((delay, i) =>
      setTimeout(() => setRevealedCards(n => Math.max(n, i + 1)), delay)
    )
    const start = performance.now()
    const target = results.score
    let rafId: number
    function tick(now: number) {
      const elapsed = Math.min((now - start) / 1500, 1)
      setDisplayScore(Math.round((1 - Math.pow(1 - elapsed, 3)) * target))
      if (elapsed < 1) rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)
    return () => { timers.forEach(clearTimeout); cancelAnimationFrame(rafId) }
  }, [results])

  function clearStepTimer() {
    if (stepTimerRef.current) { clearTimeout(stepTimerRef.current); stepTimerRef.current = null }
  }

  function scheduleNextStep() {
    const next = stepIndexRef.current + 1
    if (next >= SCAN_PCTS.length) return
    stepIndexRef.current = next
    setCurrentStep(next)
    setProgress(SCAN_PCTS[next])
    const dur = STEP_DURATIONS[next]
    if (dur !== undefined) stepTimerRef.current = setTimeout(scheduleNextStep, dur)
  }

  function startScanAnimation() {
    clearStepTimer()
    stepIndexRef.current = 0
    setCurrentStep(0)
    setProgress(SCAN_PCTS[0])
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
    setEmailSent(false)
    setSendEmail('')
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
      setScannedUrl(normalized)
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

  async function shareResults() {
    const shareUrl = `${window.location.origin}/?url=${encodeURIComponent(scannedUrl)}`
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Accessibility scan: ${hostname(scannedUrl)}`,
          text: `WCAG accessibility results for ${scannedUrl}`,
          url: shareUrl,
        })
      } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(shareUrl)
      setShared(true)
      setTimeout(() => setShared(false), 2000)
    }
  }

  async function sendScanLink() {
    if (!sendEmail) return
    setEmailSending(true)
    try {
      await fetch('/api/send-scan-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: sendEmail, url: scannedUrl }),
      })
      setEmailSent(true)
    } catch { /* best-effort */ }
    setEmailSending(false)
  }

  function hostname(u: string) {
    try { return new URL(u).hostname } catch { return u }
  }

  function nodeCount(v: Violation): number {
    return Array.isArray(v.nodes) ? v.nodes.length : v.nodes
  }

  const Spinner = ({ className = '' }: { className?: string }) => (
    <span className={`inline-block rounded-full border-2 border-t-transparent animate-spin ${className}`} />
  )

  return (
    <>
      {/* Mobile full-screen scan overlay */}
      {scanning && (
        <div role="dialog" aria-modal="true" aria-labelledby="scan-progress-title" className="fixed inset-0 z-50 bg-white flex flex-col sm:hidden">
          <div className="bg-slate-900 px-5 py-4 flex items-center gap-3 shrink-0">
            <div aria-hidden="true" className="w-8 h-8 bg-emerald-400/15 rounded-lg flex items-center justify-center text-emerald-400">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
            </div>
            <div>
              <div id="scan-progress-title" className="text-sm font-semibold text-white">{t('scanning')}</div>
              <div className="text-xs text-white/40 truncate max-w-[220px]">{hostname(url)}</div>
            </div>
            <span aria-hidden="true" className="ml-auto font-mono text-emerald-400 text-sm tabular-nums">{progress}%</span>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center px-8 gap-8">
            <div aria-hidden="true" className="relative w-24 h-24">
              <div className="absolute inset-0 rounded-full border-4 border-slate-100" />
              <div className="absolute inset-0 rounded-full border-4 border-emerald-400 border-t-transparent animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-mono text-lg font-bold text-slate-900 tabular-nums">{progress}%</span>
              </div>
            </div>

            <div className="text-center">
              <p className="text-lg font-semibold text-slate-900" aria-live="polite">{STEP_MSGS[currentStep]}</p>
              <p className="text-sm text-slate-400 mt-1">{t('stepOf', { current: currentStep + 1, total: SCAN_PCTS.length })}</p>
            </div>

            <div className="w-full">
              <div
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={progress}
                aria-label={`Scan progress: ${progress}%`}
                className="h-2 bg-slate-100 rounded-full overflow-hidden"
              >
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-300"
                  style={{ width: `${progress}%`, transition: 'width 1.6s cubic-bezier(0.25, 1, 0.5, 1)' }}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2 justify-center">
              {SCAN_PCTS.map((_, i) => (
                <span key={i} className={`text-xs px-3 py-1.5 rounded-full transition-all ${
                  i < currentStep  ? 'bg-emerald-100 text-emerald-700' :
                  i === currentStep ? 'bg-emerald-400 text-slate-900 font-semibold' :
                  'bg-slate-100 text-slate-400'
                }`}>
                  {STEP_MSGS[i].replace('...', '')}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main scanner card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden flex flex-col">

        {/* Header */}
        <div className="bg-slate-900 px-5 py-4 flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-400/15 rounded-lg flex items-center justify-center text-emerald-400 shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            </svg>
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-white">{t('title')}</div>
            <div className="text-xs text-white/40">{t('sub')}</div>
          </div>
          <span className="ml-auto shrink-0 text-xs font-medium bg-emerald-400/20 text-emerald-400 px-2.5 py-1 rounded-full">{t('free')}</span>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 flex-1 flex flex-col gap-4">

          {/* Upgrade wall */}
          {!unlimited && scanCount >= SCAN_LIMIT ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-10">
              <div className="w-12 h-12 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center mb-4">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              </div>
              <p className="text-slate-700 font-medium mb-1">{t('limitTitle')}</p>
              <p className="text-sm text-slate-400 mb-5">{t('limitSub')}</p>
              <Link href="/signup" className="bg-emerald-400 text-slate-900 font-semibold px-5 py-2.5 rounded-xl hover:bg-emerald-300 transition text-sm">
                {t('limitCta')}
              </Link>
            </div>
          ) : (
            <>
              {/* Input */}
              <label htmlFor="scanner-url-input" className="sr-only">{t('placeholder')}</label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  id="scanner-url-input"
                  type="url"
                  inputMode="url"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && runScan()}
                  placeholder={t('placeholder')}
                  disabled={scanning}
                  aria-describedby={errorMsg ? 'scanner-error' : undefined}
                  aria-invalid={errorMsg ? true : undefined}
                  autoComplete="url"
                  className="flex-1 px-4 py-4 sm:py-3 border border-slate-200 rounded-xl text-base sm:text-sm bg-slate-50
                    focus:outline-none focus:border-emerald-400 focus-visible:ring-2 focus-visible:ring-emerald-400 transition placeholder:text-slate-300
                    disabled:opacity-60 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={runScan}
                  disabled={scanning || !url.trim()}
                  className="w-full sm:w-auto bg-slate-900 text-white px-5 py-4 sm:py-3 rounded-xl text-sm font-semibold
                    hover:bg-slate-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {scanning ? (
                    <><span aria-hidden="true" className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />{t('scanning')}</>
                  ) : t('scanNow')}
                </button>
              </div>

              {!unlimited && !scanning && !done && (
                <p className="text-xs text-slate-400 -mt-2">
                  {t('scansRemaining', { count: SCAN_LIMIT - scanCount })}
                </p>
              )}

              {/* Error */}
              {errorMsg && !scanning && (
                <div id="scanner-error" role="alert" className="flex items-start gap-2.5 text-xs text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                  <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500 shrink-0 mt-0.5">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {errorMsg}
                </div>
              )}
            </>
          )}

          {/* Desktop scanning animation */}
          {scanning && (
            <div className="hidden sm:block space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 px-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                {t('deepScanning')}
                <span className="text-slate-800 truncate max-w-[180px]">{hostname(url)}</span>
                <span className="ml-auto font-mono text-emerald-600 tabular-nums">{progress}%</span>
              </div>

              <div className="rounded-xl border border-slate-100 overflow-hidden divide-y divide-slate-50">
                {SCAN_PCTS.map((_, i) => {
                  const isDone    = i < currentStep
                  const isActive  = i === currentStep
                  const isPending = i > currentStep
                  return (
                    <div
                      key={i}
                      className={`flex items-center gap-3 px-4 py-2.5 transition-colors duration-300 ${
                        isActive ? 'bg-emerald-50/70 border-l-2 border-emerald-400' : 'border-l-2 border-transparent'
                      } ${isDone ? 'bg-white' : isPending ? 'bg-slate-50/50' : ''}`}
                    >
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
                      <span className={`text-sm leading-none transition-colors duration-300 ${
                        isDone ? 'text-slate-300' : isActive ? 'text-slate-900 font-semibold' : 'text-slate-400'
                      }`}>
                        {STEP_MSGS[i]}
                      </span>
                      {isActive && (
                        <span className="ml-auto flex gap-1">
                          <span className="w-1 h-1 rounded-full bg-emerald-300 animate-bounce [animation-delay:0ms]" />
                          <span className="w-1 h-1 rounded-full bg-emerald-300 animate-bounce [animation-delay:150ms]" />
                          <span className="w-1 h-1 rounded-full bg-emerald-300 animate-bounce [animation-delay:300ms]" />
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>

              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-300"
                  style={{ width: `${progress}%`, transition: 'width 1.6s cubic-bezier(0.25, 1, 0.5, 1)' }}
                />
              </div>
            </div>
          )}

          {/* Results */}
          {done && results && (
            <div>
              {/* Metric cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                {([
                  [results.errors,   t('errors'),   'text-red-500'],
                  [results.warnings, t('warnings'), 'text-amber-500'],
                  [results.passes,   t('passed'),   'text-green-600'],
                  [displayScore,     t('score'),    'text-slate-900'],
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

              {/* Share button */}
              <button
                onClick={shareResults}
                className="w-full sm:w-auto mb-4 flex items-center justify-center gap-2 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition"
              >
                {shared ? (
                  <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500"><polyline points="20 6 9 17 4 12"/></svg>{t('linkCopied')}</>
                ) : (
                  <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>{t('shareResults')}</>
                )}
              </button>

              {/* Violations list */}
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
                        {t('elementsAffected', { count: nodeCount(v) })}
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
                  {t('showingOf', { total: results.violations.length })}{' '}
                  <a href="#pricing" className="text-emerald-600 font-semibold">{t('upgrade')}</a>{' '}
                  {t('fullReport')}
                </p>
              )}

              {/* Save for desktop banner (mobile only) */}
              <div className="mt-5 sm:hidden">
                {emailSent ? (
                  <div className="bg-emerald-50 border border-emerald-100 rounded-2xl px-5 py-4 flex items-center gap-3">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500 shrink-0">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    <p className="text-sm text-emerald-700 font-medium">{t('emailSent')}</p>
                  </div>
                ) : (
                  <div className="bg-slate-900 rounded-2xl p-5">
                    <p className="text-white font-semibold text-sm mb-1">{t('desktopTitle')}</p>
                    <p className="text-white/50 text-xs mb-4 leading-relaxed">{t('desktopSub')}</p>
                    <div className="flex gap-2">
                      <input
                        type="email"
                        inputMode="email"
                        value={sendEmail}
                        onChange={e => setSendEmail(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && sendScanLink()}
                        placeholder={t('emailPlaceholder')}
                        className="flex-1 px-3 py-3 bg-white/10 border border-white/15 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-400/60 transition"
                      />
                      <button
                        onClick={sendScanLink}
                        disabled={emailSending || !sendEmail}
                        className="bg-emerald-400 text-slate-900 font-semibold text-sm px-4 py-3 rounded-xl disabled:opacity-60 flex items-center gap-1.5 shrink-0"
                      >
                        {emailSending ? <Spinner className="w-4 h-4 border-slate-900/30 border-t-slate-900" /> : t('send')}
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

        </div>
      </div>
    </>
  )
}
