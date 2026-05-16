import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { sendWelcomeEmail } from '@/lib/email/sendWelcome'
import { notify } from '@/lib/notify'

const NEW_USER_WINDOW_MS = 10 * 60 * 1000 // 10 minutes

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  // Only allow same-origin relative paths. Reject protocol-relative ("//evil.com"),
  // backslash-prefixed, and absolute URLs to prevent open-redirect abuse.
  const rawNext = searchParams.get('next')
  const next = rawNext && /^\/(?![/\\])/.test(rawNext) ? rawNext : '/dashboard'

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Welcome email fires at the FIRST successful callback for a brand-new
      // user — for OAuth that's just-now signup, for email/password that's
      // the verification click. Either way the message is now honest: the
      // account really IS live and ready to use.
      //
      // Identified as "new" if the user was created within the last 10 min,
      // and uses email_confirmed_at to avoid double-sending if the user
      // happens to re-trigger the callback (e.g. clicking the link twice).
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user?.email && user.email_confirmed_at) {
          const createdAt = user.created_at ? new Date(user.created_at).getTime() : 0
          const confirmedAt = new Date(user.email_confirmed_at).getTime()
          const isFreshlyConfirmed = Date.now() - confirmedAt < NEW_USER_WINDOW_MS
          const isNewUser = createdAt && (confirmedAt - createdAt) < NEW_USER_WINDOW_MS

          if (isFreshlyConfirmed && isNewUser) {
            const meta = (user.user_metadata ?? {}) as Record<string, unknown>
            const firstName =
              (meta.first_name as string | undefined) ??
              (typeof meta.full_name === 'string' ? meta.full_name.split(' ')[0] : '') ??
              ''
            sendWelcomeEmail(user.email, firstName).catch(err =>
              console.error('[callback] welcome email failed:', err)
            )
            // Founder ops ping — same trigger condition as the welcome
            // email so we don't fire on every login.
            notify.signup({ email: user.email, firstName: firstName || null })
              .catch(err => console.error('[callback] signup notify failed:', err))
          }
        }
      } catch (err) {
        // Non-fatal — don't block the redirect
        console.error('[callback] welcome email check threw:', err)
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`)
}
