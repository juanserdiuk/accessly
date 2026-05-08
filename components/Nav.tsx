'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'

const NAV_LINKS = [
  { label: 'Scanner', href: '#scanner' },
  { label: 'Features', href: '#features' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Sign in', href: '/login' },
]

export default function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      <nav className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 backdrop-blur-md shadow-sm border-b border-slate-200/60' : 'bg-white border-b border-slate-200'}`}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-serif text-xl text-slate-900" onClick={() => setOpen(false)}>
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
              <span className="text-emerald-400 text-sm font-bold">A</span>
            </div>
            Accessly
          </Link>

          {/* Desktop links */}
          <div className="hidden lg:flex items-center gap-8">
            {NAV_LINKS.map(({ label, href }) => (
              <Link key={label} href={href} className="text-sm text-slate-500 hover:text-slate-900 transition">{label}</Link>
            ))}
            <Link href="/signup" className="bg-slate-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-slate-700 transition">
              Start free
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setOpen(o => !o)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            className="lg:hidden flex flex-col gap-1.5 w-8 h-8 items-center justify-center"
          >
            <span className={`block h-0.5 bg-slate-800 rounded-full transition-all duration-300 origin-center ${open ? 'w-5 rotate-45 translate-y-2' : 'w-5'}`} />
            <span className={`block h-0.5 bg-slate-800 rounded-full transition-all duration-300 ${open ? 'w-0 opacity-0' : 'w-5'}`} />
            <span className={`block h-0.5 bg-slate-800 rounded-full transition-all duration-300 origin-center ${open ? 'w-5 -rotate-45 -translate-y-2' : 'w-5'}`} />
          </button>
        </div>
      </nav>

      {/* Mobile full-screen overlay */}
      <div className={`fixed inset-0 z-40 lg:hidden transition-all duration-300 ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-slate-950 flex flex-col pt-24 px-8">
          <nav className="flex flex-col">
            {NAV_LINKS.map(({ label, href }, i) => (
              <Link
                key={label}
                href={href}
                onClick={() => setOpen(false)}
                style={{
                  transitionDelay: open ? `${i * 100}ms` : '0ms',
                  opacity: open ? 1 : 0,
                  transform: open ? 'translateY(0)' : 'translateY(16px)',
                }}
                className="text-3xl font-serif font-bold text-white hover:text-emerald-400 py-4 border-b border-white/10 transition-all duration-500"
              >
                {label}
              </Link>
            ))}
          </nav>
          <Link
            href="/signup"
            onClick={() => setOpen(false)}
            style={{
              transitionDelay: open ? `${NAV_LINKS.length * 100}ms` : '0ms',
              opacity: open ? 1 : 0,
              transform: open ? 'translateY(0)' : 'translateY(16px)',
            }}
            className="mt-8 bg-emerald-400 text-slate-900 text-base font-bold px-6 py-4 rounded-xl hover:bg-emerald-300 transition-all duration-500 text-center"
          >
            Start free
          </Link>
        </div>
      </div>
    </>
  )
}
