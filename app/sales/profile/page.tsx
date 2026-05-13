import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import ProfileForm from './ProfileForm'

export default async function SalesProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const admin = createAdminClient()
  const { data: sp } = await admin
    .from('salespeople')
    .select('id, full_name, email, phone, address_line1, address_line2, city, region, postal_code, country, commission_percent')
    .eq('user_id', user!.id)
    .single()

  if (!sp) return <div className="max-w-4xl mx-auto p-6">No salesperson record found.</div>

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">

      <Link href="/sales" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-700 transition">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Back to dashboard
      </Link>

      <div>
        <h1 className="font-serif text-2xl text-slate-900">Your profile</h1>
        <p className="text-sm text-slate-400 mt-0.5">Address is used for end-of-year 1099 reporting.</p>
      </div>

      <ProfileForm initial={sp} />

      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Read-only</p>
        <dl className="text-sm space-y-2">
          <div className="flex justify-between">
            <dt className="text-slate-500">Email</dt>
            <dd className="text-slate-800 font-medium">{sp.email}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Commission rate</dt>
            <dd className="text-slate-800 font-medium">{sp.commission_percent}%</dd>
          </div>
        </dl>
        <p className="text-xs text-slate-400 mt-3">Contact admin to change your commission rate.</p>
      </div>

    </main>
  )
}
