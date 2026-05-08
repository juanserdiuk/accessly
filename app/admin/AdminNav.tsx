'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { label: 'Overview',     href: '/admin' },
  { label: 'Guest Access', href: '/admin/guests' },
]

export default function AdminNav() {
  const path = usePathname()
  return (
    <nav className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-6 flex gap-1 h-11 items-end">
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
