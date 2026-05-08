'use client'
import { useState } from 'react'
import { useTranslations } from 'next-intl'

type NodeDetail = {
  html: string
  target: string | null
  failureSummary: string | null
  impact: string | null
}

export type ViolationItem = {
  id: string
  impact: string
  description: string
  help: string
  helpUrl: string
  wcag: string
  nodes: NodeDetail[]
}

const impactBadge: Record<string, string> = {
  critical: 'bg-red-100 text-red-700',
  serious:  'bg-orange-100 text-orange-700',
  moderate: 'bg-amber-100 text-amber-700',
  minor:    'bg-slate-100 text-slate-500',
}

function NodeBlock({ node, index }: { node: NodeDetail; index: number }) {
  const t = useTranslations('dashboard.violations')
  return (
    <div className="px-5 py-4 space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
          {t('element')} {index + 1}
        </span>
        {node.impact && (
          <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${impactBadge[node.impact] ?? 'bg-slate-100 text-slate-500'}`}>
            {node.impact}
          </span>
        )}
      </div>

      {/* Broken HTML */}
      <pre className="bg-slate-950 text-emerald-400 font-mono text-xs rounded-xl p-4 overflow-x-auto leading-relaxed whitespace-pre-wrap break-all">
        {node.html}
      </pre>

      {/* CSS selector */}
      {node.target && (
        <div className="flex items-start gap-2.5">
          <div className="flex items-center gap-1.5 shrink-0 mt-1">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
            </svg>
            <span className="text-xs text-slate-400 font-medium whitespace-nowrap">{t('selector')}</span>
          </div>
          <code className="text-xs font-mono text-slate-600 bg-slate-50 border border-slate-100 px-2.5 py-1.5 rounded-lg break-all leading-relaxed">
            {node.target}
          </code>
        </div>
      )}

      {/* Fix instruction */}
      {node.failureSummary && (
        <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500 shrink-0 mt-0.5">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
          </svg>
          <div>
            <p className="text-xs font-semibold text-amber-800 mb-0.5">{t('howToFix')}</p>
            <p className="text-xs text-amber-700 leading-relaxed">{node.failureSummary}</p>
          </div>
        </div>
      )}
    </div>
  )
}

function ViolationCard({ v }: { v: ViolationItem }) {
  const t = useTranslations('dashboard.violations')
  const [open, setOpen] = useState(false)
  const badge = impactBadge[v.impact] ?? 'bg-slate-100 text-slate-500'
  const wcagTags = v.wcag ? v.wcag.split(', ').filter(Boolean) : []

  return (
    <div className={`border rounded-xl overflow-hidden bg-white transition-shadow ${open ? 'border-slate-300 shadow-sm' : 'border-slate-200'}`}>
      {/* Collapsed header */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-start gap-3 px-5 py-4 text-left hover:bg-slate-50 transition-colors"
      >
        <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full capitalize mt-0.5 ${badge}`}>
          {v.impact}
        </span>

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-800 text-sm leading-snug">{v.help}</p>
          <p className="text-xs text-slate-400 mt-0.5 leading-relaxed line-clamp-1">{v.description}</p>
        </div>

        <div className="flex items-center gap-3 shrink-0 mt-0.5">
          {wcagTags[0] && (
            <span className="text-xs font-mono text-slate-400 hidden md:block">{wcagTags[0]}</span>
          )}
          <span className="text-xs text-slate-400 whitespace-nowrap">
            {Array.isArray(v.nodes)
              ? `${v.nodes.length} ${v.nodes.length === 1 ? t('elementSingular') : t('elementPlural')}`
              : `${v.nodes} ${t('elementPlural')}`}
          </span>
          <a
            href={v.helpUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="text-xs font-semibold text-emerald-600 hover:underline whitespace-nowrap hidden sm:block"
          >
            {t('docs')}
          </a>
          <svg
            width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            className={`text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          >
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
      </button>

      {/* Expanded content */}
      {open && (
        <div className="border-t border-slate-100">
          {/* WCAG strip */}
          {wcagTags.length > 0 && (
            <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-400 font-medium mr-1">WCAG</span>
              {wcagTags.map(tag => (
                <span key={tag} className="text-xs font-mono bg-white border border-slate-200 text-slate-600 px-2 py-0.5 rounded">
                  {tag}
                </span>
              ))}
              <a
                href={v.helpUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto text-xs font-semibold text-emerald-600 hover:underline sm:hidden"
              >
                {t('learnMore')}
              </a>
            </div>
          )}

          {/* Node blocks */}
          <div className="divide-y divide-slate-100">
            {Array.isArray(v.nodes) ? v.nodes.map((node, i) => (
              <NodeBlock key={i} node={node} index={i} />
            )) : (
              <div className="px-5 py-4 text-xs text-slate-400 italic">
                {t('rerunHint')}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function ViolationAccordion({ violations }: { violations: ViolationItem[] }) {
  return (
    <div className="space-y-2">
      {violations.map((v, i) => (
        <ViolationCard key={v.id + i} v={v} />
      ))}
    </div>
  )
}
