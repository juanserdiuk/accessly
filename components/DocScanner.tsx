'use client'
import { useState, useRef } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

interface DocViolation {
  id: string
  name: string
  passed: boolean
  impact: 'critical' | 'serious' | 'moderate' | 'minor'
  wcag: string
  description: string
}

interface DocResults {
  violations: DocViolation[]
  passes: number
  errors: number
  warnings: number
  score: number
  fileName: string
  fileType: string
}

const ACCEPTED = '.pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document'

export default function DocScanner() {
  const t = useTranslations('docScanner')
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [step, setStep] = useState('')
  const [results, setResults] = useState<DocResults | null>(null)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  function startProgress() {
    setProgress(0)
    intervalRef.current = setInterval(() => {
      setProgress(p => (p < 90 ? Math.min(p + 5, 90) : p))
    }, 400)
  }

  function stopProgress() {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
  }

  function accept(f: File) {
    const ext = f.name.split('.').pop()?.toLowerCase() ?? ''
    if (!['pdf', 'docx'].includes(ext)) {
      setError(t('unsupportedType'))
      return
    }
    if (f.size > 10 * 1024 * 1024) {
      setError(t('tooLarge'))
      return
    }
    setFile(f)
    setError('')
    setResults(null)
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) accept(f)
  }

  async function runScan() {
    if (!file || scanning) return
    setError('')
    setResults(null)
    setScanning(true)
    setStep(t('uploading'))
    startProgress()

    const steps = [t('uploading'), t('parsing'), t('running')]
    let i = 0
    const stepInterval = setInterval(() => {
      i = Math.min(i + 1, steps.length - 1)
      setStep(steps[i])
    }, 1200)

    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/scan-document', { method: 'POST', body: fd })
      const data = await res.json()
      clearInterval(stepInterval)
      stopProgress()

      if (!res.ok || data.error) {
        setError(data.error || `Error ${res.status}`)
        setScanning(false)
        return
      }
      setProgress(100)
      setResults(data)
    } catch {
      clearInterval(stepInterval)
      stopProgress()
      setError(t('uploadFailed'))
    } finally {
      setScanning(false)
    }
  }

  function reset() {
    setFile(null)
    setResults(null)
    setError('')
    setProgress(0)
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden flex flex-col">
      {/* Panel header */}
      <div className="bg-slate-900 px-5 py-4 flex items-center gap-3">
        <div className="w-8 h-8 bg-emerald-400/15 rounded-lg flex items-center justify-center text-emerald-400 shrink-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-white">{t('title')}</div>
          <div className="text-xs text-white/40">{t('sub')}</div>
        </div>
        <span className="ml-auto shrink-0 text-xs font-medium bg-emerald-400/20 text-emerald-400 px-2.5 py-1 rounded-full">
          {t('free')}
        </span>
      </div>

      {/* Panel body */}
      <div className="p-6 flex-1 flex flex-col">
        {!results ? (
          <>
            {/* Drop zone */}
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors mb-4 ${
                dragging ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
              onClick={() => inputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
            >
              <input
                ref={inputRef}
                type="file"
                accept={ACCEPTED}
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) accept(f) }}
              />
              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
              </div>
              <p className="text-sm font-medium text-slate-700 mb-1">
                {dragging ? t('dropToUpload') : t('dropHere')}
              </p>
              <p className="text-xs text-slate-400">{t('fileHint')}</p>
            </div>

            {/* Selected file */}
            {file && (
              <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl mb-4">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500 shrink-0">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-700 truncate">{file.name}</div>
                  <div className="text-xs text-slate-400">{(file.size / 1024).toFixed(0)} KB</div>
                </div>
                <button onClick={e => { e.stopPropagation(); reset() }}
                  className="text-slate-300 hover:text-red-400 transition shrink-0">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            )}

            {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

            <button
              onClick={runScan}
              disabled={!file || scanning}
              className="w-full py-3 bg-slate-900 text-white text-sm font-semibold rounded-xl
                hover:bg-slate-700 transition disabled:opacity-40 mb-3"
            >
              {scanning ? step : t('checkAccessibility')}
            </button>

            {scanning && (
              <div>
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                  <span>{step}</span><span>{progress}%</span>
                </div>
                <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-400 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}

            <p className="text-xs text-slate-400 text-center mt-auto pt-2">
              {t('footerHint')}
            </p>
          </>
        ) : (
          <div>
            {/* File name */}
            <div className="flex items-center gap-2 mb-5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500 shrink-0">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              <span className="text-xs font-medium text-slate-500 truncate">{results.fileName}</span>
              <button onClick={reset} className="ml-auto text-xs text-slate-400 hover:text-slate-600 transition shrink-0">
                {t('newScan')}
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-3 mb-5">
              {([
                [results.errors,   t('errors'),   'text-red-500'],
                [results.warnings, t('warnings'), 'text-amber-500'],
                [results.passes,   t('passed'),   'text-green-600'],
                [results.score,    t('score'),    'text-slate-900'],
              ] as const).map(([val, label, color]) => (
                <div key={label} className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                  <div className={`font-serif text-2xl ${color}`}>{val}</div>
                  <div className="text-xs text-slate-400 uppercase tracking-wide mt-1">{label}</div>
                </div>
              ))}
            </div>

            {/* Violations */}
            {results.violations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <div className="w-10 h-10 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-center mb-3">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <p className="text-sm font-semibold text-slate-800">{t('allPassedTitle')}</p>
                <p className="text-xs text-slate-400 mt-1">{t('allPassedSub')}</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {results.violations.map(v => (
                  <div key={v.id} className="flex items-start gap-3 p-3 border border-slate-200 rounded-xl text-sm">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full mt-0.5 shrink-0 ${
                      v.impact === 'critical' || v.impact === 'serious'
                        ? 'bg-red-100 text-red-600'
                        : 'bg-amber-100 text-amber-600'
                    }`}>
                      {v.impact}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-800">{v.name}</div>
                      <div className="text-xs text-slate-500 mt-0.5 leading-relaxed">{v.description}</div>
                    </div>
                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md shrink-0">
                      {v.wcag}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <p className="text-center text-xs text-slate-400 mt-5">
              {t('fullAuditCta')}{' '}
              <Link href="/signup" className="text-emerald-600 font-semibold">{t('createAccount')}</Link>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
