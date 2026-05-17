import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { notifyAdmin } from '@/lib/email/notifyAdmin'
import { notify } from '@/lib/notify'
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

  // Clear the pending-purchase intent regardless of type — if the user just
  // completed the purchase they came here to make, the dashboard banner
  // should disappear next render.
  try {
    const { data: { user: u } } = await supabase.auth.admin.getUserById(userId)
    const meta = (u?.user_metadata ?? {}) as Record<string, unknown>
    if (meta.pending_intent != null) {
      const next = { ...meta }
      delete next.pending_intent
      await supabase.auth.admin.updateUserById(userId, { user_metadata: next })
    }
  } catch (err) {
    console.error('[webhook] failed to clear pending_intent:', err)
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

  // Notify admin of every successful purchase. Two channels:
  //   (a) email — existing HTML to the admin inbox (legacy)
  //   (b) Slack/Discord webhook — instant phone notification with the
  //       tier + $ amount in the lock-screen preview
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

  if (type === 'subscription') {
    notify.subscriptionStarted({
      customerEmail,
      plan,
      amountCents: session.amount_total ?? 0,
      currency: session.currency ?? 'usd',
      sessionId: session.id,
      promoCode: typeof promoCode === 'string' ? promoCode : undefined,
    }).catch(() => {})
  } else if (type === 'pack') {
    notify.packPurchased({
      customerEmail,
      pack: plan,
      amountCents: session.amount_total ?? 0,
      currency: session.currency ?? 'usd',
      sessionId: session.id,
      promoCode: typeof promoCode === 'string' ? promoCode : undefined,
    }).catch(() => {})
  }
}

/**
 * Customer changed their subscription via the Stripe Customer Portal —
 * usually a plan switch (Pro → Agency or vice-versa). Also fires on
 * renewal, payment-method update, and other no-op churn, so we check
 * whether the plan actually changed before touching profiles.plan.
 *
 * Mapping logic, preferred order:
 *   1. subscription.metadata.plan        — set by our checkout flow
 *      from 2026-05-17 forward.
 *   2. price unit_amount                 — fallback for subscriptions
 *      created before metadata was attached.
 *
 * If neither resolves we log+skip — better to leave the existing plan
 * in place than to guess and downgrade a paying customer.
 */
const SUBSCRIPTION_AMOUNTS_TO_PLAN: Record<number, string> = {
  // Pro tier
  2900:  'pro',     // monthly $29
  27840: 'pro',     // annual  $278.40
  // Agency tier
  9900:  'agency',  // monthly $99
  95040: 'agency',  // annual  $950.40
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const supabase = createAdminClient()
  const customerId = subscription.customer as string

  const metaPlan = (subscription.metadata ?? {})['plan'] as string | undefined
  let plan: string | undefined = metaPlan && ['free', 'pro', 'agency'].includes(metaPlan)
    ? metaPlan
    : undefined

  if (!plan) {
    const unitAmount = subscription.items?.data?.[0]?.price?.unit_amount ?? null
    if (unitAmount && SUBSCRIPTION_AMOUNTS_TO_PLAN[unitAmount]) {
      plan = SUBSCRIPTION_AMOUNTS_TO_PLAN[unitAmount]
    }
  }

  if (!plan) {
    console.warn('[webhook] subscription.updated could not resolve plan', {
      subscriptionId: subscription.id,
      customerId,
      status: subscription.status,
      unitAmount: subscription.items?.data?.[0]?.price?.unit_amount ?? null,
    })
    return
  }

  // Don't downgrade prematurely on cancellation lifecycle events —
  // let subscription.deleted handle the actual downgrade when the
  // billing period ends.
  if (subscription.status === 'canceled' || subscription.status === 'incomplete_expired') {
    return
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, plan')
    .eq('stripe_customer_id', customerId)
    .single()

  if (!profile) {
    console.warn('[webhook] subscription.updated: no profile for customer', customerId)
    return
  }

  if (profile.plan === plan) return  // no-op churn

  await supabase
    .from('profiles')
    .update({ plan, updated_at: new Date().toISOString() })
    .eq('id', profile.id)

  console.log('[webhook] subscription.updated: plan changed', {
    userId: profile.id,
    from: profile.plan,
    to: plan,
    subscriptionId: subscription.id,
  })
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const supabase = createAdminClient()
  const customerId = subscription.customer as string

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, scan_count, plan')
    .eq('stripe_customer_id', customerId)
    .single()

  if (!profile) {
    console.warn('[webhook] customer.subscription.deleted — no profile found for customer', customerId)
    return
  }

  const planWas = profile.plan ?? 'unknown'

  // If the canceller still has scan credits sitting in their account from
  // prior pack purchases, demote them to `pps` (they still get to use those
  // scans + the pps feature set). Otherwise back to `free`.
  const nextPlan = (profile.scan_count ?? 0) > 0 ? 'pps' : 'free'

  await supabase
    .from('profiles')
    .update({ plan: nextPlan, updated_at: new Date().toISOString() })
    .eq('id', profile.id)

  // Best-effort email lookup so the founder ping has something
  // identifiable in the lock-screen preview.
  let customerEmail = 'unknown'
  try {
    const { data: { user } } = await supabase.auth.admin.getUserById(profile.id)
    customerEmail = user?.email ?? 'unknown'
  } catch { /* keep fallback */ }

  notify.subscriptionCancelled({
    customerEmail,
    planWas,
  }).catch(() => {})
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig  = req.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('[webhook] STRIPE_WEBHOOK_SECRET is not configured')
    // Return 200 so Stripe doesn't retry for 3 days while the env var is
    // missing on Vercel; the log line is what should alert ops.
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 200 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err: any) {
    console.error('[webhook] signature verification failed:', err.message)
    return NextResponse.json({ error: `Webhook error: ${err.message}` }, { status: 400 })
  }

  // Idempotency: Stripe retries webhook deliveries with exponential backoff
  // (and re-fires after network blips). Without an idempotency check we'd
  // send duplicate "💰 New subscription" emails + Slack pings on every
  // retry. Insert the event.id BEFORE running side-effects; if it's already
  // there, this is a retry — short-circuit with 200 so Stripe stops.
  //
  // Defensive: if the stripe_events table doesn't exist yet (migration
  // 20260516000000 hasn't been applied), we log a warning and proceed
  // without idempotency rather than block every webhook delivery.
  const supabase = createAdminClient()
  const { error: insertErr } = await supabase
    .from('stripe_events')
    .insert({ id: event.id, type: event.type })

  if (insertErr) {
    const code = (insertErr as { code?: string }).code
    if (code === '23505') {
      // unique_violation = already processed.
      console.log('[webhook] duplicate event skipped:', event.id, event.type)
      return NextResponse.json({ received: true, duplicate: true })
    }
    if (code === '42P01' || /relation .* does not exist/i.test(insertErr.message ?? '')) {
      // Table not migrated yet — degrade gracefully.
      console.warn('[webhook] stripe_events table missing — run `supabase db push` for migration 20260516000000')
    } else {
      console.error('[webhook] idempotency insert failed:', insertErr)
      return NextResponse.json({ error: 'Idempotency check failed' }, { status: 500 })
    }
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
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
