import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import type Stripe from 'stripe'

export const dynamic = 'force-dynamic'

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
      .select('scan_count')
      .eq('id', userId)
      .single()

    await supabase
      .from('profiles')
      .upsert({
        id: userId,
        stripe_customer_id: session.customer as string,
        scan_count: (profile?.scan_count ?? 0) + credits,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' })
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const supabase = createAdminClient()
  const customerId = subscription.customer as string

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (!profile) {
    console.warn('[webhook] customer.subscription.deleted — no profile found for customer', customerId)
    return
  }

  await supabase
    .from('profiles')
    .update({ plan: 'free', updated_at: new Date().toISOString() })
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
