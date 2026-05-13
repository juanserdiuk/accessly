'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { label: 'Overview',     href: '/admin' },
  { label: 'Messages',     href: '/admin/messages' },
  { label: 'Guest Access', href: '/admin/guests' },
  { label: 'Salespeople',  href: '/admin/sales' },
  { label: 'Promo Codes',  href: '/admin/promos' },
]

export default function AdminNav() {
  const path = usePathname()
  return (
    <nav className="bg-white border-b border-slate-200 overflow-x-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-1 h-11 items-end">
        {links.map(({ label, href }) => {
          const active = path === href
          return (
            <Link
              key={href}
              href={href}
              className={`px-3 pb-2.5 pt-2 text-sm font-medium border-b-2 transition -mb-px ${
                active
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
