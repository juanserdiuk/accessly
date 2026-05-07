'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export type ActionResult = { error?: string; success?: boolean }

export async function updateProfile(
  _prev: ActionResult | null,
  fd: FormData,
): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({
    data: {
      first_name: (fd.get('firstName') as string).trim(),
      last_name:  (fd.get('lastName')  as string).trim(),
    },
  })
  if (error) return { error: error.message }
  revalidatePath('/dashboard/settings')
  return { success: true }
}

export async function updatePassword(
  _prev: ActionResult | null,
  fd: FormData,
): Promise<ActionResult> {
  const password = (fd.get('password') as string)
  const confirm  = (fd.get('confirm')  as string)

  if (!password)           return { error: 'Password is required' }
  if (password.length < 8) return { error: 'Password must be at least 8 characters' }
  if (password !== confirm) return { error: 'Passwords do not match' }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password })
  if (error) return { error: error.message }
  return { success: true }
}

export async function deleteAccount(
  _prev: ActionResult | null,
  fd: FormData,
): Promise<ActionResult> {
  const confirm = fd.get('confirm') as string
  if (confirm !== 'DELETE') return { error: 'Type DELETE to confirm' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const admin = createAdminClient()
  const { error } = await admin.auth.admin.deleteUser(user.id)
  if (error) return { error: error.message }

  redirect('/')
}
