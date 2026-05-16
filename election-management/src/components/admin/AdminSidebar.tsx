import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

const linkActive =
  'flex items-center rounded-xl bg-gradient-to-br from-[rgba(36,81,163,0.88)] to-[rgba(108,63,197,0.62)] px-4 py-3 font-bold text-on-nav shadow-md ring-1 ring-on-nav/10'
const linkIdle =
  'group flex items-center rounded-xl px-4 py-3 font-medium text-on-nav/65 transition-all hover:bg-on-nav/10 hover:text-on-nav'

const navClass = ({ isActive }: { isActive: boolean }) => (isActive ? linkActive : linkIdle)

export function AdminSidebar({ pendingCount = 0 }: { pendingCount?: number }) {
  const navigate = useNavigate()
  const { signOut } = useAuth()

  async function handleSignOut() {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-full w-[280px] flex-col border-r border-on-nav/15 bg-nav py-6 shadow-2xl shadow-black/30">
      <div className="mb-8 px-8">
        <h1 className="font-headline-sm text-headline-sm font-black tracking-tight text-on-nav">FortressVote</h1>
        <p className="mt-1 font-label-md text-label-md uppercase tracking-widest text-on-nav/55">Admin console</p>
      </div>
      <nav className="flex-1 space-y-2 px-4">
        <NavLink to="/admin/dashboard" end className={navClass}>
          <span className="material-symbols-outlined mr-3">dashboard</span>
          <span className="font-label-md text-label-md">Dashboard</span>
        </NavLink>
        <NavLink to="/admin/approvals" className={navClass}>
          <span className="material-symbols-outlined mr-3">person_check</span>
          <span className="font-label-md text-label-md">Creator Approvals</span>
          {pendingCount > 0 ? (
            <span className="ml-auto rounded-full bg-error px-2 py-0.5 text-[10px] font-bold text-on-error">
              {pendingCount}
            </span>
          ) : null}
        </NavLink>
        <NavLink to="/admin/elections" className={navClass}>
          <span className="material-symbols-outlined mr-3">how_to_vote</span>
          <span className="font-label-md text-label-md">Elections</span>
        </NavLink>
        <NavLink to="/admin/audit-logs" className={navClass}>
          <span className="material-symbols-outlined mr-3">receipt_long</span>
          <span className="font-label-md text-label-md">Audit Logs</span>
        </NavLink>
        <NavLink to="/admin/users" className={navClass}>
          <span className="material-symbols-outlined mr-3">group</span>
          <span className="font-label-md text-label-md">Users</span>
        </NavLink>
      </nav>
      <div className="mb-8 px-8">
        <NavLink
          to="/"
          className="btn-ghost flex w-full items-center justify-center gap-2 border-on-nav/25 bg-on-nav/5 py-3 font-bold text-on-nav hover:border-tertiary/40 hover:bg-on-nav/10 hover:text-tertiary"
        >
          <span className="material-symbols-outlined">public</span>
          <span>View public site</span>
        </NavLink>
      </div>
      <div className="space-y-2 border-t border-on-nav/15 px-4 pt-6">
        <button
          type="button"
          onClick={() => void handleSignOut()}
          className="flex w-full items-center rounded-xl px-4 py-2 text-on-nav/65 transition-colors hover:bg-on-nav/10 hover:text-error"
        >
          <span className="material-symbols-outlined mr-3">logout</span>
          <span className="font-label-md text-label-md">Sign Out</span>
        </button>
      </div>
    </aside>
  )
}
