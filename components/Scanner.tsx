'use client'
import { useState } from 'react'

interface Violation {
  id: string
  impact: string
  help: string
  description: string
  helpUrl: string
  wcag: string
  nodes: number
}

interface ScanResults {
  violations: Violation[]
  passes: number
  errors: number
  warnings: number
  score: number
}

export default function Scanner() {
  const [url, setUrl] = useState('')
  const [scanning, setScanning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [step, setStep] = useState('')
  const [done, setDone] = useState(false)
  const [results, setResults] = useState<ScanResults | null>(null)

  async function runScan() {
    if (!url) return
    setDone(false)
    setResults(null)
    setScanning(true)
    setStep('Connecting to URL…')
    setProgress(20)

    try {
      setStep('Running WCAG checks…')
      setProgress(60)

      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })

      setProgress(90)
      const data = await res.json()

      if (data.error) {
        setStep('Error: ' + data.error)
        setScanning(false)
        return
      }

      setResults(data)
      setProgress(100)
      setScanning(false)
      setDone(true)
    } catch (err) {
      setStep('Failed to reach the URL.')
      setScanning(false)
    }
  }

  return (
    <section id="scanner" className="py-20 px-6 bg-slate-50">
      <div className="max-w-2xl mx-auto text-center mb-12">
        <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600 mb-3">Live demo</p>
        <h2 className="font-serif text-4xl text-slate-900 mb-3">Scan any URL instantly</h2>
        <p className="text-slate-500">Paste any public URL and see real accessibility issues flagged in seconds.</p>
      </div>

      <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
        <div className="bg-slate-900 px-4 py-3 flex items-center gap-3">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500" />
            <span className="w-3 h-3 rounded-full bg-yellow-400" />
            <span className="w-3 h-3 rounded-full bg-green-500" />
          </div>
        </div>

        <div className="p-6">
          <div className="flex gap-3 mb-6">
            <input
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:border-emerald-400"
            />
            <button
              onClick={runScan}
              disabled={scanning}
              className="bg-slate-900 text-white px-5 py-3 rounded-xl text-sm font-semibold hover:bg-slate-700 transition disabled:opacity-60"
            >
              {scanning ? 'Scanning…' : 'Scan now'}
            </button>
          </div>

          {scanning && (
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                <span>{step}</span>
                <span>{progress}%</span>
              </div>
              <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-400 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {done && results && (
            <div>
              <div className="grid grid-cols-4 gap-3 mb-4">
                {[
                  [results.errors, 'Errors', 'text-red-500'],
                  [results.warnings, 'Warnings', 'text-amber-500'],
                  [results.passes, 'Passed', 'text-green-600'],
                  [results.score, 'Score', 'text-slate-900'],
                ].map(([val, label, color]) => (
                  <div key={String(label)} className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                    <div className={`font-serif text-2xl ${color}`}>{val}</div>
                    <div className="text-xs text-slate-400 uppercase tracking-wide mt-1">{String(label)}</div>
                  </div>
                ))}
              </div>

              <div className="space-y-2.5">
                {results.violations.slice(0, 5).map((v) => (
                  <div key={v.id} className="flex items-start gap-3 p-3 border border-slate-200 rounded-xl text-sm">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full mt-0.5 shrink-0 ${
                      v.impact === 'critical' || v.impact === 'serious'
                        ? 'bg-red-100 text-red-600'
                        : 'bg-amber-100 text-amber-600'
                    }`}>
                      {v.impact}
                    </span>
                    <div className="flex-1">
                      <div className="font-medium text-slate-800">{v.help}</div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {v.nodes} element{v.nodes !== 1 ? 's' : ''} affected
                      </div>
                    </div>
                    
                      href={v.helpUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md shrink-0 hover:underline"
                    >
                      {v.wcag || 'Learn more'}
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
    </section>
  )
}