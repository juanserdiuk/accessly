import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { isAdminEmail } from '@/lib/auth/admin'
import Link from 'next/link'
import AdminNav from './AdminNav'

// robots.txt blocks /admin, but in-page noindex defends against
// bots that learn the URL via external links.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')
  if (!user.email_confirmed_at) redirect('/auth/verify-pending')
  if (!isAdminEmail(user.email)) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-slate-900 border-b border-white/10 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-7 h-7 bg-emerald-400 rounded-lg flex items-center justify-center shrink-0">
              <span className="text-slate-900 text-xs font-bold">A</span>
            </div>
            <span className="font-serif text-lg text-white">Accessly</span>
            <span className="text-[10px] sm:text-xs font-bold bg-red-500 text-white px-2 py-0.5 rounded-full tracking-wide shrink-0">
              ADMIN
            </span>
          </div>
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            <span className="text-xs text-white/40 hidden md:block truncate max-w-[200px]">{user.email}</span>
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
      <AdminNav />
      {children}
    </div>
  )
}
