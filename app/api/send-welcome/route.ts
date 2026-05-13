import { NextRequest, NextResponse } from 'next/server'
import { sendWelcomeEmail } from '@/lib/email/sendWelcome'
import { notifyAdmin } from '@/lib/email/notifyAdmin'

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

    // Geolocation from Vercel-injected headers — best-effort, never gates
    // the response.
    const country = req.headers.get('x-vercel-ip-country') ?? null
    const city = req.headers.get('x-vercel-ip-city') ?? null
    const region = req.headers.get('x-vercel-ip-country-region') ?? null
    const location = [city ? decodeURIComponent(city) : null, region, country]
      .filter(Boolean)
      .join(', ') || '—'

    // Fire-and-forget — admin notification never blocks the user's signup
    notifyAdmin({
      subject: `[Accessly] New signup: ${email}`,
      heading: 'New account created',
      rows: [
        { label: 'Email', value: email },
        { label: 'Name', value: firstName || '—' },
        { label: 'Location', value: location },
        { label: 'When', value: new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) },
      ],
    }).catch(() => {})
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('[send-welcome]', err)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}
