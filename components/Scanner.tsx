'use client'
import { useState } from 'react'

const DEMO_ISSUES = [
  { level: 'error', title: 'Images missing alt text', desc: '6 <img> elements have no alt attribute.', wcag: 'WCAG 1.1.1' },
  { level: 'error', title: 'Insufficient color contrast', desc: 'Text has 2.8:1 ratio — below the 4.5:1 minimum.', wcag: 'WCAG 1.4.3' },
  { level: 'error', title: 'Form inputs without labels', desc: '3 inputs are not associated with a label.', wcag: 'WCAG 1.3.1' },
  { level: 'warning', title: 'Missing skip navigation link', desc: 'No skip link found for keyboard users.', wcag: 'WCAG 2.4.1' },
  { level: 'warning', title: 'Duplicate link text', desc: '4 "Read more" links are not descriptive.', wcag: 'WCAG 2.4.6' },
]

export default function Scanner() {
  const [url, setUrl] = useState('')
  const [scanning, setScanning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [step, setStep] = useState('')
  const [done, setDone] = useState(false)

  const steps = ['Connecting to URL…','Loading DOM…','Running WCAG checks…','Analyzing contrast…','Generating report…']

  async function runScan() {
    setDone(false)
    setScanning(true)
    for (let i = 0; i < steps.length; i++) {
      setStep(steps[i])
      setProgress(Math.round(((i + 1) / steps.length) * 100))
      await new Promise(r => setTimeout(r, 400))
    }
    setScanning(false)
    setDone(true)
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
                <div className="h-full bg-emerald-400 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          {done && (
            <div>
              <div className="grid grid-cols-4 gap-3 mb-4">
                {[['7','Errors','text-red-500'],['4','Warnings','text-amber-500'],['31','Passed','text-green-600'],['74','Score','text-slate-900']].map(([val, label, color]) => (
                  <div key={label} className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                    <div className={`font-serif text-2xl ${color}`}>{val}</div>
                    <div className="text-xs text-slate-400 uppercase tracking-wide mt-1">{label}</div>
                  </div>
                ))}
              </div>
              <div className="space-y-2.5">
                {DEMO_ISSUES.map((issue) => (
                  <div key={issue.title} className="flex items-start gap-3 p-3 border border-slate-200 rounded-xl text-sm">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full mt-0.5 shrink-0 ${issue.level === 'error' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                      {issue.level === 'error' ? 'Error' : 'Warning'}
                    </span>
                    <div className="flex-1">
                      <div className="font-medium text-slate-800">{issue.title}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{issue.desc}</div>
                    </div>
                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md shrink-0">{issue.wcag}</span>
                  </div>
                ))}
              </div>
              <p className="text-center text-xs text-slate-400 mt-4">
                Free scan shows top 5 issues.{' '}
                <a href="#pricing" className="text-emerald-600 font-semibold">Upgrade</a>{' '}
                for full reports &amp; monitoring.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}