import type { Metadata } from 'next'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'API & Webhooks — Accessly',
  description: 'Run WCAG 2.2 scans from your CI/CD pipeline, listen for scan-complete events, and embed compliance badges. Public REST API + webhooks.',
}

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://accessly.us').replace(/\/$/, '')

function Code({ children, lang = 'bash' }: { children: React.ReactNode; lang?: string }) {
  return (
    <pre className="bg-slate-900 text-emerald-100 text-xs sm:text-sm font-mono px-4 py-3 sm:px-5 sm:py-4 rounded-xl overflow-x-auto leading-relaxed">
      <code className={`language-${lang}`}>{children}</code>
    </pre>
  )
}

function Endpoint({
  method,
  path,
  auth,
  description,
  children,
}: {
  method: string
  path: string
  auth: 'public' | 'bearer'
  description: string
  children: React.ReactNode
}) {
  const methodColor = method === 'POST' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6">
      <div className="flex items-baseline gap-2.5 mb-3 flex-wrap">
        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md ${methodColor}`}>{method}</span>
        <code className="font-mono text-sm font-semibold text-slate-900">{path}</code>
        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
          auth === 'bearer' ? 'bg-violet-100 text-violet-700' : 'bg-emerald-100 text-emerald-700'
        }`}>
          {auth === 'bearer' ? '🔑 Bearer auth' : 'Public'}
        </span>
      </div>
      <p className="text-sm text-slate-500 leading-relaxed mb-4">{description}</p>
      {children}
    </div>
  )
}

