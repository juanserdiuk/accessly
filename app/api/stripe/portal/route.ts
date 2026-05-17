import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

function getOrigin(req: NextRequest) {
  const origin = req.headers.get('origin') ?? req.nextUrl.origin
  if (origin) return origin.replace(/\/$/, '')
  return (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://accessly.us').replace(/\/$/, '')
}

/**
 * Issue a one-time Stripe Customer Portal URL for the signed-in user.
 *
 * Common launch-day trap: Stripe requires the Customer Portal to be
 * activated in Dashboard (Settings → Billing → Customer portal →
 * Activate) before sessions can be created. If you skip that step,
 * every billing-portal click returns "No configuration provided…".
 * Caught here and surfaced clearly instead of generic 500.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single()

  if (!profile?.stripe_customer_id) {
    return NextResponse.json({ error: 'No billing account found' }, { status: 400 })
  }

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${getOrigin(req)}/dashboard/settings`,
    })
    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('[stripe.portal] failed:', err)
    const msg = (err as { message?: string })?.message ?? ''
    if (/no configuration provided|portal.+not.+activated/i.test(msg)) {
      return NextResponse.json(
        { error: 'Billing portal not activated in Stripe Dashboard. Admin needs to enable it under Settings → Billing → Customer portal.' },
        { status: 502 },
      )
    }
    return NextResponse.json(
      { error: 'Could not open billing portal. Try again in a moment.' },
      { status: 502 },
    )
  }
}
