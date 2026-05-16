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
 * Flow:
 *   1. POST /api/admin/impersonate { tier: 'free' | 'pps' | 'pro' | 'agency' }
 *   2. Server verifies admin, finds/creates the test user, generates
 *      a magic link via Supabase admin (URL returned directly, no
 *      email sent), and replies with the URL.
 *   3. Caller opens that URL in an incognito window to sweep that
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

  // --- Resolve or create test user ---
  const admin = createAdminClient()
  let testUserId: string | null = null

  try {
    const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
    const existing = list?.users?.find(
      u => u.email?.toLowerCase() === config.email.toLowerCase(),
    )
    testUserId = existing?.id ?? null
  } catch (err) {
    console.error('[admin.impersonate] list_users_failed:', err)
    return NextResponse.json({ error: 'Could not look up test users' }, { status: 500 })
  }

  if (!testUserId) {
    try {
      const randomPassword = crypto.randomUUID() + '-' + crypto.randomUUID()
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email: config.email,
        password: randomPassword,
        email_confirm: true,
        user_metadata: {
          first_name: 'QA',
          last_name: tier.charAt(0).toUpperCase() + tier.slice(1),
          is_qa_test_user: true,
        },
      })
      if (createErr || !created.user) {
        console.error('[admin.impersonate] create_failed:', createErr?.message)
        return NextResponse.json(
          { error: `Could not create test user: ${createErr?.message}` },
          { status: 500 },
        )
      }
      testUserId = created.user.id
    } catch (err) {
      console.error('[admin.impersonate] create_threw:', err)
      return NextResponse.json({ error: 'Could not create test user' }, { status: 500 })
    }
  }

  // --- Ensure profile + plan is set (idempotent) ---
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

  // --- Generate one-time magic link ---
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://accessly.us').replace(/\/$/, '')
  let actionLink: string
  try {
    const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email: config.email,
      options: {
        redirectTo: `${siteUrl}/dashboard?qa=${tier}`,
      },
    })
    if (linkErr || !linkData?.properties?.action_link) {
      console.error('[admin.impersonate] generate_link_failed:', linkErr?.message)
      return NextResponse.json({ error: 'Could not generate magic link' }, { status: 500 })
    }
    actionLink = linkData.properties.action_link
  } catch (err) {
    console.error('[admin.impersonate] generate_link_threw:', err)
    return NextResponse.json({ error: 'Could not generate magic link' }, { status: 500 })
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
