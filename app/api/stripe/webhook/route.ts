import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { notifyAdmin } from '@/lib/email/notifyAdmin'
import type Stripe from 'stripe'

export const dynamic = 'force-dynamic'

function formatCurrency(amountCents: number | null | undefined, currency = 'usd') {
  if (amountCents == null) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amountCents / 100)
}

const PACK_CREDITS: Record<string, number> = {
  'starter':     10,
  'basic':       25,
  'pro-pack':    50,
  'agency-pack': 100,
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const supabase = createAdminClient()
  const userId   = session.client_reference_id
  const { type, plan } = session.metadata ?? {}

  if (!userId || !type || !plan) {
    console.warn('[webhook] checkout.session.completed missing metadata', { userId, type, plan })
    return
  }

  if (type === 'subscription') {
    await supabase
      .from('profiles')
      .upsert({
        id: userId,
        plan,
        stripe_customer_id: session.customer as string,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' })
  }

  if (type === 'pack') {
    const credits = PACK_CREDITS[plan] ?? 0
    const { data: profile } = await supabase
      .from('profiles')
      .select('scan_count, plan')
      .eq('id', userId)
      .single()

    // Anyone on `free` who buys a scan pack gets promoted to `pps`
    // (Pay-per-scan): full agency-like UI minus monitoring, with the
    // ability to keep topping up via more packs.  Existing pro/agency
    // subscribers keep their plan — pack credits just add on top.
    const currentPlan = profile?.plan ?? 'free'
    const nextPlan = currentPlan === 'free' ? 'pps' : currentPlan

    await supabase
      .from('profiles')
      .upsert({
        id: userId,
        plan: nextPlan,
        stripe_customer_id: session.customer as string,
        scan_count: (profile?.scan_count ?? 0) + credits,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' })
  }

  // Record promo redemption + commission snapshot if a promo code was used.
  const promoCodeId      = session.metadata?.promo_code_id
  const promoCode        = session.metadata?.promo_code
  const salespersonId    = session.metadata?.salesperson_id
  const customerEmail =
    session.customer_details?.email ?? session.customer_email ?? '—'

  if (promoCodeId) {
    try {
      let commissionCents = 0
      if (salespersonId) {
        const { data: sp } = await supabase
          .from('salespeople').select('commission_percent').eq('id', salespersonId).single()
        const pct = Number(sp?.commission_percent ?? 0)
        commissionCents = Math.round(((session.amount_total ?? 0) * pct) / 100)
      }
      await supabase.from('promo_redemptions').insert({
        code_id: promoCodeId,
        salesperson_id: salespersonId ?? null,
        user_id: userId,
        customer_email: customerEmail,
        amount_cents: session.amount_total ?? 0,
        currency: session.currency ?? 'usd',
        plan,
        product_type: type,
        stripe_session_id: session.id,
        commission_cents: commissionCents,
      })
      // Atomically bump uses_count
      await supabase.rpc('increment_promo_uses' as any, { promo_id: promoCodeId } as any)
        .then(({ error }) => {
          if (error) {
            // Fallback: read-modify-write
            supabase.from('promo_codes').select('uses_count').eq('id', promoCodeId).single()
              .then(({ data }) => {
                if (data) {
                  supabase.from('promo_codes')
                    .update({ uses_count: (data.uses_count ?? 0) + 1 })
                    .eq('id', promoCodeId)
                    .then()
                }
              })
          }
        })
    } catch (err) {
      console.error('[webhook] promo redemption record failed:', err)
    }
  }

  // Notify admin of every successful purchase (fire-and-forget).
  const amount = formatCurrency(session.amount_total, session.currency ?? 'usd')
  const niceType = type === 'subscription' ? 'Subscription' : 'Scan pack'
  notifyAdmin({
    subject: `[Accessly] 💰 ${niceType}: ${plan} — ${amount}`,
    heading: `New ${niceType.toLowerCase()} purchased`,
    rows: [
      { label: 'Customer', value: customerEmail },
      { label: 'Plan', value: plan },
      { label: 'Type', value: niceType },
      { label: 'Amount', value: amount },
      ...(promoCode ? [{ label: 'Promo code', value: promoCode }] : []),
      { label: 'When', value: new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) },
      { label: 'Session', value: session.id },
    ],
  }).catch(() => {})
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const supabase = createAdminClient()
  const customerId = subscription.customer as string

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, scan_count')
    .eq('stripe_customer_id', customerId)
    .single()

  if (!profile) {
    console.warn('[webhook] customer.subscription.deleted — no profile found for customer', customerId)
    return
  }

  // If the canceller still has scan credits sitting in their account from
  // prior pack purchases, demote them to `pps` (they still get to use those
  // scans + the pps feature set). Otherwise back to `free`.
  const nextPlan = (profile.scan_count ?? 0) > 0 ? 'pps' : 'free'

  await supabase
    .from('profiles')
    .update({ plan: nextPlan, updated_at: new Date().toISOString() })
    .eq('id', profile.id)
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig  = req.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    console.error('[webhook] signature verification failed:', err.message)
    return NextResponse.json({ error: `Webhook error: ${err.message}` }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break
      default:
        break
    }
  } catch (err: any) {
    console.error(`[webhook] error handling ${event.type}:`, err.message)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
