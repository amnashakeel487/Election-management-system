import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

export function CreatorSidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { signOut } = useAuth()

  const isDashboard = location.pathname === '/creator/dashboard'
  const isElectionFlow = location.pathname.includes('/creator/elections')

  async function handleSignOut() {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <aside className="fixed left-0 top-0 z-50 flex h-full w-[280px] flex-col border-r border-white/5 bg-surface-container-lowest py-6 shadow-2xl shadow-black/40">
      <div className="mb-8 px-6">
        <h1 className="font-headline-sm text-headline-sm font-black text-primary">FortressVote</h1>
        <div className="mt-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-surface-container-high">
            <span className="material-symbols-outlined text-primary">admin_panel_settings</span>
          </div>
          <div>
            <p className="font-label-md text-label-md font-bold text-on-surface">System Control</p>
            <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">Super Admin Access</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-4">
        <Link
          to="/creator/dashboard"
          className={
            isDashboard
              ? 'flex items-center gap-3 rounded-lg border-r-4 border-primary bg-primary/5 px-4 py-3 font-bold text-primary transition-all'
              : 'flex items-center gap-3 rounded-lg px-4 py-3 text-on-surface-variant transition-all hover:bg-surface-container-high hover:text-on-surface'
          }
        >
          <span className="material-symbols-outlined">dashboard</span>
          <span className="font-label-md text-label-md">Dashboard</span>
        </Link>
        <Link
          to="/creator/elections/new"
          className={
            isElectionFlow
              ? 'flex items-center gap-3 rounded-lg border-r-4 border-primary bg-primary/5 px-4 py-3 font-bold text-primary transition-all'
              : 'flex items-center gap-3 rounded-lg px-4 py-3 text-on-surface-variant transition-all hover:bg-surface-container-high hover:text-on-surface'
          }
        >
          <span className="material-symbols-outlined">how_to_vote</span>
          <span className="font-label-md text-label-md">My Elections</span>
        </Link>
        <a
          className="flex items-center gap-3 rounded-lg px-4 py-3 text-on-surface-variant transition-all hover:bg-surface-container-high hover:text-on-surface"
          href="#"
        >
          <span className="material-symbols-outlined">group</span>
          <span className="font-label-md text-label-md">Candidates</span>
        </a>
        <a
          className="flex items-center gap-3 rounded-lg px-4 py-3 text-on-surface-variant transition-all hover:bg-surface-container-high hover:text-on-surface"
          href="#"
        >
          <span className="material-symbols-outlined">analytics</span>
          <span className="font-label-md text-label-md">Analytics</span>
        </a>
        <a
          className="flex items-center gap-3 rounded-lg px-4 py-3 text-on-surface-variant transition-all hover:bg-surface-container-high hover:text-on-surface"
          href="#"
        >
          <span className="material-symbols-outlined">receipt_long</span>
          <span className="font-label-md text-label-md">Voter Registry</span>
        </a>
      </nav>
      <div className="mt-auto space-y-4 px-4">
        <Link
          to="/creator/elections/new"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 font-bold text-on-primary shadow-lg shadow-primary/20 transition-transform active:scale-95"
        >
          <span className="material-symbols-outlined">add</span>
          <span className="font-label-md text-label-md">New Election</span>
        </Link>
        <div className="space-y-1 border-t border-white/5 pt-6">
          <a
            className="flex items-center gap-3 px-4 py-2 text-on-surface-variant transition-colors hover:text-on-surface"
            href="#"
          >
            <span className="material-symbols-outlined">help</span>
            <span className="font-label-md text-label-md">Help Center</span>
          </a>
          <button
            type="button"
            onClick={() => void handleSignOut()}
            className="flex w-full items-center gap-3 px-4 py-2 text-on-surface-variant transition-colors hover:text-on-surface"
          >
            <span className="material-symbols-outlined">logout</span>
            <span className="font-label-md text-label-md">Sign Out</span>
          </button>
        </div>
      </div>
    </aside>
  )
}
