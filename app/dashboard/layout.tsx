import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/dashboard/Sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .single()

  return (
    <div className="dashboard-layout flex h-screen overflow-hidden bg-slate-50">
      <Sidebar email={user.email ?? ''} plan={profile?.plan ?? 'free'} />
      <div className="dashboard-content flex-1 flex flex-col overflow-hidden">
        {children}
      </div>
    </div>
  )
}
