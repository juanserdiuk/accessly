import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL?.trim().toLowerCase()
  const userEmail = user?.email?.trim().toLowerCase()
  if (!user || !adminEmail || !userEmail || adminEmail !== userEmail) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { label?: string; expiresInDays?: number }
  try { body = await req.json() } catch { body = {} }

  const label = (body.label ?? '').trim()
  if (!label) return NextResponse.json({ error: 'Label is required' }, { status: 400 })

  const expiresInDays = Number(body.expiresInDays ?? 30)
  if (!Number.isFinite(expiresInDays) || expiresInDays < 1 || expiresInDays > 365) {
    return NextResponse.json({ error: 'expiresInDays must be between 1 and 365' }, { status: 400 })
  }

  const token = randomBytes(32).toString('hex')
  const expires_at = new Date(Date.now() + expiresInDays * 86_400_000).toISOString()

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('guest_tokens')
    .insert({ token, created_by: user.id, expires_at, label, is_active: true })
    .select('id, token')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ id: data.id, token: data.token })
}
