'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function SignOutButton() {
  const router = useRouter()
  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }
  return (
    <button
      onClick={signOut}
      className="text-xs font-medium text-white/60 hover:text-white transition"
    >
      Sign out
    </button>
  )
}
