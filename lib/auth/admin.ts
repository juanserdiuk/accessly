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
