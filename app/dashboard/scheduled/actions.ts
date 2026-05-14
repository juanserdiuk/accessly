'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { CADENCE_MS, isValidCadence } from './cadence'

export type ActionResult = { error?: string; success?: boolean }

export async function createSchedule(
  _prev: ActionResult | null,
  fd: FormData,
): Promise<ActionResult> {
  const rawUrl = (fd.get('url') as string ?? '').trim()
  const cadence = (fd.get('cadence') as string ?? 'daily').trim()
  if (!rawUrl) return { error: 'URL is required' }
  if (!isValidCadence(cadence)) return { error: 'Invalid cadence' }

  const url = /^https?:\/\//i.test(rawUrl) ? rawUrl : 'https://' + rawUrl
  try { new URL(url) } catch { return { error: 'Invalid URL' } }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Plan gate
  const { data: profile } = await supabase
    .from('profiles').select('plan').eq('id', user.id).single()
  const plan = (profile?.plan ?? 'free') as string
  if (plan === 'free') return { error: 'Scheduled scans require Pro or Agency' }

  const nextRun = new Date(Date.now() + CADENCE_MS[cadence]).toISOString()

  const { error } = await supabase
    .from('scheduled_scans')
    .insert({ user_id: user.id, url, cadence, next_run_at: nextRun, active: true })

  if (error) return { error: error.message }
  revalidatePath('/dashboard/scheduled')
  return { success: true }
}

export async function toggleSchedule(fd: FormData): Promise<void> {
  const id = fd.get('id') as string
  const active = fd.get('active') === 'true'
  if (!id) return

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('scheduled_scans')
    .update({ active: !active })
    .eq('id', id)
    .eq('user_id', user.id)

  revalidatePath('/dashboard/scheduled')
}

export async function deleteSchedule(fd: FormData): Promise<void> {
  const id = fd.get('id') as string
  if (!id) return
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await supabase.from('scheduled_scans').delete().eq('id', id).eq('user_id', user.id)
  revalidatePath('/dashboard/scheduled')
}

