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
    const msg: string = err?.message ?? 'Scan failed'
    const isBrowserError =
      msg.includes('Browser binary') ||
      msg.includes('executablePath') ||
      msg.includes('chromium') ||
      msg.includes('Failed to launch')
    return NextResponse.json(
      {
        error: isBrowserError
          ? 'The scanner is temporarily unavailable. Please try again in a moment.'
          : msg,
      },
      { status: 500 }
    )
  }
}
