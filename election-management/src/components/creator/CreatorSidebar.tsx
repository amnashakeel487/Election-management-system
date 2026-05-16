import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

const linkActive =
  'flex items-center gap-3 rounded-xl bg-gradient-to-br from-[rgba(36,81,163,0.88)] to-[rgba(108,63,197,0.62)] px-4 py-3 font-bold text-on-nav shadow-md ring-1 ring-on-nav/10'
const linkIdle =
  'flex items-center gap-3 rounded-xl px-4 py-3 font-medium text-on-nav/65 transition-all hover:bg-on-nav/10 hover:text-on-nav'

export function CreatorSidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { signOut } = useAuth()

  const isDashboard = location.pathname === '/creator/dashboard'
  const isCandidates = location.pathname === '/creator/candidates'
  const isElectionFlow = location.pathname.includes('/creator/elections')

  async function handleSignOut() {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <aside className="fixed left-0 top-0 z-50 flex h-full w-[280px] flex-col border-r border-on-nav/15 bg-nav py-6 shadow-2xl shadow-black/30">
      <div className="mb-8 px-6">
        <h1 className="font-headline-sm text-headline-sm font-black tracking-tight text-on-nav">FortressVote</h1>
        <div className="mt-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-on-nav/20 bg-on-nav/10">
            <span className="material-symbols-outlined text-tertiary">admin_panel_settings</span>
          </div>
          <div>
            <p className="flex items-center gap-2 font-label-md text-label-md font-bold text-on-nav">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-tertiary opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-tertiary" />
              </span>
              Creator
            </p>
            <p className="text-[10px] uppercase tracking-widest text-on-nav/55">Election board</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-4">
        <Link to="/creator/dashboard" className={isDashboard ? linkActive : linkIdle}>
          <span className="material-symbols-outlined">dashboard</span>
          <span className="font-label-md text-label-md">Dashboard</span>
        </Link>
        <Link to="/creator/elections/new" className={isElectionFlow ? linkActive : linkIdle}>
          <span className="material-symbols-outlined">how_to_vote</span>
          <span className="font-label-md text-label-md">My Elections</span>
        </Link>
        <Link to="/creator/candidates" className={isCandidates ? linkActive : linkIdle}>
          <span className="material-symbols-outlined">group</span>
          <span className="font-label-md text-label-md">Candidates</span>
        </Link>
        <a className={linkIdle} href="#">
          <span className="material-symbols-outlined">analytics</span>
          <span className="font-label-md text-label-md">Analytics</span>
        </a>
        <a className={linkIdle} href="#">
          <span className="material-symbols-outlined">receipt_long</span>
          <span className="font-label-md text-label-md">Voter Registry</span>
        </a>
      </nav>
      <div className="mt-auto space-y-4 px-4">
        <Link
          to="/creator/elections/new"
          className="btn-gradient-primary flex w-full items-center justify-center gap-2 py-3 font-bold shadow-lg"
        >
          <span className="material-symbols-outlined">add</span>
          <span className="font-label-md text-label-md">New Election</span>
        </Link>
        <div className="space-y-1 border-t border-on-nav/15 pt-6">
          <a className={`${linkIdle} py-2`} href="#">
            <span className="material-symbols-outlined">help</span>
            <span className="font-label-md text-label-md">Help Center</span>
          </a>
          <button
            type="button"
            onClick={() => void handleSignOut()}
            className={`${linkIdle} w-full py-2 hover:text-tertiary`}
          >
            <span className="material-symbols-outlined">logout</span>
            <span className="font-label-md text-label-md">Sign Out</span>
          </button>
        </div>
      </div>
    </aside>
  )
}
