import { NextRequest, NextResponse } from 'next/server'
import { runScan } from '@/lib/runScan'
import { createClient } from '@/lib/supabase/server'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  const { url } = await req.json()
  if (!url) return NextResponse.json({ error: 'URL is required' }, { status: 400 })

  try {
    const result = await runScan(url)

    // Persist for authenticated users (non-fatal if it fails)
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('scans').insert({
          user_id: user.id, url,
          score:      result.score,
          errors:     result.errors,
          warnings:   result.warnings,
          passes:     result.passes,
          violations: result.violations,
        })
      }
    } catch {
      // ignore — scan result is still returned
    }

    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Scan failed' }, { status: 500 })
  }
}
