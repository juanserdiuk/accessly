import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')
  if (user.email !== process.env.ADMIN_EMAIL) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-slate-900 border-b border-white/10 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-emerald-400 rounded-lg flex items-center justify-center shrink-0">
              <span className="text-slate-900 text-xs font-bold">A</span>
            </div>
            <span className="font-serif text-lg text-white">Accessly</span>
            <span className="text-xs font-bold bg-red-500 text-white px-2 py-0.5 rounded-full tracking-wide">
              ADMIN
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-white/40 hidden sm:block">{user.email}</span>
            <Link
              href="/dashboard"
              className="text-xs font-medium text-white/60 hover:text-white transition flex items-center gap-1"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
              Dashboard
            </Link>
          </div>
        </div>
      </header>
      {children}
    </div>
  )
}
