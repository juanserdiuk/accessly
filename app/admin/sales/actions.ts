'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type ActionResult = { error?: string; success?: boolean; password?: string }

async function requireAdmin(): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const adminEmail = (process.env.ADMIN_EMAIL ?? process.env.NEXT_PUBLIC_ADMIN_EMAIL)?.trim().toLowerCase()
  return !!user?.email && !!adminEmail && user.email.trim().toLowerCase() === adminEmail
}

function tempPassword() {
  // Memorable-ish temp password: 3 words + 4 digits
  const words = ['scan', 'audit', 'wcag', 'beam', 'patch', 'flow', 'lift', 'wave', 'pulse', 'shift']
  const pick = () => words[Math.floor(Math.random() * words.length)]
  const digits = String(Math.floor(1000 + Math.random() * 9000))
  return `${pick()}-${pick()}-${digits}`
}

export async function createSalesperson(
  _prev: ActionResult | null,
  fd: FormData,
): Promise<ActionResult> {
  if (!(await requireAdmin())) return { error: 'Unauthorized' }

  const full_name = (fd.get('full_name') as string ?? '').trim()
  const email     = (fd.get('email') as string ?? '').trim().toLowerCase()
  const phone     = (fd.get('phone') as string ?? '').trim() || null
  const commission_percent = parseFloat((fd.get('commission_percent') as string ?? '10'))

  if (!full_name) return { error: 'Full name is required' }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: 'Valid email required' }
  if (isNaN(commission_percent) || commission_percent < 0 || commission_percent > 100) {
    return { error: 'Commission must be 0-100' }
  }

  const admin = createAdminClient()
  const password = tempPassword()

  // 1. Create the Supabase auth user
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name, role: 'salesperson' },
  })
  if (createErr || !created?.user) {
    return { error: createErr?.message ?? 'Could not create account' }
  }

  // 2. Assign the salesperson role
  await admin.from('user_roles').upsert({
    user_id: created.user.id,
    role: 'salesperson',
  })

  // 3. Create the salesperson profile row
  const { error: spErr } = await admin.from('salespeople').insert({
    user_id: created.user.id,
    full_name,
    email,
    phone,
    commission_percent,
  })
  if (spErr) {
    // Roll back the auth user so we don't leak orphan accounts
    await admin.auth.admin.deleteUser(created.user.id).catch(() => {})
    return { error: spErr.message }
  }

  revalidatePath('/admin/sales')
  // Return the temp password so admin can hand it off securely
  return { success: true, password }
}

export async function updateSalespersonCommission(fd: FormData): Promise<void> {
  if (!(await requireAdmin())) return
  const id = fd.get('id') as string
  const commission = parseFloat((fd.get('commission_percent') as string ?? '0'))
  if (!id || isNaN(commission) || commission < 0 || commission > 100) return

  const admin = createAdminClient()
  await admin.from('salespeople').update({ commission_percent: commission }).eq('id', id)
  revalidatePath('/admin/sales')
  revalidatePath(`/admin/sales/${id}`)
}

export async function toggleSalespersonStatus(fd: FormData): Promise<void> {
  if (!(await requireAdmin())) return
  const id = fd.get('id') as string
  const current = fd.get('status') as string
  if (!id) return
  const next = current === 'active' ? 'inactive' : 'active'
  const admin = createAdminClient()
  await admin.from('salespeople').update({ status: next }).eq('id', id)
  revalidatePath('/admin/sales')
}

export async function markCommissionPaid(fd: FormData): Promise<void> {
  if (!(await requireAdmin())) return
  const salespersonId = fd.get('salesperson_id') as string
  if (!salespersonId) return
  const admin = createAdminClient()
  await admin
    .from('promo_redemptions')
    .update({ payout_status: 'paid', paid_at: new Date().toISOString() })
    .eq('salesperson_id', salespersonId)
    .eq('payout_status', 'unpaid')
  revalidatePath(`/admin/sales/${salespersonId}`)
}
