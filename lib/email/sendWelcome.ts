import { Resend } from 'resend'

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://accessly.us').replace(/\/$/, '')
const EMAIL_FROM = process.env.EMAIL_FROM ?? 'Accessly <onboarding@resend.dev>'

function esc(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export async function sendWelcomeEmail(to: string, firstName: string): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[sendWelcomeEmail] RESEND_API_KEY not set — skipping')
    return
  }

  const name = firstName.trim()
  const safeName = esc(name)
  const dashboardUrl = `${SITE_URL}/dashboard`

  const heading = safeName
    ? `Welcome to Accessly,<br>${safeName}!`
    : 'Welcome to Accessly!'

  const subject = name ? `Welcome to Accessly, ${name}!` : 'Welcome to Accessly!'

  const resend = new Resend(process.env.RESEND_API_KEY)
  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    to,
    subject,
    html: buildHtml(heading, dashboardUrl),
  })

  if (error) throw new Error(error.message)
}

function buildHtml(heading: string, dashboardUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Welcome to Accessly</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f1f5f9;padding:48px 16px">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%">

  <!-- ── HEADER ── -->
  <tr><td style="background:#0f172a;border-radius:16px 16px 0 0;padding:28px 40px">
    <table cellpadding="0" cellspacing="0" border="0"><tr>
      <td style="width:38px;height:38px;background:#34d399;border-radius:10px;text-align:center;vertical-align:middle">
        <table cellpadding="0" cellspacing="0" border="0" width="38" height="38"><tr>
          <td align="center" valign="middle" style="color:#0f172a;font-size:18px;font-weight:900;font-family:Georgia,'Times New Roman',serif;line-height:1">A</td>
        </tr></table>
      </td>
      <td style="padding-left:11px;vertical-align:middle">
        <span style="color:#ffffff;font-size:20px;font-weight:700;font-family:Georgia,'Times New Roman',serif;letter-spacing:-.02em">Accessly</span>
      </td>
      <td style="padding-left:16px;vertical-align:middle">
        <table cellpadding="0" cellspacing="0" border="0"><tr>
          <td style="background:#34d399;border-radius:20px;padding:3px 10px">
            <span style="color:#0f172a;font-size:11px;font-weight:700;letter-spacing:.04em;text-transform:uppercase">New account</span>
          </td>
        </tr></table>
      </td>
    </tr></table>
  </td></tr>

  <!-- ── WELCOME COPY ── -->
  <tr><td style="background:#ffffff;padding:44px 40px 0">
    <h1 style="margin:0 0 16px;font-size:32px;font-weight:800;color:#0f172a;font-family:Georgia,'Times New Roman',serif;line-height:1.15;letter-spacing:-.025em">
      ${heading}
    </h1>
    <p style="margin:0;font-size:15px;color:#64748b;line-height:1.75">
      Your account is live and ready to go. Here&rsquo;s everything you can do right now to start building more accessible, WCAG-compliant experiences.
    </p>
  </td></tr>

  <!-- ── SECTION LABEL ── -->
  <tr><td style="background:#ffffff;padding:28px 40px 12px">
    <p style="margin:0;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#94a3b8">What you can do</p>
  </td></tr>

  <!-- ── FEATURE CARDS ── -->
  <tr><td style="background:#ffffff;padding:0 40px">

    <!-- Card 1 — Scan URL -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:10px">
    <tr><td style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:18px 20px">
      <table cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
        <td style="width:46px;vertical-align:top;padding-right:15px">
          <table cellpadding="0" cellspacing="0" border="0"><tr>
            <td style="width:46px;height:46px;background:#ecfdf5;border:1px solid #d1fae5;border-radius:11px;text-align:center;vertical-align:middle;font-size:22px">
              &#128269;
            </td>
          </tr></table>
        </td>
        <td style="vertical-align:top">
          <p style="margin:0 0 5px;font-size:14px;font-weight:700;color:#0f172a;letter-spacing:-.01em">Scan any URL</p>
          <p style="margin:0;font-size:13px;color:#64748b;line-height:1.6">Paste any public URL and get a full WCAG 2.2 A &amp; AA report — broken HTML, CSS selectors, and step-by-step fix instructions per element.</p>
        </td>
      </tr></table>
    </td></tr>
    </table>

    <!-- Card 2 — Upload document -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:10px">
    <tr><td style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:18px 20px">
      <table cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
        <td style="width:46px;vertical-align:top;padding-right:15px">
          <table cellpadding="0" cellspacing="0" border="0"><tr>
            <td style="width:46px;height:46px;background:#eff6ff;border:1px solid #dbeafe;border-radius:11px;text-align:center;vertical-align:middle;font-size:22px">
              &#128196;
            </td>
          </tr></table>
        </td>
        <td style="vertical-align:top">
          <p style="margin:0 0 5px;font-size:14px;font-weight:700;color:#0f172a;letter-spacing:-.01em">Upload a document</p>
          <p style="margin:0;font-size:13px;color:#64748b;line-height:1.6">Check PDFs and Word files for missing alt text, reading-order issues, document titles, language tags, table headers, and more.</p>
        </td>
      </tr></table>
    </td></tr>
    </table>

    <!-- Card 3 — Talk to expert -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr><td style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:18px 20px">
      <table cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
        <td style="width:46px;vertical-align:top;padding-right:15px">
          <table cellpadding="0" cellspacing="0" border="0"><tr>
            <td style="width:46px;height:46px;background:#fdf4ff;border:1px solid #f3e8ff;border-radius:11px;text-align:center;vertical-align:middle;font-size:22px">
              &#128172;
            </td>
          </tr></table>
        </td>
        <td style="vertical-align:top">
          <p style="margin:0 0 5px;font-size:14px;font-weight:700;color:#0f172a;letter-spacing:-.01em">Talk to an expert</p>
          <p style="margin:0;font-size:13px;color:#64748b;line-height:1.6">Got a WCAG compliance question? Our accessibility experts are here to help you navigate requirements and remediate issues fast.</p>
        </td>
      </tr></table>
    </td></tr>
    </table>

  </td></tr>

  <!-- ── CTA ── -->
  <tr><td style="background:#ffffff;padding:36px 40px 44px;text-align:center">
    <table cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto">
    <tr><td style="background:#34d399;border-radius:13px;text-align:center;box-shadow:0 4px 14px rgba(52,211,153,.35)">
      <a href="${dashboardUrl}"
         style="display:inline-block;padding:17px 52px;font-size:16px;font-weight:700;color:#0f172a;text-decoration:none;letter-spacing:-.01em;white-space:nowrap;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">
        Go to your dashboard &rarr;
      </a>
    </td></tr>
    </table>
    <p style="margin:16px 0 0;font-size:12px;color:#94a3b8">
      Button not working? <a href="${dashboardUrl}" style="color:#64748b;word-break:break-all">${dashboardUrl}</a>
    </p>
  </td></tr>

  <!-- ── WHAT'S NEXT STRIP ── -->
  <tr><td style="background:#0f172a;padding:24px 40px">
    <p style="margin:0 0 14px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#34d399">Quick-start checklist</p>
    <table cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
        <td style="padding:5px 0;font-size:13px;color:#cbd5e1;line-height:1.5">
          <span style="color:#34d399;margin-right:8px">&#10003;</span> Scan your homepage for WCAG issues
        </td>
      </tr>
      <tr>
        <td style="padding:5px 0;font-size:13px;color:#cbd5e1;line-height:1.5">
          <span style="color:#34d399;margin-right:8px">&#10003;</span> Upload your most-used PDF or doc
        </td>
      </tr>
      <tr>
        <td style="padding:5px 0;font-size:13px;color:#cbd5e1;line-height:1.5">
          <span style="color:#34d399;margin-right:8px">&#10003;</span> Invite your team (Settings &rarr; Team)
        </td>
      </tr>
      <tr>
        <td style="padding:5px 0;font-size:13px;color:#cbd5e1;line-height:1.5">
          <span style="color:#34d399;margin-right:8px">&#10003;</span> Talk to an expert if you need guidance
        </td>
      </tr>
    </table>
  </td></tr>

  <!-- ── FOOTER ── -->
  <tr><td style="background:#f8fafc;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 16px 16px;padding:24px 40px;text-align:center">
    <p style="margin:0 0 6px;font-size:12px;color:#94a3b8;line-height:1.6">
      You&rsquo;re receiving this because you created an Accessly account.
    </p>
    <p style="margin:0;font-size:12px;color:#94a3b8">
      &copy; 2026 Accessly &nbsp;&middot;&nbsp;
      <a href="${SITE_URL}/privacy" style="color:#94a3b8;text-decoration:underline">Privacy</a>
      &nbsp;&middot;&nbsp;
      <a href="${SITE_URL}/terms" style="color:#94a3b8;text-decoration:underline">Terms</a>
    </p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`
}
