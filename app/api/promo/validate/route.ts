import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * POST /api/promo/validate
 * Body: { code: string }
 *
 * Returns:
 *   200 { ok: true, code, stripeCouponId, discountPercent }
 *   404 { ok: false, error: 'Code not found' }
 *   410 { ok: false, error: 'Code expired or no longer active' }
 */
export async function POST(req: NextRequest) {
  let body: { code?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request body' }, { status: 400 })
  }

  const code = (body.code ?? '').trim().toUpperCase()
  if (!code) {
    return NextResponse.json({ ok: false, error: 'Code is required' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: promo, error } = await admin
    .from('promo_codes')
    .select('id, code, discount_percent, stripe_coupon_id, max_uses, uses_count, expires_at, status')
    .ilike('code', code)
    .maybeSingle()

  if (error) {
    console.error('[promo/validate] db error:', error.message)
    return NextResponse.json({ ok: false, error: 'Could not validate code' }, { status: 500 })
  }
  if (!promo) {
    return NextResponse.json({ ok: false, error: "We couldn't find that code." }, { status: 404 })
  }
  if (promo.status !== 'active') {
    return NextResponse.json({ ok: false, error: 'This code is no longer active.' }, { status: 410 })
  }
  if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
    return NextResponse.json({ ok: false, error: 'This code has expired.' }, { status: 410 })
  }
  if (promo.max_uses !== null && promo.uses_count >= promo.max_uses) {
    return NextResponse.json({ ok: false, error: 'This code has reached its usage limit.' }, { status: 410 })
  }

  return NextResponse.json({
    ok: true,
    code: promo.code,
    stripeCouponId: promo.stripe_coupon_id,
    discountPercent: promo.discount_percent,
  })
}
