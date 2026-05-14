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

export type BulkResult = {
  error?: string
  added?: number
  duplicates?: number
  invalid?: number
  invalidUrls?: string[]
}

/**
 * Paste a newline / comma / space separated list of URLs and insert them all
 * in a single round-trip. Per-URL validation, dedupe of duplicates already
 * in the user's watchlist, and a summary report back to the UI.
 */
export async function addSitesBulk(
  _prev: BulkResult | null,
  fd: FormData,
): Promise<BulkResult> {
  const raw = (fd.get('urls') as string ?? '').trim()
  if (!raw) return { error: 'Paste at least one URL first' }

  // Split on newlines, commas, semicolons, or runs of whitespace.
  const tokens = raw
    .split(/[\s,;]+/)
    .map(t => t.trim())
    .filter(Boolean)

  if (tokens.length === 0) return { error: 'Paste at least one URL first' }
  if (tokens.length > 100) return { error: 'Cap is 100 URLs per paste — try splitting up' }

  const valid: string[] = []
  const invalid: string[] = []
  for (const t of tokens) {
    const withProto = /^https?:\/\//i.test(t) ? t : 'https://' + t
    try {
      const u = new URL(withProto)
      if (u.protocol !== 'http:' && u.protocol !== 'https:') {
        invalid.push(t)
      } else {
        valid.push(withProto)
      }
    } catch {
      invalid.push(t)
    }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // De-dupe within the batch
  const unique = Array.from(new Set(valid))

  // Insert one at a time so we can count duplicate-conflict cleanly (Postgres
  // returns the 23505 unique-violation per row). Could be a single upsert but
  // we want the count.
  let added = 0
  let duplicates = 0
  for (const url of unique) {
    const { error } = await supabase.from('sites').insert({ user_id: user.id, url })
    if (!error) {
      added++
    } else if (error.code === '23505') {
      duplicates++
    } else {
      invalid.push(url)
    }
  }

  revalidatePath('/dashboard/monitor')
  return {
    added,
    duplicates,
    invalid: invalid.length,
    invalidUrls: invalid.slice(0, 5),
  }
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
