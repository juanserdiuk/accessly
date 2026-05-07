import { createBrowserClient } from '@supabase/ssr'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

const validUrl = SUPABASE_URL.startsWith('http')
const validKey = SUPABASE_ANON_KEY.length > 10

export const supabaseConfigured = validUrl && validKey

export function createClient() {
  return createBrowserClient(
    validUrl ? SUPABASE_URL : 'https://placeholder.supabase.co',
    validKey ? SUPABASE_ANON_KEY : 'placeholder-key-placeholder-key-placeholder'
  )
}
