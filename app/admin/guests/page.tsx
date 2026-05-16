import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/admin'
import TokenForm from './TokenForm'
import { CopyButton, RevokeButton } from './TokenActions'

type GuestToken = {
  id: string
  token: string
  label: string
  expires_at: string
  is_active: boolean
  created_at: string
}

function relativeTime(iso: string) {
  const diff  = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days  = Math.floor(diff / 86_400_000)
  if (mins  < 5)  return 'Just now'
  if (hours < 1)  return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days  === 1) return 'Yesterday'
  return `${days}d ago`
}

function StatusBadge({ token }: { token: GuestToken }) {
  const expired = new Date(token.expires_at) < new Date()
  if (!token.is_active) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-500">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
        Revoked
      </span>
    )
  }
  if (expired) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-600">
        <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
        Expired
      </span>
    )
  }
  const daysLeft = Math.ceil((new Date(token.expires_at).getTime() - Date.now()) / 86_400_000)
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
      Active · {daysLeft}d left
    </span>
  )
}

export default async function GuestsPage() {
  // CRITICAL: must precede every data fetch — see lib/auth/admin.ts.
  await requireAdmin()
  const admin = createAdminClient()

  const { data: tokens } = await admin
    .from('guest_tokens')
    .select('id, token, label, expires_at, is_active, created_at')
    .order('created_at', { ascending: false })

  const allTokens: GuestToken[] = tokens ?? []
  const activeCount = allTokens.filter(t => t.is_active && new Date(t.expires_at) > new Date()).length

  // Build guest URL base — rely on env var or fallback to prod domain
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://accessly.us').replace(/\/$/, '')

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">

      {/* Page header */}
      <div>
        <h1 className="font-serif text-2xl text-slate-900">Guest Access</h1>
        <p className="text-sm text-slate-400 mt-0.5">
          {activeCount} active link{activeCount !== 1 ? 's' : ''} · share these with influencers, press, or launch audiences
        </p>
      </div>

      {/* Create form */}
      <TokenForm />

      {/* Tokens table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <p className="font-semibold text-slate-900">All guest links</p>
            <p className="text-xs text-slate-400 mt-0.5">{allTokens.length} total</p>
          </div>
        </div>

        {allTokens.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center mb-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
              </svg>
            </div>
            <p className="text-sm font-medium text-slate-700 mb-1">No guest links yet</p>
            <p className="text-xs text-slate-400">Create one above to get started.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Label</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400 hidden md:table-cell">Link</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400 hidden sm:table-cell">Created</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {allTokens.map(t => {
                const url = `${baseUrl}/guest/${t.token}`
                const isAlive = t.is_active && new Date(t.expires_at) > new Date()
                return (
                  <tr key={t.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-5 py-4">
                      <span className="font-medium text-slate-800">{t.label}</span>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <code className="text-xs text-slate-400 font-mono truncate max-w-[220px]">
                          /guest/{t.token.slice(0, 16)}…
                        </code>
                        <CopyButton url={url} />
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-400 whitespace-nowrap hidden sm:table-cell">
                      {relativeTime(t.created_at)}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge token={t} />
                    </td>
                    <td className="px-5 py-4 text-right">
                      {isAlive && <RevokeButton id={t.id} />}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
