import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

export async function POST(req: NextRequest) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[send-scan-link] RESEND_API_KEY not set')
    return NextResponse.json({ error: 'Email service not configured' }, { status: 500 })
  }
  const resend = new Resend(process.env.RESEND_API_KEY)

  let email: string, url: string
  try {
    const body = await req.json()
    email = (body.email ?? '').trim()
    url   = (body.url   ?? '').trim()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
  }
  if (!url) {
    return NextResponse.json({ error: 'URL required' }, { status: 400 })
  }

  let hostname = url
  try { hostname = new URL(url).hostname } catch { /* use raw url */ }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://accessly.io'
  const scanLink = `${siteUrl}/?url=${encodeURIComponent(url)}`

  try {
    await resend.emails.send({
      from: 'Accessly <onboarding@resend.dev>',
      to: email,
      subject: `Your accessibility scan for ${hostname}`,
      html: `
        <div style="font-family:ui-sans-serif,system-ui,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#f8fafc;">
          <div style="background:#0f172a;border-radius:16px;padding:20px 24px;margin-bottom:24px;display:flex;align-items:center;gap:12px;">
            <div style="width:36px;height:36px;background:#34d399;border-radius:10px;display:inline-flex;align-items:center;justify-content:center;font-weight:700;font-size:16px;color:#0f172a;line-height:36px;text-align:center;">A</div>
            <span style="font-size:18px;font-weight:600;color:white;vertical-align:middle;">Accessly</span>
          </div>
          <div style="background:white;border-radius:16px;padding:28px 28px 24px;border:1px solid #e2e8f0;">
            <h2 style="margin:0 0 8px;font-size:22px;color:#0f172a;font-weight:700;">Your scan link is ready</h2>
            <p style="margin:0 0 6px;color:#64748b;font-size:15px;">Open on desktop to see the full accessibility report for:</p>
            <p style="margin:0 0 24px;color:#0f172a;font-size:14px;font-weight:600;word-break:break-all;">${hostname}</p>
            <a href="${scanLink}" style="display:block;background:#34d399;color:#0f172a;font-weight:700;text-align:center;padding:15px 24px;border-radius:12px;text-decoration:none;font-size:15px;">Open full report →</a>
            <p style="margin:20px 0 0;color:#94a3b8;font-size:12px;word-break:break-all;">Or copy: ${scanLink}</p>
          </div>
          <p style="text-align:center;color:#94a3b8;font-size:11px;margin-top:20px;">You received this because you requested a scan link from Accessly.</p>
        </div>
      `,
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[send-scan-link]', err)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}
