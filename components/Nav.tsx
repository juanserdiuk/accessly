'use client'
import Link from 'next/link'

export default function Nav() {
  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-serif text-xl text-slate-900">
          <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
            <span className="text-emerald-400 text-sm font-bold">A</span>
          </div>
          Accessly
        </Link>
        <div className="hidden md:flex items-center gap-8">
          <Link href="#scanner" className="text-sm text-slate-500 hover:text-slate-900">Scanner</Link>
          <Link href="#features" className="text-sm text-slate-500 hover:text-slate-900">Features</Link>
          <Link href="#pricing" className="text-sm text-slate-500 hover:text-slate-900">Pricing</Link>
          <Link href="/login" className="text-sm text-slate-500 hover:text-slate-900">Sign in</Link>
          <Link href="/signup" className="bg-slate-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-slate-700 transition">
            Start free
          </Link>
        </div>
      </div>
    </nav>
  )
}