import { createClient } from '@/lib/supabase/server'
import Topbar from '@/components/dashboard/Topbar'
import ProfileForm from './ProfileForm'
import PasswordForm from './PasswordForm'
import BillingSection from './BillingSection'
import ApiKeySection from './ApiKeySection'
import DangerZone from './DangerZone'

function Section({
  title,
  description,
  children,
  danger = false,
}: {
  title: string
  description: string
  children: React.ReactNode
  danger?: boolean
}) {
  return (
    <div className={`bg-white border rounded-2xl p-6 flex flex-col sm:flex-row sm:gap-10 ${
      danger ? 'border-red-200' : 'border-slate-200'
    }`}>
      <div className="sm:w-52 shrink-0 mb-5 sm:mb-0">
        <h2 className={`font-semibold text-sm ${danger ? 'text-red-700' : 'text-slate-900'}`}>
          {title}
        </h2>
        <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{description}</p>
      </div>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  )
}

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, stripe_customer_id')
    .eq('id', user!.id)
    .single()

  const meta      = user!.user_metadata ?? {}
  const firstName = (meta.first_name as string) ?? ''
  const lastName  = (meta.last_name  as string) ?? ''
  const email     = user!.email ?? ''
  const plan        = (profile?.plan ?? 'free') as 'free' | 'pro' | 'agency'
  const hasCustomer = !!profile?.stripe_customer_id
  const apiKey      = process.env.CICD_API_KEY ?? null
  const siteUrl     = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '')

  return (
    <div className="dashboard-scroll flex-1 overflow-y-auto">
      <Topbar title="Settings" />

      <div className="p-7 max-w-3xl space-y-4">

        {/* Profile */}
        <Section
          title="Profile"
          description="Your display name shown across the dashboard."
        >
          <ProfileForm firstName={firstName} lastName={lastName} email={email} />
        </Section>

        {/* Password */}
        <Section
          title="Password"
          description="Change the password used to sign in to your account."
        >
          <PasswordForm />
        </Section>

        {/* Plan & Billing */}
        <Section
          title="Plan & Billing"
          description="Your current subscription plan and billing options."
        >
          <BillingSection plan={plan} hasCustomer={hasCustomer} />
        </Section>

        {/* Developer API */}
        <Section
          title="Developer API"
          description="Use the REST API to run scans from your CI/CD pipeline or custom tooling."
        >
          <ApiKeySection apiKey={apiKey} siteUrl={siteUrl} />
        </Section>

        {/* Danger Zone */}
        <Section
          title="Danger Zone"
          description="Irreversible actions that permanently affect your account."
          danger
        >
          <DangerZone />
        </Section>

      </div>
    </div>
  )
}
