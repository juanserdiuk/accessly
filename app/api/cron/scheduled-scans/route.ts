import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { runScan } from '@/lib/runScan'
import { notifyAdmin } from '@/lib/email/notifyAdmin'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

const CADENCE_MS: Record<string, number> = {
  hourly:   60 * 60 * 1000,
  every_6h: 6 * 60 * 60 * 1000,
  daily:    24 * 60 * 60 * 1000,
  weekly:   7 * 24 * 60 * 60 * 1000,
}

const REGRESSION_THRESHOLD = 10  // alert if score drops more than this

/**
 * Cron endpoint that runs every due scheduled scan, persists the result,
 * advances next_run_at by the cadence, and notifies admin on regressions.
 *
 * Triggered by Vercel Cron (vercel.json) or any external scheduler.
 * Authenticated via the CRON_SECRET env var.
 *
 * GET /api/cron/scheduled-scans
 *   Authorization: Bearer <CRON_SECRET>
 */
export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization') ?? ''
  const expected = process.env.CRON_SECRET ?? process.env.CICD_API_KEY
  if (!expected) {
    return NextResponse.json({ error: 'Cron secret not configured' }, { status: 500 })
  }
  if (auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()

  // Pull all active schedules that are due. Limit to 25 per invocation so a
  // single run can finish inside the 60s lambda budget.
  const now = new Date()
  const { data: due, error: dueErr } = await admin
    .from('scheduled_scans')
    .select('id, user_id, url, cadence, last_score')
    .lte('next_run_at', now.toISOString())
    .eq('active', true)
    .limit(25)

  if (dueErr) {
    console.error('[cron/scheduled-scans] fetch due failed:', dueErr.message)
    return NextResponse.json({ error: dueErr.message }, { status: 500 })
  }

  const summary = { processed: 0, succeeded: 0, failed: 0, regressed: 0 }

  for (const row of due ?? []) {
    summary.processed++
    let result
    let status: 'success' | 'failed' = 'success'

    try {
      result = await runScan(row.url)
    } catch (err: any) {
      console.error(`[cron] scan failed for ${row.url}:`, err?.message)
      status = 'failed'
      summary.failed++
    }

    const nextRun = new Date(Date.now() + (CADENCE_MS[row.cadence] ?? CADENCE_MS.daily)).toISOString()

    await admin.from('scheduled_scans').update({
      last_run_at: new Date().toISOString(),
      last_score: result?.score ?? null,
      last_status: status,
      next_run_at: nextRun,
    }).eq('id', row.id)

    if (status === 'success' && result) {
      summary.succeeded++

      // Persist to scans table for the user's history
      await admin.from('scans').insert({
        user_id: row.user_id,
        url: row.url,
        score: result.score,
        errors: result.errors,
        warnings: result.warnings,
        passes: result.passes,
        violations: result.violations,
      })

      // Regression alert: score dropped > REGRESSION_THRESHOLD pts since
      // last run. Best-effort admin email — never throws.
      if (
        row.last_score !== null &&
        result.score < row.last_score - REGRESSION_THRESHOLD
      ) {
        summary.regressed++
        notifyAdmin({
          subject: `[Accessly] ⚠️ Regression: ${row.url}`,
          heading: `Accessibility score dropped ${row.last_score - result.score} points`,
          rows: [
            { label: 'URL', value: row.url },
            { label: 'Previous score', value: String(row.last_score) },
            { label: 'New score', value: String(result.score) },
            { label: 'Errors', value: String(result.errors) },
            { label: 'Warnings', value: String(result.warnings) },
            { label: 'Cadence', value: row.cadence },
            { label: 'When', value: new Date().toLocaleString() },
          ],
        }).catch(() => {})
      }
    }
  }

  return NextResponse.json({ ok: true, ...summary })
}
