import { createClient } from '@/lib/supabase/server'
import { getTranslations } from 'next-intl/server'
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
  const t = await getTranslations('dashboard.settings')
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
  const siteUrl     = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://accessly.us').replace(/\/$/, '')

  return (
    <div className="dashboard-scroll flex-1 overflow-y-auto">
      <Topbar title={t('title')} />

      <div className="p-4 sm:p-7 max-w-3xl space-y-4">

        <Section title={t('profileTitle')} description={t('profileDesc')}>
          <ProfileForm firstName={firstName} lastName={lastName} email={email} />
        </Section>

        <Section title={t('passwordTitle')} description={t('passwordDesc')}>
          <PasswordForm />
        </Section>

        <Section title={t('billingTitle')} description={t('billingDesc')}>
          <BillingSection plan={plan} hasCustomer={hasCustomer} />
        </Section>

        <Section title={t('apiTitle')} description={t('apiDesc')}>
          <ApiKeySection apiKey={apiKey} siteUrl={siteUrl} />
        </Section>

        <Section title={t('dangerTitle')} description={t('dangerDesc')} danger>
          <DangerZone />
        </Section>

      </div>
    </div>
  )
}
