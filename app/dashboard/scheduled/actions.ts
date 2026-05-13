'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type ActionResult = { error?: string; success?: boolean }

type Cadence = 'hourly' | 'every_6h' | 'daily' | 'weekly'
const CADENCE_LABELS: Record<Cadence, string> = {
  hourly: 'every hour',
  every_6h: 'every 6 hours',
  daily: 'daily',
  weekly: 'weekly',
}
const CADENCE_MS: Record<Cadence, number> = {
  hourly:   60 * 60 * 1000,
  every_6h: 6 * 60 * 60 * 1000,
  daily:    24 * 60 * 60 * 1000,
  weekly:   7 * 24 * 60 * 60 * 1000,
}

function isValidCadence(c: string): c is Cadence {
  return c === 'hourly' || c === 'every_6h' || c === 'daily' || c === 'weekly'
}

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

export { CADENCE_LABELS, CADENCE_MS }
