import { NextRequest, NextResponse } from 'next/server'
import puppeteer from 'puppeteer-core'
import chromium from '@sparticuz/chromium-min'
import { createClient } from '@/lib/supabase/server'

export const maxDuration = 30

async function getBrowser() {
  const isDev = process.env.NODE_ENV === 'development'

  if (isDev) {
    const { executablePath } = await import('puppeteer')
    return puppeteer.launch({
      executablePath: await executablePath(),
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })
  }

  return puppeteer.launch({
    executablePath: await chromium.executablePath(),
    headless: true,
    args: chromium.args,
  })
}

export async function POST(req: NextRequest) {
  const { url } = await req.json()

  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 })
  }

  let browser
  try {
    browser = await getBrowser()

    const page = await browser.newPage()
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 })

    await page.addScriptTag({
      url: 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.9.1/axe.min.js',
    })

    const results = await page.evaluate(async () => {
      // @ts-ignore
      return await axe.run()
    })

    const violations = results.violations.map((v: any) => ({
      id: v.id,
      impact: v.impact,
      description: v.description,
      help: v.help,
      helpUrl: v.helpUrl,
      wcag: v.tags.filter((t: string) => t.startsWith('wcag')).join(', '),
      nodes: v.nodes.map((n: any) => ({
        html: n.html,
        target: n.target?.[0] ?? null,
        failureSummary: n.failureSummary ?? null,
        impact: n.impact ?? null,
      })),
    }))

    const passes = results.passes.length
    const errors = violations.filter((v: any) => v.impact === 'critical' || v.impact === 'serious').length
    const warnings = violations.filter((v: any) => v.impact === 'moderate' || v.impact === 'minor').length
    const score = Math.max(0, Math.round(100 - errors * 8 - warnings * 3))

    // Persist for authenticated users (non-fatal if it fails)
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('scans').insert({ user_id: user.id, url, score, errors, warnings, passes, violations })
      }
    } catch {
      // ignore — scan result is still returned
    }

    return NextResponse.json({ violations, passes, errors, warnings, score })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Scan failed' }, { status: 500 })
  } finally {
    if (browser) await browser.close()
  }
}
