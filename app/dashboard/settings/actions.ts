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
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const firstName = (fd.get('firstName') as string ?? '').trim()
  const lastName  = (fd.get('lastName')  as string ?? '').trim()
  const company   = (fd.get('company')   as string ?? '').trim() || null
  const country   = (fd.get('country')   as string ?? '').trim() || null

  // Keep user_metadata in sync (used by some Supabase template emails) AND
  // write a row in profiles so admin queries can read it without
  // auth.admin.listUsers.
  const { error: authErr } = await supabase.auth.updateUser({
    data: { first_name: firstName, last_name: lastName },
  })
  if (authErr) return { error: authErr.message }

  const admin = createAdminClient()
  const { error: profErr } = await admin
    .from('profiles')
    .update({ first_name: firstName, last_name: lastName, company, country })
    .eq('id', user.id)
  if (profErr) return { error: profErr.message }

  revalidatePath('/dashboard/settings')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function uploadAvatar(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const file = fd.get('avatar') as File | null
  if (!file || file.size === 0) return { error: 'Pick an image first' }
  if (file.size > 4 * 1024 * 1024) return { error: 'Image must be under 4 MB' }
  if (!file.type.startsWith('image/')) return { error: 'Only image files are allowed' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Folder = user id (matches the RLS policy on the avatars bucket)
  const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
  const path = `${user.id}/${Date.now()}.${ext}`

  const admin = createAdminClient()
  const arrayBuffer = await file.arrayBuffer()
  const { error: upErr } = await admin.storage
    .from('avatars')
    .upload(path, new Uint8Array(arrayBuffer), {
      contentType: file.type,
      upsert: true,
    })
  if (upErr) return { error: upErr.message }

  const { data: { publicUrl } } = admin.storage.from('avatars').getPublicUrl(path)

  const { error: profErr } = await admin
    .from('profiles')
    .update({ avatar_url: publicUrl })
    .eq('id', user.id)
  if (profErr) return { error: profErr.message }

  revalidatePath('/dashboard/settings')
  revalidatePath('/dashboard')
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
