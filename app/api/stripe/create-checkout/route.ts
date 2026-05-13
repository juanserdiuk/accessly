import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

function getOrigin(req: NextRequest) {
  // Prefer the actual request origin so checkout redirects always come back
  // to the host the user was on. Falls back to env var, then a safe default.
  const origin = req.headers.get('origin') ?? req.nextUrl.origin
  if (origin) return origin.replace(/\/$/, '')
  return (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://accessly.us').replace(/\/$/, '')
}

// Annual total = monthly × 12 × 0.8 (20% off the year), charged once a year.
// Pro:    2900 × 12 × 0.8 = 27840 ($278.40/year)
// Agency: 9900 × 12 × 0.8 = 95040 ($950.40/year)
const SUBSCRIPTION_PLANS = {
  pro: {
    monthly: { unit_amount: 2900,  nickname: 'Pro Monthly' },
    annual:  { unit_amount: 27840, nickname: 'Pro Annual' },
  },
  agency: {
    monthly: { unit_amount: 9900,  nickname: 'Agency Monthly' },
    annual:  { unit_amount: 95040, nickname: 'Agency Annual' },
  },
}

const SCAN_PACKS = {
  starter:     { unit_amount:  900, name: 'Starter Scan Pack (10 pages)' },
  basic:       { unit_amount: 1900, name: 'Basic Scan Pack (25 pages)' },
  'pro-pack':  { unit_amount: 2900, name: 'Pro Scan Pack (50 pages)' },
  'agency-pack': { unit_amount: 4900, name: 'Agency Scan Pack (100 pages)' },
}

export async function POST(req: NextRequest) {
  try {
    const { type, plan, billing = 'monthly', promoCode } = await req.json()

    if (!type || !plan) {
      return NextResponse.json({ error: 'Missing type or plan' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Subscriptions need an authenticated user so the webhook can match the
    // session back to a profile. One-time scan packs can stay open.
    if (type === 'subscription' && !user) {
      return NextResponse.json({ error: 'Sign in to start a subscription' }, { status: 401 })
    }

    // Validate the promo code (if provided) and gather Stripe coupon id +
    // the metadata we need to attribute the sale to a salesperson later.
    let stripeCouponId: string | undefined
    let promoMetadata: Record<string, string> = {}
    if (promoCode && typeof promoCode === 'string') {
      const admin = createAdminClient()
      const { data: promo } = await admin
        .from('promo_codes')
        .select('id, code, salesperson_id, discount_percent, stripe_coupon_id, max_uses, uses_count, expires_at, status')
        .ilike('code', promoCode.trim())
        .maybeSingle()

      if (promo && promo.status === 'active') {
        const expired = promo.expires_at && new Date(promo.expires_at) < new Date()
        const maxedOut = promo.max_uses !== null && promo.uses_count >= promo.max_uses
        if (!expired && !maxedOut) {
          stripeCouponId = promo.stripe_coupon_id
          promoMetadata = {
            promo_code_id: promo.id,
            promo_code: promo.code,
            promo_discount_percent: String(promo.discount_percent),
            ...(promo.salesperson_id ? { salesperson_id: promo.salesperson_id } : {}),
          }
        }
      }
    }

    const siteUrl = getOrigin(req)
    const successUrl = `${siteUrl}/dashboard?checkout=success`
    const cancelUrl  = `${siteUrl}/#pricing`
    const metadata   = { type, plan, billing, ...promoMetadata }
    const discounts  = stripeCouponId ? [{ coupon: stripeCouponId }] : undefined

    if (type === 'subscription') {
      const planConfig = SUBSCRIPTION_PLANS[plan as keyof typeof SUBSCRIPTION_PLANS]
      if (!planConfig) {
        return NextResponse.json({ error: `Unknown subscription plan: ${plan}` }, { status: 400 })
      }
      const price = planConfig[billing as 'monthly' | 'annual']

      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        client_reference_id: user?.id,
        metadata,
        ...(discounts ? { discounts } : {}),
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: { name: `Accessly ${price.nickname}` },
            unit_amount: price.unit_amount,
            recurring: { interval: billing === 'annual' ? 'year' : 'month' },
          },
          quantity: 1,
        }],
        success_url: successUrl,
        cancel_url: cancelUrl,
      })

      return NextResponse.json({ url: session.url })
    }

    if (type === 'pack') {
      const packConfig = SCAN_PACKS[plan as keyof typeof SCAN_PACKS]
      if (!packConfig) {
        return NextResponse.json({ error: `Unknown scan pack: ${plan}` }, { status: 400 })
      }

      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        client_reference_id: user?.id,
        metadata,
        ...(discounts ? { discounts } : { allow_promotion_codes: true }),
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: { name: packConfig.name },
            unit_amount: packConfig.unit_amount,
          },
          quantity: 1,
        }],
        success_url: successUrl,
        cancel_url: cancelUrl,
      })

      return NextResponse.json({ url: session.url })
    }

    return NextResponse.json({ error: `Unknown type: ${type}` }, { status: 400 })
  } catch (err: any) {
    console.error('[stripe/create-checkout]', err)
    return NextResponse.json({ error: err.message ?? 'Checkout failed' }, { status: 500 })
  }
}
