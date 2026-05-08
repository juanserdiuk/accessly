// Required .env.local vars:
//   SMTP_HOST     e.g. smtp.gmail.com
//   SMTP_PORT     e.g. 587
//   SMTP_SECURE   true | false  (true for port 465)
//   SMTP_USER     your SMTP username / email address
//   SMTP_PASS     your SMTP password or app password
//   SMTP_FROM     display address, e.g. "Accessly <no-reply@accessly.io>"

import { NextRequest, NextResponse } from 'next/server'

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

  const name = (body.name ?? '').trim()
  const email = (body.email ?? '').trim()
  const url = (body.url ?? '').trim()
  const message = (body.message ?? '').trim()

  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
  if (!message) return NextResponse.json({ error: 'Message is required' }, { status: 400 })

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.warn('[contact] SMTP not configured — add SMTP_HOST, SMTP_USER, SMTP_PASS to .env.local')
    return NextResponse.json({ success: true })
  }

  const nodemailer = await import('nodemailer')
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  })

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM ?? `"Accessly" <${process.env.SMTP_USER}>`,
      to: 'juanserdiuk@juanserdiuk.com',
      replyTo: email,
      subject: `Accessly inquiry from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\nWebsite: ${url || 'Not provided'}\n\n${message}`,
      html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#0f172a">
  <h2 style="margin-bottom:24px">New Accessly inquiry</h2>
  <p><strong>Name:</strong> ${esc(name)}</p>
  <p><strong>Email:</strong> <a href="mailto:${esc(email)}" style="color:#059669">${esc(email)}</a></p>
  <p><strong>Website:</strong> ${url ? `<a href="${esc(url)}" style="color:#059669">${esc(url)}</a>` : 'Not provided'}</p>
  <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0">
  <p style="white-space:pre-wrap;line-height:1.6">${esc(message)}</p>
</div>`,
    })
  } catch (err) {
    console.error('[contact] email send failed:', err)
    return NextResponse.json({ error: 'Failed to send message. Please try again.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
