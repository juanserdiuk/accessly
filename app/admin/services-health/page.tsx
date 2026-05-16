import { TIER_DESCRIPTIONS } from '@/app/api/admin/impersonate/route'
import { requireAdmin } from '@/lib/auth/admin'
import TierCards from './TierCards'

export const dynamic = 'force-dynamic'

/**
 * Services Health — solo-founder QA harness.
 *
 * Lists every plan tier as a card with a "Generate test session"
 * button. Each click calls /api/admin/impersonate, which finds (or
 * creates) a per-tier test account and returns a one-time magic-link
 * URL. The admin opens the URL in an incognito window to sweep that
 * tier's experience without touching their own account.
 *
 * Goal: weekly 5-minute pass through the gated views to catch
 * regressions before customers do. Free → PPS → Pro → Agency, click
 * click click click, look for empty states / broken gates / styling
 * that broke after a deploy.
 */
export default async function ServicesHealthPage() {
  // CRITICAL: TIER_DESCRIPTIONS exposes pre-canned QA emails. Must
  // gate before render. See lib/auth/admin.ts:requireAdmin().
  await requireAdmin()
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
      <div>
        <h1 className="font-serif text-2xl text-slate-900">Services Health</h1>
        <p className="text-sm text-slate-400 mt-0.5 max-w-2xl leading-relaxed">
          Weekly QA harness. Each tier has a pre-canned test account; click
          to generate a one-time magic-link URL and sweep that tier&rsquo;s
          gated views in an incognito window. No passwords, no real Stripe
          charges, no pollution of your admin data.
        </p>
      </div>

      {/* How-to */}
      <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700 mb-2">
          How this works
        </p>
        <ol className="text-sm text-slate-700 leading-relaxed space-y-1.5 list-decimal list-inside">
          <li>Click <strong>Generate test session</strong> for the tier you want to QA.</li>
          <li>A modal pops up with a one-time magic-link URL. <strong>Copy it.</strong></li>
          <li>Open an <strong>incognito / private window</strong> and paste the URL.</li>
          <li>You&rsquo;re signed in as the test user — sweep dashboard, monitor, schedules, settings.</li>
          <li>Close the incognito window when done. Your admin session in this tab is unaffected.</li>
        </ol>
        <p className="text-xs text-slate-500 mt-3 leading-relaxed">
          First click for a tier auto-creates the test account; subsequent clicks reuse it (with seed
          data preserved). Test accounts are tagged with{' '}
          <code className="font-mono text-[10px] bg-white px-1 rounded">is_qa_test_user</code> in
          user_metadata.
        </p>
      </div>

      <TierCards
        tiers={Object.entries(TIER_DESCRIPTIONS).map(([slug, t]) => ({
          slug,
          dbPlan: t.dbPlan,
          email: t.email,
          label: t.label,
          description: t.description,
        }))}
      />
    </div>
  )
}
