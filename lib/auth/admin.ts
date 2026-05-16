import 'server-only'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { User } from '@supabase/supabase-js'

/**
 * Centralized admin email check.
 *
 * ADMIN_EMAIL   = the canonical, single address used for display, contact-form
 *                 recipient, notifyAdmin, etc. Whatever the brand uses publicly
 *                 (e.g. contact@accessly.us).
 *
 * ADMIN_EMAILS  = optional CSV of *additional* logins that should also pass the
 *                 admin gate (e.g. a personal email kept as a backup admin
 *                 during a transition). Comma-separated, whitespace-tolerant.
 *
 * NEXT_PUBLIC_ADMIN_EMAIL is honored for backward compatibility with older
 * code paths that needed an admin email visible client-side. It's treated
 * identically to ADMIN_EMAIL.
 *
 * Comparison is case-insensitive and trims whitespace on both sides.
 */

function adminEmailSet(): Set<string> {
  const primary = (process.env.ADMIN_EMAIL ?? process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? '')
    .trim()
    .toLowerCase()

  const extras = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map(s => s.trim().toLowerCase())
    .filter(Boolean)

  const set = new Set<string>(extras)
  if (primary) set.add(primary)
  return set
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return adminEmailSet().has(email.trim().toLowerCase())
}

/**
 * Synchronous admin guard for server components.
 *
 * MUST be called as the FIRST awaited statement in any admin server
 * component (page.tsx) — BEFORE any data fetching. Reason: Next.js App
 * Router renders layouts and pages in parallel for performance. A
 * layout-level `redirect()` correctly bounces the user, but the
 * page-level data fetches start in parallel and complete before the
 * redirect is finalized. Their result gets serialized into the RSC
 * payload that ships with the redirect response, leaking sensitive
 * data (customer emails, plan info, etc.) to anonymous clients.
 *
 * Calling `await requireAdmin()` at the very top of each admin page
 * forces serial execution: if it redirects, no downstream `await`
 * runs, no Supabase query fires, nothing leaks.
 *
 * Returns the verified admin user — callers can pass it into their
 * own queries without re-fetching from getUser().
 */
export async function requireAdmin(): Promise<User> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  if (!user.email_confirmed_at) redirect('/auth/verify-pending')
  if (!isAdminEmail(user.email)) redirect('/dashboard')
  return user
}
