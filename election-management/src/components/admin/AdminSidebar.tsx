import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

export function AdminSidebar() {
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
        <a
          className="flex items-center rounded-lg border-r-4 border-primary bg-primary/5 px-4 py-3 font-bold text-primary transition-all"
          href="#"
        >
          <span className="material-symbols-outlined mr-3">dashboard</span>
          <span className="font-label-md text-label-md">Dashboard</span>
        </a>
        <a
          className="group flex items-center rounded-lg px-4 py-3 text-on-surface-variant transition-all hover:bg-surface-container-high hover:text-on-surface"
          href="#"
        >
          <span className="material-symbols-outlined mr-3">how_to_vote</span>
          <span className="font-label-md text-label-md">Active Elections</span>
        </a>
        <a
          className="group flex items-center rounded-lg px-4 py-3 text-on-surface-variant transition-all hover:bg-surface-container-high hover:text-on-surface"
          href="#"
        >
          <span className="material-symbols-outlined mr-3">receipt_long</span>
          <span className="font-label-md text-label-md">Audit Logs</span>
        </a>
        <a
          className="group flex items-center rounded-lg px-4 py-3 text-on-surface-variant transition-all hover:bg-surface-container-high hover:text-on-surface"
          href="#"
        >
          <span className="material-symbols-outlined mr-3">group</span>
          <span className="font-label-md text-label-md">Users</span>
        </a>
        <a
          className="group flex items-center rounded-lg px-4 py-3 text-on-surface-variant transition-all hover:bg-surface-container-high hover:text-on-surface"
          href="#"
        >
          <span className="material-symbols-outlined mr-3">verified_user</span>
          <span className="font-label-md text-label-md">Security Settings</span>
        </a>
      </nav>
      <div className="mb-8 px-8">
        <button
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-bold text-on-primary shadow-lg shadow-primary/20 transition-all hover:opacity-90 active:scale-95"
        >
          <span className="material-symbols-outlined">add</span>
          <span>New Election</span>
        </button>
      </div>
      <div className="space-y-2 border-t border-white/5 px-4 pt-6">
        <a
          className="flex items-center px-4 py-2 text-on-surface-variant transition-colors hover:text-on-surface"
          href="#"
        >
          <span className="material-symbols-outlined mr-3">help</span>
          <span className="font-label-md text-label-md">Help Center</span>
        </a>
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
