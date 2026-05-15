import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

const navClass = ({ isActive }: { isActive: boolean }) =>
  isActive
    ? 'flex items-center rounded-lg border-r-4 border-primary bg-primary/5 px-4 py-3 font-bold text-primary transition-all'
    : 'group flex items-center rounded-lg px-4 py-3 text-on-surface-variant transition-all hover:bg-surface-container-high hover:text-on-surface'

export function AdminSidebar({ pendingCount = 0 }: { pendingCount?: number }) {
  const navigate = useNavigate()
  const { signOut } = useAuth()

  async function handleSignOut() {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-full w-[280px] flex-col bg-surface-container-lowest py-6 shadow-2xl">
      <div className="mb-8 px-8">
        <h1 className="font-headline-sm text-headline-sm font-black text-primary">FortressVote</h1>
        <p className="mt-1 font-label-md text-label-md uppercase tracking-widest text-on-surface-variant">
          System Control
        </p>
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
          {pendingCount > 0 ? (
            <span className="ml-auto rounded-full bg-error px-2 py-0.5 text-[10px] font-bold text-on-error">
              {pendingCount}
            </span>
          ) : null}
        </NavLink>
      </nav>
      <div className="mb-8 px-8">
        <NavLink
          to="/"
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 font-bold text-primary transition-all hover:bg-primary/20"
        >
          <span className="material-symbols-outlined">public</span>
          <span>View public site</span>
        </NavLink>
      </div>
      <div className="space-y-2 border-t border-white/5 px-4 pt-6">
        <button
          type="button"
          onClick={() => void handleSignOut()}
          className="flex w-full items-center px-4 py-2 text-on-surface-variant transition-colors hover:text-error"
        >
          <span className="material-symbols-outlined mr-3">logout</span>
          <span className="font-label-md text-label-md">Sign Out</span>
        </button>
      </div>
    </aside>
  )
}
