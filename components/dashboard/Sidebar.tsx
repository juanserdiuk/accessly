'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const nav = [
  { label: 'Dashboard', href: '/dashboard', icon: '▦' },
  { label: 'Scans', href: '/dashboard/scans', icon: '⌕', badge: 3 },
  { label: 'Reports', href: '/dashboard/reports', icon: '≡' },
  { label: 'Monitor', href: '/dashboard/monitor', icon: '◎' },
  { label: 'Team', href: '/dashboard/team', icon: '⊕' },
  { label: 'Settings', href: '/dashboard/settings', icon: '⚙' },
]

export default function Sidebar() {
  const path = usePathname()

  return (
    <aside className="w-56 shrink-0 bg-slate-900 flex flex-col overflow-hidden">
      <Link href="/" className="flex items-center gap-2 px-5 py-5 border-b border-white/5">
        <div className="w-8 h-8 bg-emerald-400 rounded-lg flex items-center justify-center shrink-0">
          <span className="text-slate-900 text-sm font-bold">A</span>
        </div>
        <span className="font-serif text-xl text-white">Accessly</span>
      </Link>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {nav.map(item => {
          const active = path === item.href
          return (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${active ? 'bg-emerald-400/15 text-emerald-400' : 'text-white/50 hover:text-white/80 hover:bg-white/5'}`}>
              <span className="text-base w-4 text-center">{item.icon}</span>
              {item.label}
              {item.badge && (
                <span className="ml-auto text-xs font-bold bg-red-500/20 text-red-300 px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 py-3 border-t border-white/5">
        <Link href="/login" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/30 hover:text-white/60 transition">
          <span>↩</span> Sign out
        </Link>
      </div>

      <div className="px-4 py-4 border-t border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center text-xs font-bold text-white shrink-0">
            JD
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium text-white truncate">Jane Doe</div>
            <div className="text-xs text-white/30">Pro plan · 5 sites</div>
          </div>
        </div>
      </div>
    </aside>
  )
}