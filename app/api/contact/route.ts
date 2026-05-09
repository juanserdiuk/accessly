// Required .env.local var:
//   RESEND_API_KEY   your Resend API key (resend.com)

import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

function esc(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export async function POST(req: NextRequest) {
  let body: Record<string, string>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const name    = (body.name    ?? '').trim()
  const email   = (body.email   ?? '').trim()
  const url     = (body.url     ?? '').trim()
  const message = (body.message ?? '').trim()

  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
  if (!message) return NextResponse.json({ error: 'Message is required' }, { status: 400 })

  if (!process.env.RESEND_API_KEY) {
    console.error('[contact] RESEND_API_KEY not set — message dropped')
    return NextResponse.json({ error: 'Email service not configured' }, { status: 500 })
  }

  const resend = new Resend(process.env.RESEND_API_KEY)

  const n = esc(name)
  const e = esc(email)
  const u = url ? esc(url) : ''
  const m = esc(message).replace(/\n/g, '<br>')

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 16px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">

        <!-- Header -->
        <tr><td style="background:#0f172a;border-radius:12px 12px 0 0;padding:28px 36px">
          <table cellpadding="0" cellspacing="0"><tr>
            <td style="width:36px;height:36px;background:#34d399;border-radius:8px;text-align:center;vertical-align:middle">
              <span style="color:#0f172a;font-size:18px;font-weight:800;line-height:36px">A</span>
            </td>
            <td style="padding-left:12px;color:#ffffff;font-size:18px;font-weight:600;vertical-align:middle">
              Accessly
            </td>
          </tr></table>
        </td></tr>

        <!-- Body -->
        <tr><td style="background:#ffffff;padding:36px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0">
          <p style="margin:0 0 6px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:#64748b">
            New inquiry
          </p>
          <h1 style="margin:0 0 28px;font-size:22px;font-weight:700;color:#0f172a">
            ${n} got in touch
          </h1>

          <!-- Fields -->
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:14px 0;border-top:1px solid #f1f5f9;width:100px;vertical-align:top;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8">
                Name
              </td>
              <td style="padding:14px 0;border-top:1px solid #f1f5f9;font-size:15px;color:#0f172a;font-weight:500">
                ${n}
              </td>
            </tr>
            <tr>
              <td style="padding:14px 0;border-top:1px solid #f1f5f9;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8;vertical-align:top">
                Email
              </td>
              <td style="padding:14px 0;border-top:1px solid #f1f5f9;font-size:15px">
                <a href="mailto:${e}" style="color:#059669;text-decoration:none;font-weight:500">${e}</a>
              </td>
            </tr>
            <tr>
              <td style="padding:14px 0;border-top:1px solid #f1f5f9;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8;vertical-align:top">
                Website
              </td>
              <td style="padding:14px 0;border-top:1px solid #f1f5f9;font-size:15px;color:#0f172a">
                ${u ? `<a href="${u}" style="color:#059669;text-decoration:none;font-weight:500">${u}</a>` : '<span style="color:#94a3b8">Not provided</span>'}
              </td>
            </tr>
            <tr>
              <td style="padding:14px 0;border-top:1px solid #f1f5f9;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8;vertical-align:top">
                Message
              </td>
              <td style="padding:14px 0;border-top:1px solid #f1f5f9;font-size:15px;color:#0f172a;line-height:1.65">
                ${m}
              </td>
            </tr>
          </table>

          <!-- Reply CTA -->
          <table cellpadding="0" cellspacing="0" style="margin-top:32px">
            <tr><td style="background:#0f172a;border-radius:8px;padding:12px 24px">
              <a href="mailto:${e}" style="color:#ffffff;font-size:14px;font-weight:600;text-decoration:none">
                Reply to ${n} →
              </a>
            </td></tr>
          </table>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f8fafc;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;padding:20px 36px;text-align:center">
          <p style="margin:0;font-size:12px;color:#94a3b8">
            Sent via <a href="https://accessly.io" style="color:#64748b;text-decoration:none;font-weight:500">Accessly</a> contact form
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`

  const fromAddress = process.env.EMAIL_FROM ?? 'Accessly <onboarding@resend.dev>'
  const toAddress   = process.env.ADMIN_EMAIL?.trim()
  if (!toAddress) {
    console.error('[contact] ADMIN_EMAIL not set — cannot deliver inquiry')
    return NextResponse.json({ error: 'Email service not configured' }, { status: 500 })
  }

  const { error } = await resend.emails.send({
    from: fromAddress,
    to: toAddress,
    replyTo: email,
    subject: `New Accessly Inquiry: ${name}`,
    html,
  })

  if (error) {
    console.error('[contact] Resend error:', error)
    return NextResponse.json({ error: 'Failed to send message. Please try again.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
