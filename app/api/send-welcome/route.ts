import { NextRequest, NextResponse } from 'next/server'
import { sendWelcomeEmail } from '@/lib/email/sendWelcome'

export async function POST(req: NextRequest) {
  let email: string, firstName: string
  try {
    const body = await req.json()
    email = (body.email ?? '').trim()
    firstName = (body.firstName ?? '').trim()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
  }

  try {
    await sendWelcomeEmail(email, firstName)
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('[send-welcome]', err)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}
