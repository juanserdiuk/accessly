'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export type ActionResult = { error?: string; success?: boolean }

async function getSalespersonId(): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const admin = createAdminClient()
  const { data: sp } = await admin
    .from('salespeople')
    .select('id, status')
    .eq('user_id', user.id)
    .maybeSingle()
  if (!sp || sp.status !== 'active') return null
  return sp.id
}

export async function updateOwnProfile(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const id = await getSalespersonId()
  if (!id) return { error: 'Unauthorized' }

  const full_name = (fd.get('full_name') as string ?? '').trim()
  const phone = (fd.get('phone') as string ?? '').trim() || null
  const address_line1 = (fd.get('address_line1') as string ?? '').trim() || null
  const address_line2 = (fd.get('address_line2') as string ?? '').trim() || null
  const city = (fd.get('city') as string ?? '').trim() || null
  const region = (fd.get('region') as string ?? '').trim() || null
  const postal_code = (fd.get('postal_code') as string ?? '').trim() || null
  const country = (fd.get('country') as string ?? '').trim() || null

  if (!full_name) return { error: 'Full name is required' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('salespeople')
    .update({ full_name, phone, address_line1, address_line2, city, region, postal_code, country })
    .eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/sales')
  revalidatePath('/sales/profile')
  return { success: true }
}
