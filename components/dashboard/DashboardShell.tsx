'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import Sidebar from './Sidebar'

interface Props {
  email: string
  plan: string
  children: React.ReactNode
}

export default function DashboardShell({ email, plan, children }: Props) {
  const tNav = useTranslations('nav')
  const [open, setOpen] = useState(false)
  const path = usePathname()

  // Auto-close drawer on route change
  useEffect(() => { setOpen(false) }, [path])

  // Lock body scroll while drawer is open on mobile
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <div className="dashboard-layout flex flex-col lg:flex-row h-screen overflow-hidden bg-slate-50">

      {/* Mobile top bar — hidden at lg: and above */}
      <header className="lg:hidden bg-slate-900 px-4 h-14 flex items-center justify-between shrink-0 print:hidden z-30">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-emerald-400 rounded-lg flex items-center justify-center shrink-0">
            <span className="text-slate-900 text-xs font-bold">A</span>
          </div>
          <span className="font-serif text-lg text-white">Accessly</span>
        </Link>
        <button
          onClick={() => setOpen(o => !o)}
          aria-label={open ? tNav('closeMenu') : tNav('openMenu')}
          aria-expanded={open}
          className="flex flex-col gap-1.5 w-9 h-9 items-center justify-center"
        >
          <span className={`block h-0.5 bg-white rounded-full transition-all duration-300 origin-center ${open ? 'w-5 rotate-45 translate-y-2' : 'w-5'}`} />
          <span className={`block h-0.5 bg-white rounded-full transition-all duration-300 ${open ? 'w-0 opacity-0' : 'w-5'}`} />
          <span className={`block h-0.5 bg-white rounded-full transition-all duration-300 origin-center ${open ? 'w-5 -rotate-45 -translate-y-2' : 'w-5'}`} />
        </button>
      </header>

      {/* Backdrop — only visible on mobile when drawer is open */}
      <div
        onClick={() => setOpen(false)}
        aria-hidden="true"
        className={`lg:hidden fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Sidebar — drawer below lg:, persistent at lg: and up */}
      <Sidebar email={email} plan={plan} open={open} />

      {/* Page content */}
      <div className="dashboard-content flex-1 flex flex-col overflow-hidden">
        {children}
      </div>
    </div>
  )
}
