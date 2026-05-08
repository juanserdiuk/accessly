'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'

const PLANS = {
  free:   { label: 'Free',   color: 'bg-slate-100 text-slate-600',   price: null },
  pro:    { label: 'Pro',    color: 'bg-violet-100 text-violet-700',  price: '$29 / month' },
  agency: { label: 'Agency', color: 'bg-emerald-100 text-emerald-700', price: '$99 / month' },
} as const

type Plan = keyof typeof PLANS

interface Props {
  plan: Plan
  hasCustomer: boolean
}

export default function BillingSection({ plan, hasCustomer }: Props) {
  const t = useTranslations('dashboard.settings')
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError]     = useState<string | null>(null)

  const meta = PLANS[plan] ?? PLANS.free

  async function checkout(targetPlan: string) {
    setError(null)
    setLoading(targetPlan)
    try {
      const res  = await fetch('/api/stripe/create-checkout', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ type: 'subscription', plan: targetPlan, billing: 'monthly' }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else setError(data.error ?? t('billingGenericError'))
    } catch {
      setError(t('billingNetworkError'))
    } finally {
      setLoading(null)
    }
  }

  async function manageSubscription() {
    setError(null)
    setLoading('portal')
    try {
      const res  = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else setError(data.error ?? t('billingGenericError'))
    } catch {
      setError(t('billingNetworkError'))
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-5">
      {/* Current plan */}
      <div className="flex items-center gap-3">
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${meta.color}`}>
          {meta.label}
        </span>
        {meta.price && (
          <span className="text-sm text-slate-500">{meta.price}</span>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        {plan === 'free' && (
          <>
            <PlanButton
              label={t('billingUpgradePro')}
              loadingLabel={t('billingLoading')}
              onClick={() => checkout('pro')}
              loading={loading === 'pro'}
              variant="primary"
            />
            <PlanButton
              label={t('billingUpgradeAgency')}
              loadingLabel={t('billingLoading')}
              onClick={() => checkout('agency')}
              loading={loading === 'agency'}
              variant="outline"
            />
          </>
        )}

        {plan === 'pro' && (
          <>
            <PlanButton
              label={t('billingUpgradeAgency')}
              loadingLabel={t('billingLoading')}
              onClick={() => checkout('agency')}
              loading={loading === 'agency'}
              variant="primary"
            />
            {hasCustomer && (
              <PlanButton
                label={t('billingManage')}
                loadingLabel={t('billingLoading')}
                onClick={manageSubscription}
                loading={loading === 'portal'}
                variant="outline"
              />
            )}
          </>
        )}

        {plan === 'agency' && hasCustomer && (
          <PlanButton
            label={t('billingManage')}
            loadingLabel={t('billingLoading')}
            onClick={manageSubscription}
            loading={loading === 'portal'}
            variant="outline"
          />
        )}
      </div>

      {/* Feature summary */}
      <div className="text-xs text-slate-400 space-y-1">
        {plan === 'free'   && <p>{t('billingFreeBenefits')}</p>}
        {plan === 'pro'    && <p>{t('billingProBenefits')}</p>}
        {plan === 'agency' && <p>{t('billingAgencyBenefits')}</p>}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
}

function PlanButton({
  label, loadingLabel, onClick, loading, variant,
}: {
  label: string
  loadingLabel: string
  onClick: () => void
  loading: boolean
  variant: 'primary' | 'outline'
}) {
  const base = 'px-4 py-2 text-sm font-semibold rounded-lg transition disabled:opacity-50'
  const styles = variant === 'primary'
    ? `${base} bg-slate-900 text-white hover:bg-slate-700`
    : `${base} border border-slate-200 text-slate-700 hover:bg-slate-50`

  return (
    <button onClick={onClick} disabled={loading} className={styles}>
      {loading ? loadingLabel : label}
    </button>
  )
}