export default function ApiDocsPage() {
  return (
    <>
      <Nav />
      <main id="main-content" className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">

        {/* Hero */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-16 sm:pt-20 pb-10">
          <div className="inline-flex items-center gap-2 bg-white border border-slate-200 rounded-full px-4 py-1.5 mb-5 shadow-sm">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
            <span className="text-xs font-semibold text-slate-700">REST API · v1 · Stable</span>
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl text-slate-900 mb-4 leading-[1.05] tracking-tight">
            Accessly <span className="bg-gradient-to-r from-emerald-600 to-violet-600 bg-clip-text text-transparent">API & Webhooks</span>
          </h1>
          <p className="text-slate-500 text-base sm:text-lg max-w-2xl leading-relaxed">
            Run a WCAG 2.2 scan from your CI/CD pipeline, get notified the moment a scan completes, and embed a live compliance badge — all under one base URL.
          </p>
        </section>

        {/* Quick links */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { href: '#authentication', label: 'Authentication', sub: 'Bearer tokens · CICD_API_KEY' },
              { href: '#endpoints',      label: 'Endpoints',      sub: '/api/v1/scan · /api/badge/:id' },
              { href: '#webhooks',       label: 'Webhooks',       sub: 'scan.completed · signed payloads' },
            ].map(item => (
              <a key={item.label} href={item.href} className="bg-white border border-slate-200 rounded-2xl p-4 hover:border-slate-300 hover:shadow-md transition group">
                <p className="font-semibold text-slate-900 group-hover:text-emerald-700 transition text-sm">{item.label} →</p>
                <p className="text-xs text-slate-400 mt-1">{item.sub}</p>
              </a>
            ))}
          </div>
        </section>

        {/* Base URL */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-10">
          <h2 className="font-serif text-2xl text-slate-900 mb-3">Base URL</h2>
          <Code>{SITE_URL}/api</Code>
        </section>

        {/* Authentication */}
        <section id="authentication" className="max-w-4xl mx-auto px-4 sm:px-6 pb-12 scroll-mt-24">
          <h2 className="font-serif text-2xl text-slate-900 mb-3">Authentication</h2>
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4">
            <p className="text-sm text-slate-600 leading-relaxed">
              The CI/CD scan endpoint (<code className="font-mono bg-slate-100 px-1 rounded">/api/v1/scan</code>) authenticates with a Bearer token. Your API key lives in <strong>Settings → API Access</strong> on your dashboard. Pass it on every request:
            </p>
            <Code>{`Authorization: Bearer ${'<'}YOUR_API_KEY${'>'}`}</Code>
            <p className="text-sm text-slate-600 leading-relaxed">
              The badge endpoint and webhook receivers are public — no auth needed.
            </p>
          </div>
        </section>

        {/* Endpoints */}
        <section id="endpoints" className="max-w-4xl mx-auto px-4 sm:px-6 pb-12 scroll-mt-24">
          <h2 className="font-serif text-2xl text-slate-900 mb-5">Endpoints</h2>

          <div className="space-y-5">

            <Endpoint
              method="POST"
              path="/api/v1/scan"
              auth="bearer"
              description="Run a fresh WCAG 2.2 scan on the given URL and return the report synchronously. Hard 30-second timeout — most pages complete in 5-15s."
            >
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mt-1">Request</p>
                <Code>{`curl -X POST ${SITE_URL}/api/v1/scan \\
  -H "Authorization: Bearer $ACCESSLY_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{ "url": "https://your-site.com" }'`}</Code>

                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mt-2">Response · 200 OK</p>
                <Code lang="json">{`{
  "url":       "https://your-site.com",
  "score":     87,
  "errors":    3,
  "warnings":  12,
  "passes":    104,
  "violations": [
    {
      "id":          "color-contrast",
      "impact":      "serious",
      "description": "Elements must have sufficient color contrast",
      "wcag":        "1.4.3",
      "helpUrl":     "https://dequeuniversity.com/rules/axe/...",
      "nodes": [
        { "target": ".cta-button", "html": "<a class=\\"cta-button\\">…</a>",
          "failureSummary": "...", "impact": "serious" }
      ]
    }
  ],
  "scannedAt": "2026-05-14T18:24:51.211Z"
}`}</Code>

                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mt-2">Error codes</p>
                <ul className="text-sm text-slate-600 list-disc pl-5 space-y-1">
                  <li><code className="font-mono">400</code> — invalid URL or invalid JSON body</li>
                  <li><code className="font-mono">401</code> — missing or wrong Bearer token</li>
                  <li><code className="font-mono">500</code> — scan failed (timeout, target down, etc.)</li>
                </ul>
              </div>
            </Endpoint>

            <Endpoint
              method="GET"
              path="/api/badge/:scanId"
              auth="public"
              description="Returns an SVG 'Audited by Accessly' badge for the given scan id. Embed it in your README, footer, or marketing page — the score auto-refreshes whenever a new scan runs."
            >
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mt-1">Query params</p>
                <ul className="text-sm text-slate-600 list-disc pl-5 space-y-1">
                  <li><code className="font-mono">style=full</code> (default) — 220×72 branded card</li>
                  <li><code className="font-mono">style=compact</code> — 144×20 shields.io-style pill</li>
                </ul>

                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mt-2">Markdown embed</p>
                <Code lang="markdown">{`[![Audited by Accessly](${SITE_URL}/api/badge/<scanId>)](${SITE_URL}/scan/<scanId>)`}</Code>

                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mt-2">HTML embed</p>
                <Code lang="html">{`<a href="${SITE_URL}/scan/<scanId>" target="_blank" rel="noopener">
  <img src="${SITE_URL}/api/badge/<scanId>" alt="Audited by Accessly — WCAG 2.2" width="220" height="72" />
</a>`}</Code>

                <p className="text-sm text-slate-500 leading-relaxed">
                  Pull your latest scan id from <strong>Settings → Compliance badge</strong>, or use <code className="font-mono">/api/badge/preview</code> while you&apos;re still wiring it up.
                </p>
              </div>
            </Endpoint>

          </div>
        </section>

        {/* Webhooks */}
        <section id="webhooks" className="max-w-4xl mx-auto px-4 sm:px-6 pb-12 scroll-mt-24">
          <h2 className="font-serif text-2xl text-slate-900 mb-5">Webhooks</h2>
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4">
            <p className="text-sm text-slate-600 leading-relaxed">
              Configure a webhook URL in <strong>Settings → Webhooks</strong> and we&apos;ll POST a JSON payload to it every time a scan completes — both dashboard scans and CI/CD API scans.
            </p>

            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mt-2">Event: scan.completed</p>
            <Code lang="json">{`{
  "event":     "scan.completed",
  "url":       "https://your-site.com",
  "score":     87,
  "errors":    3,
  "warnings":  12,
  "passes":    104,
  "scannedAt": "2026-05-14T18:24:51.211Z",
  "scanId":    "e3f1a2c0-...",
  "reportUrl": "${SITE_URL}/scan/e3f1a2c0-..."
}`}</Code>

            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mt-2">Headers</p>
            <ul className="text-sm text-slate-600 list-disc pl-5 space-y-1">
              <li><code className="font-mono">Content-Type: application/json</code></li>
              <li><code className="font-mono">User-Agent: Accessly-Webhooks/1.0</code></li>
              <li><code className="font-mono">X-Accessly-Event: scan.completed</code></li>
              <li><code className="font-mono">X-Accessly-Signature: sha256=&lt;hmac&gt;</code> — only if signing is enabled</li>
            </ul>

            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mt-3">Verifying the signature (Node.js)</p>
            <Code lang="javascript">{`import { createHmac, timingSafeEqual } from 'node:crypto'

const body      = await req.text()
const signature = req.headers.get('x-accessly-signature') ?? ''
const expected  = 'sha256=' + createHmac('sha256', process.env.WEBHOOK_SIGNING_SECRET)
  .update(body)
  .digest('hex')

const a = Buffer.from(signature)
const b = Buffer.from(expected)
if (a.length !== b.length || !timingSafeEqual(a, b)) {
  return new Response('Invalid signature', { status: 401 })
}

const event = JSON.parse(body)
console.log(event)  // { event: 'scan.completed', ... }`}</Code>

            <p className="text-sm text-slate-500 leading-relaxed">
              <strong>Delivery semantics:</strong> fire-and-forget with a 5-second timeout. We retry on transient failures but don&apos;t guarantee at-least-once delivery — your handler should be idempotent on <code className="font-mono">scanId</code>.
            </p>
          </div>
        </section>

        {/* CI/CD recipe */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-12">
          <h2 className="font-serif text-2xl text-slate-900 mb-5">Recipe: GitHub Actions</h2>
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4">
            <p className="text-sm text-slate-600 leading-relaxed">
              Drop this into <code className="font-mono bg-slate-100 px-1 rounded">.github/workflows/accessibility.yml</code> and your repo will fail any PR that drops below an a11y score of 80.
            </p>
            <Code lang="yaml">{`name: Accessibility check
on:
  pull_request:
    branches: [main]

jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - name: Run Accessly scan
        run: |
          RESULT=$(curl -fsS -X POST ${SITE_URL}/api/v1/scan \\
            -H "Authorization: Bearer \${{ secrets.ACCESSLY_API_KEY }}" \\
            -H "Content-Type: application/json" \\
            -d '{"url": "https://staging.your-site.com"}')

          SCORE=$(echo "$RESULT" | jq .score)
          echo "Accessibility score: $SCORE"

          if [ "$SCORE" -lt 80 ]; then
            echo "::error::Score $SCORE is below the 80 threshold"
            exit 1
          fi`}</Code>
            <p className="text-sm text-slate-500 leading-relaxed">
              Add <code className="font-mono bg-slate-100 px-1 rounded">ACCESSLY_API_KEY</code> in <strong>Repo → Settings → Secrets and variables → Actions</strong>.
            </p>
          </div>
        </section>

        {/* Closing */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-20">
          <div className="bg-slate-900 text-white rounded-3xl px-6 sm:px-10 py-10 sm:py-12 text-center relative overflow-hidden">
            <div aria-hidden="true" className="pointer-events-none absolute -top-12 -right-12 w-48 h-48 bg-emerald-400/20 rounded-full blur-3xl" />
            <h3 className="font-serif text-3xl mb-3">Need a feature we don&apos;t have?</h3>
            <p className="text-white/70 text-sm max-w-md mx-auto mb-6 leading-relaxed">
              We&apos;re a small team and we read every email. Tell us what you need — we&apos;ll get back to you within a few hours.
            </p>
            <a href="mailto:contact@accessly.us" className="inline-flex items-center gap-2 bg-emerald-400 text-slate-900 font-bold px-5 py-2.5 rounded-xl hover:bg-emerald-300 transition text-sm">
              Email contact@accessly.us
            </a>
          </div>
        </section>

      </main>
      <Footer />
    </>
  )
}
