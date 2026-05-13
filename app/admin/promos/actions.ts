'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type ActionResult = { error?: string; success?: boolean }

async function requireAdmin(): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const adminEmail = (process.env.ADMIN_EMAIL ?? process.env.NEXT_PUBLIC_ADMIN_EMAIL)?.trim().toLowerCase()
  return !!user?.email && !!adminEmail && user.email.trim().toLowerCase() === adminEmail
}

export async function createPromoCode(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  if (!(await requireAdmin())) return { error: 'Unauthorized' }

  const code = (fd.get('code') as string ?? '').trim().toUpperCase()
  const discount = parseInt((fd.get('discount_percent') as string ?? '0'), 10)
  const stripeCouponId = (fd.get('stripe_coupon_id') as string ?? '').trim()
  const maxUsesRaw = (fd.get('max_uses') as string ?? '').trim()
  const salespersonId = (fd.get('salesperson_id') as string ?? '').trim() || null
  const expiresAt = (fd.get('expires_at') as string ?? '').trim() || null

  if (!code) return { error: 'Code is required' }
  if (!/^[A-Z0-9_-]{2,30}$/.test(code)) return { error: 'Code must be 2-30 chars, letters/numbers/_/- only' }
  if (!discount || discount < 1 || discount > 100) return { error: 'Discount must be 1-100' }
  if (!stripeCouponId) return { error: 'Stripe coupon ID is required — create it in Stripe Dashboard first' }

  const maxUses = maxUsesRaw ? parseInt(maxUsesRaw, 10) : null
  if (maxUses !== null && (isNaN(maxUses) || maxUses < 1)) return { error: 'Max uses must be a positive number' }

  const admin = createAdminClient()
  const { error } = await admin.from('promo_codes').insert({
    code,
    discount_percent: discount,
    stripe_coupon_id: stripeCouponId,
    max_uses: maxUses,
    salesperson_id: salespersonId,
    expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
    status: 'active',
  })

  if (error) {
    if (error.code === '23505') return { error: 'A code with that name already exists' }
    return { error: error.message }
  }

  revalidatePath('/admin/promos')
  return { success: true }
}

export async function togglePromoCode(fd: FormData): Promise<void> {
  if (!(await requireAdmin())) return
  const id = fd.get('id') as string
  const currentStatus = fd.get('status') as string
  if (!id) return
  const newStatus = currentStatus === 'active' ? 'disabled' : 'active'
  const admin = createAdminClient()
  await admin.from('promo_codes').update({ status: newStatus }).eq('id', id)
  revalidatePath('/admin/promos')
}

export async function deletePromoCode(fd: FormData): Promise<void> {
  if (!(await requireAdmin())) return
  const id = fd.get('id') as string
  if (!id) return
  const admin = createAdminClient()
  // Don't delete if there are redemptions; just disable instead.
  const { count } = await admin.from('promo_redemptions').select('*', { count: 'exact', head: true }).eq('code_id', id)
  if ((count ?? 0) > 0) {
    await admin.from('promo_codes').update({ status: 'disabled' }).eq('id', id)
  } else {
    await admin.from('promo_codes').delete().eq('id', id)
  }
  revalidatePath('/admin/promos')
}
