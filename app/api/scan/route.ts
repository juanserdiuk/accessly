import { NextRequest, NextResponse } from 'next/server'
import puppeteer from 'puppeteer'

export async function POST(req: NextRequest) {
  const { url } = await req.json()

  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 })
  }

  let browser
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })

    const page = await browser.newPage()
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 })

    // Inject axe-core
    await page.addScriptTag({
      url: 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.9.1/axe.min.js',
    })

    // Run the audit
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
      nodes: v.nodes.length,
    }))

    const passes = results.passes.length
    const errors = violations.filter((v: any) => v.impact === 'critical' || v.impact === 'serious').length
    const warnings = violations.filter((v: any) => v.impact === 'moderate' || v.impact === 'minor').length
    const score = Math.max(0, Math.round(100 - errors * 8 - warnings * 3))

    return NextResponse.json({ violations, passes, errors, warnings, score })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Scan failed' }, { status: 500 })
  } finally {
    if (browser) await browser.close()
  }
}