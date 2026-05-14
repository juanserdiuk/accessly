'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

/**
 * Clear the pending purchase intent stashed in user_metadata during signup.
 * Called when the customer dismisses the "Continue your purchase" banner on
 * the dashboard, or implicitly after a successful checkout (the webhook
 * clears it on its own).
 */
export async function clearPendingIntent(): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  // Read current metadata so we don't blow away other keys.
  const current = (user.user_metadata ?? {}) as Record<string, unknown>
  if (current.pending_intent == null) return

  const next = { ...current }
  delete next.pending_intent

  // Use the admin client so we don't need the user to be in a special
  // state to update their own metadata — and so this works from server actions
  // without a writable supabase session.
  const admin = createAdminClient()
  await admin.auth.admin.updateUserById(user.id, { user_metadata: next })

  revalidatePath('/dashboard')
}
