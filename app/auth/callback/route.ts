import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { sendWelcomeEmail } from '@/lib/email/sendWelcome'

const NEW_USER_WINDOW_MS = 10 * 60 * 1000 // 10 minutes

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

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
      // Detect brand-new OAuth signups and send a welcome email.
      // Email-auth users are handled in the signup form instead (their
      // created_at is from the original signUp() call, not confirmation time).
      try {
        const { data: { user } } = await supabase.auth.getUser()
        const provider = user?.app_metadata?.provider as string | undefined
        const isOAuth = provider && provider !== 'email'
        const isNew = user?.created_at
          ? Date.now() - new Date(user.created_at).getTime() < NEW_USER_WINDOW_MS
          : false

        if (isNew && isOAuth && user?.email) {
          const fullName = (user.user_metadata?.full_name as string | undefined) ?? ''
          const firstName = fullName.split(' ')[0] ?? ''
          sendWelcomeEmail(user.email, firstName).catch(err =>
            console.error('[callback] welcome email failed:', err)
          )
        }
      } catch (err) {
        // Non-fatal — don't block the redirect
        console.error('[callback] user metadata fetch failed:', err)
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=oauth`)
}
