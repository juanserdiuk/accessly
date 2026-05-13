import { createAdminClient } from '@/lib/supabase/admin'

type Message = {
  id: string
  name: string
  email: string
  website: string | null
  message: string
  country: string | null
  city: string | null
  region: string | null
  read: boolean
  created_at: string
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(mins / 60)
  const days = Math.floor(hours / 24)
  if (mins < 5) return 'Just now'
  if (hours < 1) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days === 1) return 'Yesterday'
  return `${days}d ago`
}

function flag(country: string | null) {
  if (!country || country.length !== 2) return null
  return String.fromCodePoint(...country.toUpperCase().split('').map(c => 127397 + c.charCodeAt(0)))
}

function locationLabel(m: Message) {
  const parts = [m.city, m.region, m.country].filter(Boolean)
  return parts.length > 0 ? parts.join(', ') : '—'
}

export default async function MessagesPage() {
  const supabase = createAdminClient()
  const { data: messages } = await supabase
    .from('contact_messages')
    .select('id, name, email, website, message, country, city, region, read, created_at')
    .order('created_at', { ascending: false })
    .limit(200)

  const rows: Message[] = messages ?? []
  const unreadCount = rows.filter(r => !r.read).length

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">

      <div>
        <h1 className="font-serif text-2xl text-slate-900">Messages</h1>
        <p className="text-sm text-slate-400 mt-0.5">
          {rows.length === 0
            ? 'No messages yet — the contact form will pipe inquiries here.'
            : `${rows.length} total · ${unreadCount} unread`}
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl flex flex-col items-center justify-center py-20 text-center">
          <div className="w-12 h-12 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center mb-3">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
              <rect x="2" y="4" width="20" height="16" rx="2"/>
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
            </svg>
          </div>
          <p className="text-sm font-medium text-slate-700">Inbox is empty</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map(m => (
            <details
              key={m.id}
              className={`bg-white border rounded-2xl overflow-hidden transition-shadow ${
                m.read ? 'border-slate-200' : 'border-emerald-200 shadow-sm'
              }`}
            >
              <summary className="cursor-pointer list-none px-5 py-4 flex items-start gap-3 hover:bg-slate-50 transition-colors">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center text-xs font-bold text-white shrink-0">
                  {m.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-800 text-sm">{m.name}</span>
                    {!m.read && (
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                        new
                      </span>
                    )}
                    <span className="text-xs text-slate-400 ml-auto whitespace-nowrap">{relativeTime(m.created_at)}</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5 truncate">
                    {m.email}
                    {m.country && (
                      <span className="ml-2">{flag(m.country)} {locationLabel(m)}</span>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 mt-1.5 line-clamp-1 leading-relaxed">{m.message}</p>
                </div>
              </summary>

              <div className="px-5 pb-5 -mt-1 border-t border-slate-100 bg-slate-50/50">
                <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-xs mt-4 mb-4">
                  <div>
                    <span className="text-slate-400 uppercase tracking-wide font-medium mr-2">Email</span>
                    <a href={`mailto:${m.email}`} className="text-emerald-600 hover:underline">{m.email}</a>
                  </div>
                  {m.website && (
                    <div>
                      <span className="text-slate-400 uppercase tracking-wide font-medium mr-2">Website</span>
                      <a href={m.website} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline break-all">{m.website}</a>
                    </div>
                  )}
                  <div>
                    <span className="text-slate-400 uppercase tracking-wide font-medium mr-2">Location</span>
                    <span className="text-slate-700">{flag(m.country)} {locationLabel(m)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase tracking-wide font-medium mr-2">Received</span>
                    <span className="text-slate-700">{new Date(m.created_at).toLocaleString()}</span>
                  </div>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-4">
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{m.message}</p>
                </div>
                <div className="mt-4 flex gap-3">
                  <a
                    href={`mailto:${m.email}?subject=Re:%20Your%20Accessly%20inquiry`}
                    className="inline-flex items-center gap-2 text-xs font-semibold bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition"
                  >
                    Reply to {m.name.split(' ')[0]}
                  </a>
                </div>
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  )
}
