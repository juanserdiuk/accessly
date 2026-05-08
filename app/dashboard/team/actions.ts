'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type ActionResult = { error?: string; success?: boolean }

export async function inviteMember(
  _prev: ActionResult | null,
  fd: FormData,
): Promise<ActionResult> {
  const email = (fd.get('email') as string ?? '').trim().toLowerCase()
  if (!email) return { error: 'Email is required' }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: 'Invalid email address' }

  const role = (fd.get('role') as string ?? 'member').trim()
  if (!['admin', 'member', 'viewer'].includes(role)) return { error: 'Invalid role' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  if (email === user.email?.toLowerCase()) return { error: 'You cannot invite yourself' }

  const { error } = await supabase
    .from('team_members')
    .insert({ owner_id: user.id, member_email: email, role, status: 'pending' })

  if (error) {
    if (error.code === '23505') return { error: 'This person has already been invited' }
    return { error: error.message }
  }

  revalidatePath('/dashboard/team')
  return { success: true }
}

export async function removeMember(fd: FormData): Promise<void> {
  const memberId = fd.get('memberId') as string
  if (!memberId) return

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('team_members')
    .delete()
    .eq('id', memberId)
    .eq('owner_id', user.id)

  revalidatePath('/dashboard/team')
}
