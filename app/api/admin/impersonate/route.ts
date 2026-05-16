import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdminEmail } from '@/lib/auth/admin'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Admin-only QA impersonation. Generates a one-time magic-link URL
 * that signs the user in as a pre-canned test account for a given
 * plan tier. Lets the founder (or a QA contractor) sweep through the
 * gated views weekly without keeping test passwords around or paying
 * for real subscriptions.
 *
 * THIS ENDPOINT IS DANGEROUS. If reachable by a non-admin it would
 * let any user log in as any other user. The isAdminEmail() gate +
 * email_confirmed_at check is the only thing standing between this
 * route and full account takeover.
 *
 * --- One-time setup (DONE BY JUAN IN SUPABASE DASHBOARD) ---
 * Test users are created manually in Supabase → Authentication → Users.
 * We deliberately do NOT auto-create them from this endpoint, because
 * Supabase Auth's `admin.createUser` returns `unexpected_failure` in
 * this project (likely a project-level Auth hook or schema constraint
 * we can't introspect from app code). Pre-creating them once also
 * means we can pre-fill plan/profile state and have stable QA fixtures.
 *
 * Required accounts (email_confirmed=true, any password):
 *   - qa+free@accessly.us       → profiles.plan='free'
 *   - qa+pps@accessly.us        → profiles.plan='pps',    scan_count=25
 *   - qa+pro@accessly.us        → profiles.plan='pro'
 *   - qa+agency@accessly.us     → profiles.plan='agency'
 *
 * Flow:
 *   1. POST /api/admin/impersonate { tier: 'free' | 'pps' | 'pro' | 'agency' }
 *   2. Server verifies admin, looks up the test user, generates a
 *      magic link via Supabase admin (URL returned directly, no email
 *      sent), and replies with the URL.
 *   3. If the test user doesn't exist, returns a 404 with instructions
 *      on how to create it manually.
 *   4. Caller opens that URL in an incognito window to sweep that
 *      tier's experience without disturbing the admin session.
 */

const TIER_CONFIG: Record<
  string,
  { dbPlan: string; email: string; label: string; description: string; seedCredits?: number }
> = {
  free: {
    dbPlan: 'free',
    email: 'qa+free@accessly.us',
    label: 'Free',
    description:
      'Free tier — 3 scans/mo, basic dashboard, no monitoring. Tests the upgrade nudges and free-tier ceiling.',
  },
  pps: {
    dbPlan: 'pps',
    email: 'qa+pps@accessly.us',
    label: 'Pay-per-scan',
    description:
      'PPS tier — pre-paid scan credits, no monthly subscription. Tests pack-purchased UX, credit ledger, and the topup CTA.',
    seedCredits: 25,
  },
  pro: {
    dbPlan: 'pro',
    email: 'qa+pro@accessly.us',
    label: 'Pro ($29/mo)',
    description:
      'Mid-paid tier. Unlimited scans, scheduled monitoring, regression alerts, 3 team seats, 10 monitored sites. Most-common paid experience.',
  },
  agency: {
    dbPlan: 'agency',
    email: 'qa+agency@accessly.us',
    label: 'Agency ($99/mo)',
    description:
      'Top tier. Unlimited everything, white-label PDFs, client portfolios, priority support. Tests the full agency feature surface.',
  },
}

export const KNOWN_TIERS = Object.keys(TIER_CONFIG)
export const TIER_DESCRIPTIONS = TIER_CONFIG

export async function POST(req: NextRequest) {
  // --- Auth gate ---
  const userClient = await createClient()
  const { data: { user } } = await userClient.auth.getUser()

  if (!user || !user.email_confirmed_at || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // --- Parse tier ---
  let tier: string
  try {
    const body = await req.json()
    tier = body?.tier
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }
  const config = TIER_CONFIG[tier]
  if (!config) {
    return NextResponse.json(
      { error: `Unknown tier "${tier}". Expected one of: ${KNOWN_TIERS.join(', ')}` },
      { status: 400 },
    )
  }

  // --- Look up test user (must exist; we no longer auto-create) ---
  // Paginated listUsers — Supabase caps at 1000 per page, and an org
  // running at scale may already exceed that. Walk pages until we
  // either find the test user or hit a non-full page.
  const admin = createAdminClient()
  let testUserId: string | null = null
  let listUsersError: { message: string; status?: number; code?: string } | null = null

  try {
    let page = 1
    while (true) {
      const { data, error: listErr } = await admin.auth.admin.listUsers({
        page,
        perPage: 1000,
      })
      if (listErr) {
        listUsersError = {
          message: listErr.message,
          status: (listErr as { status?: number }).status,
          code: (listErr as { code?: string }).code,
        }
        console.error('[admin.impersonate] list_users_failed', JSON.stringify({
          ...listUsersError,
          page,
          tier,
        }))
        throw new Error(`listUsers failed (page ${page}): ${listErr.message}`)
      }
      const hit = data?.users?.find(
        u => u.email?.toLowerCase() === config.email.toLowerCase(),
      )
      if (hit) {
        testUserId = hit.id
        break
      }
      if (!data?.users || data.users.length < 1000) break  // last page
      page++
      if (page > 50) break  // safety stop at 50,000 users
    }
  } catch (err) {
    return NextResponse.json(
      {
        error: `Could not look up test users: ${(err as Error)?.message ?? 'unknown'}`,
        supabaseError: listUsersError ?? (err as Error)?.message,
      },
      { status: 500 },
    )
  }

  if (!testUserId) {
    // Test user hasn't been created yet. Surface a clear, actionable
    // error rather than trying to auto-create — Supabase has been
    // returning `unexpected_failure` for admin.createUser in this
    // project, and the manual-setup approach is more reliable anyway.
    return NextResponse.json(
      {
        error: `Test user ${config.email} not found. Create it once in Supabase → Authentication → Users, then come back.`,
        setupInstructions: {
          email: config.email,
          steps: [
            `Open Supabase dashboard → Authentication → Users → Add user`,
            `Email: ${config.email}`,
            `Password: anything you want (you won't use it — we sign in via magic link)`,
            `Tick "Auto-confirm email"`,
            `Save, then refresh this page and click the button again.`,
          ],
          targetPlan: config.dbPlan,
        },
      },
      { status: 404 },
    )
  }

  // --- Ensure profile + plan is set (idempotent) ---
  // Even if Juan didn't manually set plan in the dashboard, this
  // upsert pins it on every impersonate so QA always sees the
  // intended tier.
  await admin
    .from('profiles')
    .upsert(
      {
        id: testUserId,
        plan: config.dbPlan,
        first_name: 'QA',
        last_name: tier.charAt(0).toUpperCase() + tier.slice(1),
        ...(config.seedCredits !== undefined ? { scan_count: config.seedCredits } : {}),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' },
    )

  // --- Seed a single scan so the dashboard isn't bare ---
  try {
    const { count } = await admin
      .from('scans')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', testUserId)
    if ((count ?? 0) === 0) {
      await admin.from('scans').insert({
        user_id: testUserId,
        url: 'https://example.com',
        score: 73,
        errors: 4,
        warnings: 7,
        passes: 41,
        violations: [],
      })
    }
  } catch (err) {
    console.warn('[admin.impersonate] seed_skipped:', (err as Error)?.message)
  }

  // --- Generate one-time magic link (with recovery-link fallback) ---
  // Both `magiclink` and `recovery` link types sign the user in when
  // followed. If `magiclink` returns unexpected_failure (some
  // project-level Supabase Auth hook misfires for this type), we fall
  // back to `recovery` — it traverses a different Supabase code path
  // and has worked in this project in the past for password resets.
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://accessly.us').replace(/\/$/, '')
  let actionLink: string | null = null
  const linkErrors: Array<{ type: string; message: string; status?: number; code?: string }> = []

  for (const linkType of ['magiclink', 'recovery'] as const) {
    try {
      const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
        type: linkType,
        email: config.email,
        options: {
          redirectTo: `${siteUrl}/dashboard?qa=${tier}`,
        },
      })
      if (linkErr) {
        linkErrors.push({
          type: linkType,
          message: linkErr.message,
          status: (linkErr as { status?: number }).status,
          code: (linkErr as { code?: string }).code,
        })
        console.error(`[admin.impersonate] generate_link_failed (${linkType})`, JSON.stringify(linkErrors[linkErrors.length - 1]))
        continue
      }
      if (linkData?.properties?.action_link) {
        actionLink = linkData.properties.action_link
        break
      }
      linkErrors.push({ type: linkType, message: 'no action_link in response' })
    } catch (err) {
      linkErrors.push({
        type: linkType,
        message: (err as Error)?.message ?? 'unknown exception',
      })
      console.error(`[admin.impersonate] generate_link_threw (${linkType}):`, err)
    }
  }

  if (!actionLink) {
    return NextResponse.json(
      {
        error: 'Could not generate sign-in link. Both magiclink and recovery failed — see supabaseError for details.',
        supabaseError: linkErrors,
      },
      { status: 500 },
    )
  }

  console.log('[admin.impersonate] issued', {
    admin: user.email,
    tier,
    testUser: config.email,
  })

  return NextResponse.json({
    url: actionLink,
    email: config.email,
    plan: config.dbPlan,
    tier,
    label: config.label,
  })
}
