'use client'
import Link from 'next/link'
import { useState } from 'react'
import { useTranslations } from 'next-intl'

export default function Footer() {
  const t = useTranslations('footer')
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.email || !form.message) return
    setStatus('sending')
    setErrorMsg('')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setErrorMsg(data?.error ?? t('error'))
        setStatus('error')
        return
      }
      setStatus('sent')
      setForm({ name: '', email: '', message: '' })
    } catch {
      setErrorMsg(t('error'))
      setStatus('error')
    }
  }

  const footerLinks = [
    { label: t('features'), href: '/#features' },
    { label: t('pricing'),  href: '/#pricing'  },
    { label: t('faq'),      href: '/#faq'      },
    { label: t('about'),    href: '/about'     },
    { label: t('privacy'),  href: '/privacy'   },
    { label: t('terms'),    href: '/terms'      },
    { label: t('sitemap'),  href: '/sitemap' },
  ]

  const appVersion = process.env.NEXT_PUBLIC_APP_VERSION ?? '0.0.0'

  return (
    <footer className="bg-slate-900">
      {/* Contact section */}
      <div className="max-w-6xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-2 gap-12 border-b border-white/10">
        {/* Left: info */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400 mb-3">{t('contactLabel')}</p>
          <h2 className="font-serif text-3xl text-white mb-3">{t('headline')}</h2>
          <p className="text-white/50 text-sm leading-relaxed mb-8">{t('sub')}</p>
          <div className="space-y-4">
            <a
              href="mailto:contact@accessly.us"
              className="flex items-center gap-3 text-sm text-white/70 hover:text-white transition group"
            >
              <span className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-emerald-400/40 transition">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                </svg>
              </span>
              contact@accessly.us
            </a>
            <a
              href="https://www.linkedin.com/company/accessly-web-scanner/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 text-sm text-white/70 hover:text-white transition group"
            >
              <span className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-emerald-400/40 transition">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>
                </svg>
              </span>
              LinkedIn
            </a>
            <div className="flex items-center gap-3 text-sm text-white/40">
              <span className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
              </span>
              {t('responseTime')}
            </div>
          </div>
        </div>

        {/* Right: contact form */}
        <div>
          {status === 'sent' ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-8">
              <div className="w-12 h-12 bg-emerald-400/10 border border-emerald-400/30 rounded-xl flex items-center justify-center mb-4">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <p className="text-white font-medium mb-1">{t('sentTitle')}</p>
              <p className="text-white/40 text-sm">{t('sentSub')}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-white/40 mb-1.5">{t('nameLabel')}</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder={t('namePlaceholder')}
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-400/50 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/40 mb-1.5">{t('emailLabel')}</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder={t('emailPlaceholder')}
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-400/50 transition"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-white/40 mb-1.5">{t('messageLabel')}</label>
                <textarea
                  value={form.message}
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  placeholder={t('messagePlaceholder')}
                  required
                  rows={5}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-400/50 transition resize-none"
                />
              </div>
              {status === 'error' && (
                <p className="text-red-400 text-xs">{errorMsg || t('error')}</p>
              )}
              <button
                type="submit"
                disabled={status === 'sending'}
                className="w-full bg-emerald-400 hover:bg-emerald-300 text-slate-900 font-semibold text-sm py-3 rounded-xl transition disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {status === 'sending' ? (
                  <>
                    <span className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                    {t('sending')}
                  </>
                ) : t('send')}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="max-w-6xl mx-auto px-6 py-8 flex flex-wrap items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 font-serif text-lg text-white">
          <div className="w-7 h-7 bg-emerald-400 rounded-lg flex items-center justify-center">
            <span className="text-slate-900 text-xs font-bold">A</span>
          </div>
          Accessly
        </Link>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {footerLinks.map(({ label, href }) => (
            <Link key={label} href={href} className="text-sm text-white/40 hover:text-white/80 transition">{label}</Link>
          ))}
        </div>
        <div className="flex flex-col sm:items-end gap-1">
          <p className="text-sm text-white/30">{t('copyright')}</p>
          <p className="text-[10px] font-mono text-white/20" title="Build version">{t('version', { version: appVersion })}</p>
        </div>
      </div>
    </footer>
  )
}
