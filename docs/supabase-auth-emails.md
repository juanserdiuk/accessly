# Supabase Auth email templates — Accessly

Default Supabase Auth emails are unbranded ("Confirm your email by clicking the link below"). Once Custom SMTP is wired to Resend, every signup / password reset / email change runs through these templates. The defaults look like phishing — replace them.

Where to paste:
**Supabase Dashboard → Authentication → Email Templates → pick a template → paste Subject + HTML → Save**

Variables (Supabase Go-template syntax):
- `{{ .ConfirmationURL }}` — full confirmation URL with token (redirects to `/auth/callback`)
- `{{ .Email }}` — recipient email
- `{{ .SiteURL }}` — set by Supabase project (should be `https://accessly.us`)
- `{{ .Token }}` — 6-digit code if you also enable OTP login

Style choices (consistent with `lib/email/sendWelcome.ts`):
- Slate-900 header (`#0f172a`), emerald accent (`#34d399`), serif heading
- Table-based layout (Outlook compat)
- All CSS inlined (Gmail strips `<style>` blocks)
- 560px max width

> **Resend domain note:** until `accessly.us` is verified in Resend with green SPF + DKIM, the `Sender email` in Supabase SMTP Settings must be `onboarding@resend.dev` (Resend's testing address). Once verified, switch to `contact@accessly.us`.

---

## Template 1: Confirm signup

**Subject:**
```
Confirm your Accessly account
```

**HTML body:**
```html
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Confirm your Accessly account</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f1f5f9;padding:48px 16px">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%">

  <!-- Header -->
  <tr><td style="background:#0f172a;border-radius:16px 16px 0 0;padding:24px 40px">
    <table cellpadding="0" cellspacing="0" border="0"><tr>
      <td style="width:38px;height:38px;background:#34d399;border-radius:10px;text-align:center;vertical-align:middle">
        <table cellpadding="0" cellspacing="0" border="0" width="38" height="38"><tr>
          <td align="center" valign="middle" style="color:#0f172a;font-size:18px;font-weight:900;font-family:Georgia,'Times New Roman',serif;line-height:1">A</td>
        </tr></table>
      </td>
      <td style="padding-left:11px;vertical-align:middle">
        <span style="color:#ffffff;font-size:20px;font-weight:700;font-family:Georgia,'Times New Roman',serif;letter-spacing:-.02em">Accessly</span>
      </td>
    </tr></table>
  </td></tr>

  <!-- Body -->
  <tr><td style="background:#ffffff;padding:40px 40px 12px">
    <h1 style="margin:0 0 14px;font-size:26px;font-weight:800;color:#0f172a;font-family:Georgia,'Times New Roman',serif;line-height:1.2;letter-spacing:-.02em">Confirm your email</h1>
    <p style="margin:0 0 28px;font-size:15px;color:#475569;line-height:1.7">Click the button below to verify <strong style="color:#0f172a">{{ .Email }}</strong> and finish creating your Accessly account. The link expires in 24 hours.</p>

    <table cellpadding="0" cellspacing="0" border="0"><tr>
      <td style="border-radius:10px;background:#10b981">
        <a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:13px 26px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px">Confirm email →</a>
      </td>
    </tr></table>

    <p style="margin:28px 0 0;font-size:13px;color:#94a3b8;line-height:1.6">Or paste this URL into your browser:</p>
    <p style="margin:6px 0 0;font-size:12px;color:#64748b;line-height:1.5;word-break:break-all"><a href="{{ .ConfirmationURL }}" style="color:#10b981;text-decoration:none">{{ .ConfirmationURL }}</a></p>
  </td></tr>

  <!-- Why are you receiving this -->
  <tr><td style="background:#ffffff;padding:32px 40px 36px;border-top:1px solid #f1f5f9">
    <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6">You're receiving this because someone signed up for Accessly with this email address. If that wasn't you, ignore this message — no account is created until the link above is clicked.</p>
  </td></tr>

  <!-- Footer -->
  <tr><td style="background:#0f172a;border-radius:0 0 16px 16px;padding:20px 40px;text-align:center">
    <p style="margin:0;font-size:11px;color:#64748b;line-height:1.6">Accessly — WCAG accessibility scanner</p>
    <p style="margin:6px 0 0;font-size:11px;color:#475569"><a href="https://accessly.us" style="color:#94a3b8;text-decoration:none">accessly.us</a></p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>
```

---

## Template 2: Magic Link

**Subject:**
```
Your Accessly sign-in link
```

**HTML body:**
```html
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Your Accessly sign-in link</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f1f5f9;padding:48px 16px">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%">

  <tr><td style="background:#0f172a;border-radius:16px 16px 0 0;padding:24px 40px">
    <table cellpadding="0" cellspacing="0" border="0"><tr>
      <td style="width:38px;height:38px;background:#34d399;border-radius:10px;text-align:center;vertical-align:middle">
        <table cellpadding="0" cellspacing="0" border="0" width="38" height="38"><tr>
          <td align="center" valign="middle" style="color:#0f172a;font-size:18px;font-weight:900;font-family:Georgia,'Times New Roman',serif;line-height:1">A</td>
        </tr></table>
      </td>
      <td style="padding-left:11px;vertical-align:middle">
        <span style="color:#ffffff;font-size:20px;font-weight:700;font-family:Georgia,'Times New Roman',serif;letter-spacing:-.02em">Accessly</span>
      </td>
    </tr></table>
  </td></tr>

  <tr><td style="background:#ffffff;padding:40px 40px 12px">
    <h1 style="margin:0 0 14px;font-size:26px;font-weight:800;color:#0f172a;font-family:Georgia,'Times New Roman',serif;line-height:1.2;letter-spacing:-.02em">Sign in to Accessly</h1>
    <p style="margin:0 0 28px;font-size:15px;color:#475569;line-height:1.7">Click the button below to sign in as <strong style="color:#0f172a">{{ .Email }}</strong>. This link expires in 1 hour and can be used only once.</p>

    <table cellpadding="0" cellspacing="0" border="0"><tr>
      <td style="border-radius:10px;background:#10b981">
        <a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:13px 26px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px">Sign in →</a>
      </td>
    </tr></table>

    <p style="margin:28px 0 0;font-size:13px;color:#94a3b8;line-height:1.6">Or paste this URL into your browser:</p>
    <p style="margin:6px 0 0;font-size:12px;color:#64748b;line-height:1.5;word-break:break-all"><a href="{{ .ConfirmationURL }}" style="color:#10b981;text-decoration:none">{{ .ConfirmationURL }}</a></p>
  </td></tr>

  <tr><td style="background:#ffffff;padding:32px 40px 36px;border-top:1px solid #f1f5f9">
    <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6">Didn't request this? You can safely ignore the message — no one can sign in to your account without clicking the link above.</p>
  </td></tr>

  <tr><td style="background:#0f172a;border-radius:0 0 16px 16px;padding:20px 40px;text-align:center">
    <p style="margin:0;font-size:11px;color:#64748b;line-height:1.6">Accessly — WCAG accessibility scanner</p>
    <p style="margin:6px 0 0;font-size:11px;color:#475569"><a href="https://accessly.us" style="color:#94a3b8;text-decoration:none">accessly.us</a></p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>
```

---

## Template 3: Reset Password

**Subject:**
```
Reset your Accessly password
```

**HTML body:**
```html
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Reset your Accessly password</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f1f5f9;padding:48px 16px">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%">

  <tr><td style="background:#0f172a;border-radius:16px 16px 0 0;padding:24px 40px">
    <table cellpadding="0" cellspacing="0" border="0"><tr>
      <td style="width:38px;height:38px;background:#34d399;border-radius:10px;text-align:center;vertical-align:middle">
        <table cellpadding="0" cellspacing="0" border="0" width="38" height="38"><tr>
          <td align="center" valign="middle" style="color:#0f172a;font-size:18px;font-weight:900;font-family:Georgia,'Times New Roman',serif;line-height:1">A</td>
        </tr></table>
      </td>
      <td style="padding-left:11px;vertical-align:middle">
        <span style="color:#ffffff;font-size:20px;font-weight:700;font-family:Georgia,'Times New Roman',serif;letter-spacing:-.02em">Accessly</span>
      </td>
    </tr></table>
  </td></tr>

  <tr><td style="background:#ffffff;padding:40px 40px 12px">
    <h1 style="margin:0 0 14px;font-size:26px;font-weight:800;color:#0f172a;font-family:Georgia,'Times New Roman',serif;line-height:1.2;letter-spacing:-.02em">Reset your password</h1>
    <p style="margin:0 0 28px;font-size:15px;color:#475569;line-height:1.7">Click the button below to choose a new password for <strong style="color:#0f172a">{{ .Email }}</strong>. The link expires in 1 hour.</p>

    <table cellpadding="0" cellspacing="0" border="0"><tr>
      <td style="border-radius:10px;background:#10b981">
        <a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:13px 26px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px">Reset password →</a>
      </td>
    </tr></table>

    <p style="margin:28px 0 0;font-size:13px;color:#94a3b8;line-height:1.6">Or paste this URL into your browser:</p>
    <p style="margin:6px 0 0;font-size:12px;color:#64748b;line-height:1.5;word-break:break-all"><a href="{{ .ConfirmationURL }}" style="color:#10b981;text-decoration:none">{{ .ConfirmationURL }}</a></p>
  </td></tr>

  <tr><td style="background:#ffffff;padding:32px 40px 36px;border-top:1px solid #f1f5f9">
    <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6">If you didn't request a password reset, you can ignore this message — your password won't change unless you click the link above. If you're seeing repeated reset emails you didn't request, email <a href="mailto:contact@accessly.us" style="color:#10b981;text-decoration:none">contact@accessly.us</a>.</p>
  </td></tr>

  <tr><td style="background:#0f172a;border-radius:0 0 16px 16px;padding:20px 40px;text-align:center">
    <p style="margin:0;font-size:11px;color:#64748b;line-height:1.6">Accessly — WCAG accessibility scanner</p>
    <p style="margin:6px 0 0;font-size:11px;color:#475569"><a href="https://accessly.us" style="color:#94a3b8;text-decoration:none">accessly.us</a></p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>
```

---

## Template 4: Change Email Address

**Subject:**
```
Confirm your new Accessly email
```

**HTML body:**
```html
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Confirm your new Accessly email</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f1f5f9;padding:48px 16px">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%">

  <tr><td style="background:#0f172a;border-radius:16px 16px 0 0;padding:24px 40px">
    <table cellpadding="0" cellspacing="0" border="0"><tr>
      <td style="width:38px;height:38px;background:#34d399;border-radius:10px;text-align:center;vertical-align:middle">
        <table cellpadding="0" cellspacing="0" border="0" width="38" height="38"><tr>
          <td align="center" valign="middle" style="color:#0f172a;font-size:18px;font-weight:900;font-family:Georgia,'Times New Roman',serif;line-height:1">A</td>
        </tr></table>
      </td>
      <td style="padding-left:11px;vertical-align:middle">
        <span style="color:#ffffff;font-size:20px;font-weight:700;font-family:Georgia,'Times New Roman',serif;letter-spacing:-.02em">Accessly</span>
      </td>
    </tr></table>
  </td></tr>

  <tr><td style="background:#ffffff;padding:40px 40px 12px">
    <h1 style="margin:0 0 14px;font-size:26px;font-weight:800;color:#0f172a;font-family:Georgia,'Times New Roman',serif;line-height:1.2;letter-spacing:-.02em">Confirm your new email</h1>
    <p style="margin:0 0 28px;font-size:15px;color:#475569;line-height:1.7">Confirm the change of your Accessly email to <strong style="color:#0f172a">{{ .Email }}</strong>. The link expires in 24 hours.</p>

    <table cellpadding="0" cellspacing="0" border="0"><tr>
      <td style="border-radius:10px;background:#10b981">
        <a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:13px 26px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px">Confirm new email →</a>
      </td>
    </tr></table>

    <p style="margin:28px 0 0;font-size:13px;color:#94a3b8;line-height:1.6">Or paste this URL into your browser:</p>
    <p style="margin:6px 0 0;font-size:12px;color:#64748b;line-height:1.5;word-break:break-all"><a href="{{ .ConfirmationURL }}" style="color:#10b981;text-decoration:none">{{ .ConfirmationURL }}</a></p>
  </td></tr>

  <tr><td style="background:#ffffff;padding:32px 40px 36px;border-top:1px solid #f1f5f9">
    <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6">If you didn't request this change, ignore this message — your account email will not change without confirmation. Contact <a href="mailto:contact@accessly.us" style="color:#10b981;text-decoration:none">contact@accessly.us</a> if you suspect someone else is trying to take over your account.</p>
  </td></tr>

  <tr><td style="background:#0f172a;border-radius:0 0 16px 16px;padding:20px 40px;text-align:center">
    <p style="margin:0;font-size:11px;color:#64748b;line-height:1.6">Accessly — WCAG accessibility scanner</p>
    <p style="margin:6px 0 0;font-size:11px;color:#475569"><a href="https://accessly.us" style="color:#94a3b8;text-decoration:none">accessly.us</a></p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>
```

---

## Supabase SMTP setup checklist (Accessly project)

Mirror of ClearShield's setup, with the Accessly-specific values:

1. **Supabase Dashboard → Authentication → Emails → SMTP Settings**
2. Toggle **Enable custom SMTP** on
3. **Sender details:**
   - Sender email: `contact@accessly.us` (once Resend domain verified) OR `onboarding@resend.dev` (temporary)
   - Sender name: `Accessly`
4. **SMTP provider settings:**
   - Host: `smtp.resend.com`
   - Port: `465`
   - Minimum interval per user: `60` seconds
   - Username: `resend`
   - Password: your `RESEND_API_KEY` (`re_...`). Generate fresh in Resend → API Keys if you don't have it; Vercel doesn't display saved values.
5. **Save changes**
6. Paste the 4 templates above into Authentication → Email Templates
7. Test: sign up at `accessly.us/signup` with a `+test` Gmail address → confirm email arrives within ~10s

---

## Verification

After pasting all four templates + saving SMTP settings:

1. Sign up at `https://accessly.us/signup` with a real throwaway address
2. Inbox should receive "Confirm your Accessly account" from `contact@accessly.us` within ~10 seconds
3. Subject and body match the templates above
4. Click button → land on `/dashboard?...`
5. Resend Dashboard → Logs shows 200 on each send

Spam folder? Confirm SPF + DKIM are green in Resend → Domains. Gmail Postmaster Tools (free) gives sender-reputation tracking once you have a few sends.
