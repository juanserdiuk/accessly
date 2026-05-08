import { createClient } from '@/lib/supabase/server'
import Topbar from '@/components/dashboard/Topbar'
import InviteForm from './InviteForm'
import { removeMember } from './actions'

type Member = {
  id: string
  member_email: string
  role: string
  status: string
  created_at: string
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'active') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
        Active
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
      Pending
    </span>
  )
}

function RoleBadge({ role }: { role: string }) {
  const styles: Record<string, string> = {
    admin:  'bg-violet-50 text-violet-700',
    member: 'bg-slate-100 text-slate-600',
    viewer: 'bg-blue-50 text-blue-700',
  }
  return (
    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium capitalize ${styles[role] ?? styles.member}`}>
      {role}
    </span>
  )
}

export default async function TeamPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: members } = await supabase
    .from('team_members')
    .select('id, member_email, role, status, created_at')
    .eq('owner_id', user!.id)
    .order('created_at', { ascending: false })

  const allMembers: Member[] = members ?? []

  return (
    <div className="dashboard-scroll flex-1 overflow-y-auto">
      <Topbar
        title="Team"
        subtitle={allMembers.length > 0
          ? `${allMembers.length} member${allMembers.length !== 1 ? 's' : ''}`
          : 'Invite colleagues to collaborate on accessibility'}
      />

      <div className="p-7 max-w-3xl space-y-5">

        {/* Invite card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
            Invite a team member
          </p>
          <InviteForm />
        </div>

        {/* Members list */}
        {allMembers.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl flex flex-col items-center justify-center py-20 text-center">
            <div className="w-12 h-12 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center mb-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <p className="text-sm font-medium text-slate-700 mb-1">No team members yet</p>
            <p className="text-xs text-slate-400">Invite a colleague above to get started.</p>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Email</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Role</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {allMembers.map(member => (
                  <tr key={member.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-5 py-4 text-slate-700 font-medium">{member.member_email}</td>
                    <td className="px-5 py-4"><RoleBadge role={member.role} /></td>
                    <td className="px-5 py-4"><StatusBadge status={member.status} /></td>
                    <td className="px-5 py-4 text-right">
                      <form action={removeMember}>
                        <input type="hidden" name="memberId" value={member.id} />
                        <button
                          type="submit"
                          title="Remove member"
                          className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-slate-300
                            hover:text-red-500 hover:bg-red-50 transition"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"/>
                            <line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  )
}
