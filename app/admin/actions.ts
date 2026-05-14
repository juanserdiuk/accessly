'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type ActionResult = { error?: string; success?: boolean }

async function requireAdminUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const adminEmail = (process.env.ADMIN_EMAIL ?? process.env.NEXT_PUBLIC_ADMIN_EMAIL)?.trim().toLowerCase()
  if (!user?.email || !adminEmail || user.email.trim().toLowerCase() !== adminEmail) return null
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
