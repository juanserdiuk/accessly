import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardShell from '@/components/dashboard/DashboardShell'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Defense-in-depth: even if Supabase email confirmation is somehow
  // disabled at the project level, the app refuses to render the dashboard
  // for an unverified user. They get bounced to /auth/verify-pending where
  // they can resend the verification email.
  if (!user.email_confirmed_at) redirect('/auth/verify-pending')

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .single()

  return (
    <DashboardShell email={user.email ?? ''} plan={profile?.plan ?? 'free'}>
      {children}
    </DashboardShell>
  )
}
