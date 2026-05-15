import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Sign-out endpoint. Clears the Supabase session cookies and redirects to
 * the homepage. Used by the "Sign out" link on the pending-verification
 * page and anywhere else we need a clean sign-out trigger.
 */
export async function GET() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  return NextResponse.redirect(new URL('/', process.env.NEXT_PUBLIC_SITE_URL ?? 'https://accessly.us'))
}
