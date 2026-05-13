'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type ActionResult = { error?: string; success?: boolean; id?: string }

async function getAuthedUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return { supabase, user }
}

const COLORS = ['#34d399', '#60a5fa', '#a78bfa', '#f59e0b', '#f43f5e', '#06b6d4']

export async function createPortfolio(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const name = (fd.get('name') as string ?? '').trim()
  if (!name) return { error: 'Portfolio name is required' }
  if (name.length > 80) return { error: 'Name is too long (max 80 chars)' }

  const { supabase, user } = await getAuthedUser()
  if (!user) return { error: 'Not authenticated' }

  // Pick a deterministic color so portfolios don't all look identical
  const { count } = await supabase
    .from('portfolios')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
  const color = COLORS[(count ?? 0) % COLORS.length]

  const { data, error } = await supabase
    .from('portfolios')
    .insert({ user_id: user.id, name, color })
    .select('id')
    .single()

  if (error) return { error: error.message }
  revalidatePath('/dashboard/portfolios')
  return { success: true, id: data.id }
}

export async function renamePortfolio(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const id = fd.get('id') as string
  const name = (fd.get('name') as string ?? '').trim()
  if (!id || !name) return { error: 'Missing fields' }

  const { supabase, user } = await getAuthedUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('portfolios')
    .update({ name })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/portfolios')
  revalidatePath(`/dashboard/portfolios/${id}`)
  return { success: true }
}

export async function deletePortfolio(fd: FormData): Promise<void> {
  const id = fd.get('id') as string
  if (!id) return
  const { supabase, user } = await getAuthedUser()
  if (!user) return
  await supabase.from('portfolios').delete().eq('id', id).eq('user_id', user.id)
  revalidatePath('/dashboard/portfolios')
}

export async function assignSiteToPortfolio(fd: FormData): Promise<void> {
  const siteId = fd.get('siteId') as string
  const portfolioId = (fd.get('portfolioId') as string) || null
  if (!siteId) return

  const { supabase, user } = await getAuthedUser()
  if (!user) return

  await supabase
    .from('sites')
    .update({ portfolio_id: portfolioId })
    .eq('id', siteId)
    .eq('user_id', user.id)

  revalidatePath('/dashboard/portfolios')
  if (portfolioId) revalidatePath(`/dashboard/portfolios/${portfolioId}`)
  revalidatePath('/dashboard/monitor')
}
