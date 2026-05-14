import { createClient } from '@/lib/supabase/server'
import { getTranslations } from 'next-intl/server'
import Topbar from '@/components/dashboard/Topbar'
import ProfileForm from './ProfileForm'
import PasswordForm from './PasswordForm'
import BillingSection from './BillingSection'
import ApiKeySection from './ApiKeySection'
import BadgeSection from './BadgeSection'
import WebhookSection from './WebhookSection'
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
    .select('plan, stripe_customer_id, first_name, last_name, company, country, avatar_url')
    .eq('id', user!.id)
    .single()

  const meta      = user!.user_metadata ?? {}
  const firstName = profile?.first_name ?? (meta.first_name as string) ?? ''
  const lastName  = profile?.last_name  ?? (meta.last_name  as string) ?? ''
  const company   = profile?.company ?? ''
  const country   = profile?.country ?? ''
  const avatarUrl = profile?.avatar_url ?? null
  const email     = user!.email ?? ''
  const plan        = (profile?.plan ?? 'free') as 'free' | 'pps' | 'pro' | 'agency'
  const hasCustomer = !!profile?.stripe_customer_id
  const apiKey      = process.env.CICD_API_KEY ?? null
  const siteUrl     = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://accessly.us').replace(/\/$/, '')

  // Latest scan id for the badge embed snippets — fall back to a preview if
  // they haven't scanned anything yet.
  const { data: latestScan } = await supabase
    .from('scans')
    .select('id')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  const latestScanId = latestScan?.id ?? null

  return (
    <div className="dashboard-scroll flex-1 overflow-y-auto">
      <Topbar title={t('title')} />

      <div className="p-4 sm:p-7 max-w-3xl space-y-4">

        <Section title={t('profileTitle')} description={t('profileDesc')}>
          <ProfileForm
            firstName={firstName}
            lastName={lastName}
            email={email}
            company={company}
            country={country}
            avatarUrl={avatarUrl}
          />
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

        <Section
          title="Webhooks"
          description="Get notified the moment a scan completes. Useful for Slack alerts, CI/CD pipelines, and custom analytics."
        >
          <WebhookSection current={(user!.user_metadata?.webhook_url as string | undefined) ?? null} />
        </Section>

        <Section
          title="Compliance badge"
          description="Embed a live 'Audited by Accessly' badge on your site that links back to your latest scan report. Free top-of-funnel proof for visitors, customers, and procurement teams."
        >
          <BadgeSection latestScanId={latestScanId} siteUrl={siteUrl} />
        </Section>

        <Section title={t('dangerTitle')} description={t('dangerDesc')} danger>
          <DangerZone />
        </Section>

      </div>
    </div>
  )
}
