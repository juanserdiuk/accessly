import puppeteer from 'puppeteer-core'
import chromium from '@sparticuz/chromium'

export type ScanNode = {
  html: string
  target: string | null
  failureSummary: string | null
  impact: string | null
}

export type ScanViolation = {
  id: string
  impact: string
  description: string
  help: string
  helpUrl: string
  wcag: string
  nodes: ScanNode[]
}

export type ScanResult = {
  violations: ScanViolation[]
  passes: number
  errors: number
  warnings: number
  score: number
}

const LAUNCH_ARGS = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage',
  '--disable-gpu',
  '--single-process',
  '--no-zygote',
]

async function resolveExecutablePath(): Promise<string> {
  // 1. Explicit env var override — set PUPPETEER_EXECUTABLE_PATH in Vercel
  //    settings to use any pre-installed Chrome binary.
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    console.log('[runScan] using PUPPETEER_EXECUTABLE_PATH:', process.env.PUPPETEER_EXECUTABLE_PATH)
    return process.env.PUPPETEER_EXECUTABLE_PATH
  }

  // 2. @sparticuz/chromium — binary is bundled in node_modules, no download needed.
  try {
    chromium.setGraphicsMode = false
    const path = await chromium.executablePath()
    console.log('[runScan] chromium resolved:', path)
    return path
  } catch (err) {
    console.error('[runScan] chromium.executablePath() failed:', err)
    throw new Error(
      'Browser binary unavailable. Set PUPPETEER_EXECUTABLE_PATH in your Vercel environment variables.'
    )
  }
}

async function getBrowser() {
  if (process.env.NODE_ENV === 'development') {
    const { executablePath } = await import('puppeteer')
    return puppeteer.launch({
      executablePath: await executablePath(),
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })
  }

  const executablePath = await resolveExecutablePath()

  return puppeteer.launch({
    executablePath,
    headless: true,
    args: chromium.args,
    timeout: 30000,
  })
}

export async function runScan(url: string): Promise<ScanResult> {
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

    const violations: ScanViolation[] = results.violations.map((v: any) => ({
      id: v.id,
      impact: v.impact,
      description: v.description,
      help: v.help,
      helpUrl: v.helpUrl,
      wcag: v.tags.filter((t: string) => t.startsWith('wcag')).join(', '),
      nodes: v.nodes.map((n: any) => ({
        html:           n.html,
        target:         n.target?.[0] ?? null,
        failureSummary: n.failureSummary ?? null,
        impact:         n.impact ?? null,
      })),
    }))

    const passes   = results.passes.length
    const errors   = violations.filter(v => v.impact === 'critical' || v.impact === 'serious').length
    const warnings = violations.filter(v => v.impact === 'moderate' || v.impact === 'minor').length
    const score    = Math.max(0, Math.round(100 - errors * 8 - warnings * 3))

    return { violations, passes, errors, warnings, score }
  } finally {
    if (browser) await browser.close()
  }
}
