'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { isAdminEmail } from '@/lib/auth/admin'
import { revalidatePath } from 'next/cache'

export type ActionResult = { error?: string; success?: boolean }

async function requireAdminUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!isAdminEmail(user?.email)) return null
  return user
}

/**
 * Admin-only test bypass: flip the admin's OWN plan to free/pro/agency without
 * going through Stripe. Used to spot-check the gated UI without a real upgrade.
 * Locked to the admin's own user id — cannot mutate other customers.
 */
export async function setOwnPlan(fd: FormData): Promise<void> {
  const user = await requireAdminUser()
  if (!user) return

  const plan = (fd.get('plan') as string ?? '').trim()
  if (!['free', 'pro', 'agency'].includes(plan)) return

  const admin = createAdminClient()
  await admin.from('profiles').update({ plan }).eq('id', user.id)

  revalidatePath('/admin')
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/settings')
}

/**
 * Admin-only customer plan override: flip any customer's plan without going
 * through Stripe. Used to comp Pro/Agency to specific customers (beta testers,
 * partners, refunds, etc.). Does NOT touch Stripe subscriptions — if the
 * customer is paying via Stripe, their subscription is still active and the
 * next billing event from Stripe will fight this override.
 *
 * For paying customers we should normally cancel via the Stripe portal first;
 * this action is intended for grants, not for paid-to-free downgrades.
 */
export async function setCustomerPlan(fd: FormData): Promise<void> {
  const user = await requireAdminUser()
  if (!user) return

  const userId = (fd.get('userId') as string ?? '').trim()
  const plan   = (fd.get('plan')   as string ?? '').trim()

  if (!userId) return
  if (!['free', 'pro', 'agency'].includes(plan)) return

  const admin = createAdminClient()
  await admin.from('profiles').update({ plan }).eq('id', userId)

  revalidatePath('/admin/customers')
  revalidatePath('/admin')
}
