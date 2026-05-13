import { Resend } from 'resend'

const EMAIL_FROM = process.env.EMAIL_FROM ?? 'Accessly <onboarding@resend.dev>'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL?.trim()

function esc(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

interface AdminNotifyOptions {
  subject: string
  heading: string
  rows: Array<{ label: string; value: string }>
}

/**
 * Fire-and-forget admin notification email. Logs and returns on any
 * configuration / send failure — never throws, never blocks the caller.
 */
export async function notifyAdmin(opts: AdminNotifyOptions): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[notifyAdmin] RESEND_API_KEY not set — skipping')
    return
  }
  if (!ADMIN_EMAIL) {
    console.warn('[notifyAdmin] ADMIN_EMAIL not set — skipping')
    return
  }

  const rows = opts.rows
    .map(
      r => `
        <tr>
          <td style="padding:10px 0;border-top:1px solid #f1f5f9;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8;vertical-align:top;width:120px">
            ${esc(r.label)}
          </td>
          <td style="padding:10px 0;border-top:1px solid #f1f5f9;font-size:14px;color:#0f172a">
            ${esc(r.value)}
          </td>
        </tr>`,
    )
    .join('')

  const html = `<!DOCTYPE html>
<html lang="en"><body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 16px">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%">
        <tr><td style="background:#0f172a;border-radius:12px 12px 0 0;padding:24px 32px;color:#fff;font-size:14px;font-weight:600">
          Accessly · Admin notification
        </td></tr>
        <tr><td style="background:#ffffff;padding:28px 32px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0">
          <h1 style="margin:0 0 20px;font-size:20px;font-weight:700;color:#0f172a">${esc(opts.heading)}</h1>
          <table width="100%" cellpadding="0" cellspacing="0">${rows}</table>
        </td></tr>
        <tr><td style="background:#f8fafc;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;padding:16px 32px;font-size:12px;color:#94a3b8;text-align:center">
          Automated message from accessly.us
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`

  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: ADMIN_EMAIL,
      subject: opts.subject,
      html,
    })
    if (error) console.error('[notifyAdmin] resend error:', error.message)
  } catch (err) {
    console.error('[notifyAdmin] threw:', err)
  }
}
