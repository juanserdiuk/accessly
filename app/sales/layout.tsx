import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import SignOutButton from './SignOutButton'

export default async function SalesLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=%2Fsales')

  // Must have a salesperson row to access this portal
  const admin = createAdminClient()
  const { data: sp } = await admin
    .from('salespeople')
    .select('id, full_name, status')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!sp) redirect('/dashboard')
  if (sp.status !== 'active') {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-10 max-w-md text-center shadow-xl">
          <h1 className="font-serif text-2xl text-slate-900 mb-2">Account inactive</h1>
          <p className="text-sm text-slate-500 mb-6">Your salesperson account is currently inactive. Contact admin to reactivate.</p>
          <SignOutButton />
        </div>
      </main>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-slate-900 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-2">
          <Link href="/sales" className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 bg-emerald-400 rounded-lg flex items-center justify-center shrink-0">
              <span className="text-slate-900 text-xs font-bold">A</span>
            </div>
            <span className="font-serif text-lg text-white">Accessly</span>
            <span className="text-[10px] font-bold bg-violet-500 text-white px-2 py-0.5 rounded-full tracking-wide shrink-0 hidden sm:inline-block">
              SALES
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-xs text-white/50 hidden md:block">{sp.full_name}</span>
            <SignOutButton />
          </div>
        </div>
      </header>
      {children}
    </div>
  )
}
