'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type ActionResult = { error?: string; success?: boolean }

export async function addSite(
  _prev: ActionResult | null,
  fd: FormData,
): Promise<ActionResult> {
  const raw = (fd.get('url') as string ?? '').trim()
  if (!raw) return { error: 'URL is required' }

  const url = /^https?:\/\//i.test(raw) ? raw : 'https://' + raw
  try { new URL(url) } catch { return { error: 'Invalid URL' } }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('sites')
    .insert({ user_id: user.id, url })

  if (error) {
    if (error.code === '23505') return { error: 'This URL is already in your watchlist' }
    return { error: error.message }
  }

  revalidatePath('/dashboard/monitor')
  return { success: true }
}

export async function removeSite(fd: FormData): Promise<void> {
  const siteId = fd.get('siteId') as string
  if (!siteId) return

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('sites')
    .delete()
    .eq('id', siteId)
    .eq('user_id', user.id)

  revalidatePath('/dashboard/monitor')
}
