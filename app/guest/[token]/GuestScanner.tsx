'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import ViolationAccordion, { ViolationItem } from '@/components/dashboard/ViolationAccordion'

type ScanResult = {
  score: number
  errors: number
  warnings: number
  passes: number
  violations: ViolationItem[]
}

const impactOrder: Record<string, number> = { critical: 0, serious: 1, moderate: 2, minor: 3 }
const CIRC = 2 * Math.PI * 54

function gaugeColor(score: number) {
  if (score >= 80) return '#22c55e'
  if (score >= 60) return '#f59e0b'
  return '#ef4444'
}

function scoreGrade(score: number, t: (k: string) => string): { label: string; color: string } {
  if (score >= 90) return { label: t('gradeExcellent'), color: 'text-green-600' }
  if (score >= 80) return { label: t('gradeGood'), color: 'text-green-600' }
  if (score >= 60) return { label: t('gradeNeedsWork'), color: 'text-amber-500' }
  return { label: t('gradePoor'), color: 'text-red-500' }
}

function hostname(url: string) {
  try { return new URL(url).hostname } catch { return url }
}

export default function GuestScanner() {
  const t = useTranslations('guest.scanner')
  const LOADING_STEPS = [t('loading1'), t('loading2'), t('loading3'), t('loading4')]
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ScanResult | null>(null)
  const [scannedUrl, setScannedUrl] = useState('')
  const [animatedScore, setAnimatedScore] = useState(0)
  const [copied, setCopied] = useState(false)
  const resultsRef = useRef<HTMLDivElement>(null)

  const doScan = useCallback(async (target: string) => {
    setLoading(true)
    setError(null)
    setResult(null)
    setAnimatedScore(0)
    setScannedUrl(target)
    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: target }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || t('scanFailed'))
      setResult(data)
    } catch (err: any) {
      setError(err.message || t('genericError'))
    } finally {
      setLoading(false)
    }
  }, [t])

  // Auto-run from ?url= query param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const preUrl = params.get('url')
    if (preUrl) {
      setUrl(preUrl)
      doScan(preUrl)
    }
  }, [doScan])

  // Animate score gauge after results arrive
  useEffect(() => {
    if (!result) return
    const t = setTimeout(() => setAnimatedScore(result.score), 80)
    return () => clearTimeout(t)
  }, [result])

  // Cycle loading step messages
  useEffect(() => {
    if (!loading) { setLoadingStep(0); return }
    const id = setInterval(() => setLoadingStep(s => Math.min(s + 1, LOADING_STEPS.length - 1)), 2800)
    return () => clearInterval(id)
  }, [loading])

  // Smooth-scroll to results
  useEffect(() => {
    if (result && resultsRef.current) {
      const t = setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120)
      return () => clearTimeout(t)
    }
  }, [result])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = url.trim()
    if (trimmed) doScan(trimmed)
  }

  function handleReset() {
    setResult(null)
    setError(null)
    setUrl('')
    setScannedUrl('')
    setAnimatedScore(0)
  }

  function shareReport() {
    const shareUrl = `${window.location.origin}${window.location.pathname}?url=${encodeURIComponent(scannedUrl)}`
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const violations = result
    ? [...result.violations].sort((a, b) => (impactOrder[a.impact] ?? 9) - (impactOrder[b.impact] ?? 9))
    : []

  const dashOffset = CIRC * (1 - animatedScore / 100)
  const grade = result ? scoreGrade(result.score, t) : null

  const impactGroups = [
    { key: 'critical', label: t('impactCritical'), numColor: 'text-red-600',    dimColor: 'text-red-300',    bg: 'bg-red-50',    ring: 'ring-red-100'    },
    { key: 'serious',  label: t('impactSerious'),  numColor: 'text-orange-600', dimColor: 'text-orange-300', bg: 'bg-orange-50', ring: 'ring-orange-100' },
    { key: 'moderate', label: t('impactModerate'), numColor: 'text-amber-600',  dimColor: 'text-amber-300',  bg: 'bg-amber-50',  ring: 'ring-amber-100'  },
    { key: 'minor',    label: t('impactMinor'),    numColor: 'text-slate-500',  dimColor: 'text-slate-300',  bg: 'bg-slate-50',  ring: 'ring-slate-100'  },
  ]

  return (
    <div className="space-y-4">

      {/* ── Input card ─────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="bg-slate-900 px-6 py-5">
          <div className="flex items-center gap-2 mb-1">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <h2 className="text-sm font-semibold text-white">{t('title')}</h2>
            <span className="ml-auto text-xs text-emerald-400/70 font-medium">{t('noLimits')}</span>
          </div>
          <p className="text-xs text-white/40 mt-0.5">{t('subtitle')}</p>
        </div>

        <div className="px-6 py-5">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <input
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder={t('placeholder')}
              required
              disabled={loading}
              className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent disabled:opacity-50 transition"
            />
            <button
              type="submit"
              disabled={loading || !url.trim()}
              className="bg-emerald-400 text-slate-900 font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-emerald-300 active:scale-95 transition-all disabled:opacity-40 whitespace-nowrap flex items-center gap-2 shadow-sm shadow-emerald-200"
            >
              {loading ? (
                <>
                  <div className="animate-spin" style={{ animationDuration: '1s' }}>
                    <svg width="14" height="14" viewBox="0 0 144 144">
                      <circle cx="72" cy="72" r="54" fill="none" stroke="rgba(15,23,42,0.2)" strokeWidth="14"/>
                      <circle cx="72" cy="72" r="54" fill="none" stroke="rgb(15,23,42)" strokeWidth="14"
                        strokeLinecap="round" strokeDasharray={`${CIRC * 0.3} ${CIRC * 0.7}`}/>
                    </svg>
                  </div>
                  {t('scanning')}
                </>
              ) : (
                <>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                  {t('scanNow')}
                </>
              )}
            </button>
          </form>

          {error && (
            <div className="mt-3 flex items-start gap-2.5 text-xs text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500 shrink-0 mt-0.5">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}
        </div>
      </div>

      {/* ── Loading ─────────────────────────────────────────── */}
      {loading && (
        <div className="bg-white border border-slate-200 rounded-2xl px-6 py-14 flex flex-col items-center text-center gap-6 shadow-sm">
          <div className="relative">
            <div className="animate-spin" style={{ animationDuration: '1.5s' }}>
              <svg width="88" height="88" viewBox="0 0 144 144">
                <circle cx="72" cy="72" r="54" fill="none" stroke="#f1f5f9" strokeWidth="12"/>
                <circle cx="72" cy="72" r="54" fill="none" stroke="#34d399" strokeWidth="12"
                  strokeLinecap="round" strokeDasharray={`${CIRC * 0.28} ${CIRC * 0.72}`}/>
              </svg>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-9 h-9 bg-emerald-400 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
                <span className="text-slate-900 text-xs font-bold">A</span>
              </div>
            </div>
          </div>

          <div>
            <p className="font-semibold text-slate-800 text-base mb-1">{LOADING_STEPS[loadingStep]}</p>
            <p className="text-xs text-slate-400">{t('analyzing')} <span className="font-medium text-slate-600">{hostname(scannedUrl)}</span></p>
          </div>

          <div className="flex gap-1.5">
            {LOADING_STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-700 ${
                  i <= loadingStep ? 'w-8 bg-emerald-400' : 'w-1.5 bg-slate-200'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Results ─────────────────────────────────────────── */}
      {result && !loading && (
        <div ref={resultsRef} className="space-y-4 scroll-mt-20">

          {/* Scanned URL bar */}
          <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-2xl px-5 py-3.5 shadow-sm">
            <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center shrink-0">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600">
                <circle cx="12" cy="12" r="10"/>
                <line x1="2" y1="12" x2="22" y2="12"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 leading-none mb-0.5">{t('scannedLabel')}</p>
              <a
                href={scannedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-slate-700 hover:text-emerald-600 truncate block transition"
              >
                {scannedUrl}
              </a>
            </div>
            <button
              onClick={handleReset}
              className="shrink-0 text-xs font-semibold text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition"
            >
              {t('newScan')}
            </button>
          </div>

          {/* Score hero */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-8 pt-8 pb-6 flex flex-col items-center text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-7">
                {t('scoreLabel')}
              </p>

              {/* Animated gauge */}
              <div className="relative w-48 h-48 mb-5">
                {/* Subtle glow ring */}
                <div
                  className="absolute inset-2 rounded-full opacity-20 blur-xl transition-all duration-1000"
                  style={{ background: gaugeColor(result.score) }}
                />
                <svg
                  className="-rotate-90"
                  width="192"
                  height="192"
                  viewBox="-12 -12 168 168"
                  style={{ overflow: 'visible' }}
                >
                  {/* Track */}
                  <circle cx="72" cy="72" r="54" fill="none" stroke="#f1f5f9" strokeWidth="14"/>
                  {/* Animated fill */}
                  <circle
                    cx="72" cy="72" r="54"
                    fill="none"
                    stroke={gaugeColor(result.score)}
                    strokeWidth="14"
                    strokeLinecap="round"
                    strokeDasharray={CIRC}
                    strokeDashoffset={dashOffset}
                    style={{ transition: 'stroke-dashoffset 1.3s cubic-bezier(0.22, 1, 0.36, 1)' }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                  <span className={`font-serif text-5xl leading-none ${grade!.color}`}>
                    {result.score}
                  </span>
                  <span className="text-sm text-slate-400 font-medium">/100</span>
                </div>
              </div>

              <p className={`font-serif text-2xl mb-2 ${grade!.color}`}>{grade!.label}</p>
              <p className="text-sm text-slate-400">
                <span className="font-semibold text-red-500">{result.errors}</span> {t('summaryErrors', { count: result.errors }).replace(/^\d+\s*/, '')}
                <span className="mx-2 text-slate-200">·</span>
                <span className="font-semibold text-amber-500">{result.warnings}</span> {t('summaryWarnings', { count: result.warnings }).replace(/^\d+\s*/, '')}
                <span className="mx-2 text-slate-200">·</span>
                <span className="font-semibold text-green-600">{result.passes}</span> {t('summaryPasses', { count: result.passes }).replace(/^\d+\s*/, '')}
              </p>
            </div>

            {/* Impact breakdown strip */}
            {violations.length > 0 && (
              <div className="border-t border-slate-100 grid grid-cols-4 divide-x divide-slate-100">
                {impactGroups.map(({ key, label, numColor, dimColor, bg }) => {
                  const count = violations.filter(v => v.impact === key).length
                  return (
                    <div key={key} className={`${bg} px-4 py-4 text-center`}>
                      <p className={`font-serif text-3xl leading-none mb-1 ${count > 0 ? numColor : dimColor}`}>
                        {count}
                      </p>
                      <p className="text-xs text-slate-400 font-medium">{label}</p>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Violations section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  {t('violations')}
                  {violations.length > 0 && (
                    <span className="text-xs font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full tabular-nums">
                      {violations.length}
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {violations.length === 0
                    ? t('noViolationsHint')
                    : t('violationsHint')}
                </p>
              </div>

              {/* Share report button */}
              <button
                onClick={shareReport}
                className={`flex items-center gap-2 text-xs font-semibold px-3.5 py-2 rounded-xl transition ${
                  copied
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-transparent'
                }`}
              >
                {copied ? (
                  <>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    {t('copied')}
                  </>
                ) : (
                  <>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                    </svg>
                    {t('shareReport')}
                  </>
                )}
              </button>
            </div>

            {violations.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl flex flex-col items-center py-16 text-center shadow-sm">
                <div className="w-14 h-14 bg-green-50 border border-green-100 rounded-2xl flex items-center justify-center mb-4">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <p className="font-semibold text-slate-800 mb-1">{t('noViolationsFound')}</p>
                <p className="text-sm text-slate-400">{t('noViolationsSub')}</p>
              </div>
            ) : (
              <ViolationAccordion violations={violations} />
            )}
          </div>

          {/* ── CTA card ──────────────────────────────────────── */}
          <div className="relative overflow-hidden bg-slate-900 rounded-2xl p-8 shadow-xl shadow-slate-900/20">
            {/* Decorative glows */}
            <div className="pointer-events-none absolute -top-16 -right-16 w-56 h-56 bg-emerald-400/15 rounded-full blur-3xl" />
            <div className="pointer-events-none absolute -bottom-12 -left-12 w-44 h-44 bg-violet-500/10 rounded-full blur-3xl" />

            <div className="relative flex flex-col items-center text-center gap-5">
              {/* Badge */}
              <div className="inline-flex items-center gap-1.5 bg-emerald-400/10 border border-emerald-400/25 text-emerald-400 text-xs font-semibold px-3.5 py-1.5 rounded-full">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
                {t('ctaBadge')}
              </div>

              <div>
                <h3 className="font-serif text-2xl text-white mb-2 leading-snug">
                  {t('ctaHeadline')}
                </h3>
                <p className="text-sm text-white/50 max-w-sm mx-auto leading-relaxed">
                  {t('ctaSub')}
                </p>
              </div>

              {/* Feature grid */}
              <div className="grid grid-cols-2 gap-x-8 gap-y-2.5 text-left w-full max-w-sm">
                {[
                  t('ctaFeature1'),
                  t('ctaFeature2'),
                  t('ctaFeature3'),
                  t('ctaFeature4'),
                  t('ctaFeature5'),
                  t('ctaFeature6'),
                ].map(f => (
                  <div key={f} className="flex items-center gap-2">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400 shrink-0">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    <span className="text-xs text-white/65" dangerouslySetInnerHTML={{ __html: f }} />
                  </div>
                ))}
              </div>

              <div className="flex flex-col items-center gap-3 mt-1">
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 bg-emerald-400 text-slate-900 font-bold px-8 py-3.5 rounded-xl hover:bg-emerald-300 active:scale-95 transition-all text-sm shadow-lg shadow-emerald-400/30"
                >
                  {t('ctaSubmit')}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                  </svg>
                </Link>
                <p className="text-xs text-white/25">{t('ctaTrust')}</p>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ── Empty state ─────────────────────────────────────── */}
      {!result && !loading && (
        <div className="bg-white border border-slate-200 rounded-2xl px-6 py-16 flex flex-col items-center text-center shadow-sm">
          <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </div>
          <p className="font-semibold text-slate-700 mb-1">{t('emptyTitle')}</p>
          <p className="text-sm text-slate-400 max-w-xs mb-5 leading-relaxed">
            {t('emptySub')}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {[t('tagNoAccount'), t('tagFullDetails'), t('tagFixInstructions'), t('tagWcag')].map(tag => (
              <span key={tag} className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-100 px-3 py-1 rounded-full font-medium">
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
