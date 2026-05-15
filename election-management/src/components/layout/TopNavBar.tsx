import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { ROLE_LABELS } from '@/types/auth'

export function TopNavBar() {
  const navigate = useNavigate()
  const { session, profile, signOut, getDashboardPath, mfaRequired } = useAuth()

  async function handleLogout() {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <nav className="fixed top-0 z-50 flex h-16 w-full items-center justify-between border-b border-white/10 bg-surface/70 px-8 shadow-sm backdrop-blur-xl">
      <div className="flex items-center gap-8">
        <Link to="/" className="font-headline-md text-headline-md font-bold text-primary">
          FortressVote
        </Link>
        <div className="hidden gap-6 md:flex">
          <a
            className="border-b-2 border-primary pb-1 font-body-md text-body-md text-primary transition-colors"
            href="#"
          >
            Elections
          </a>
          <Link
            to="/results"
            className="font-body-md text-body-md text-on-surface-variant transition-colors hover:text-primary"
          >
            Results
          </Link>
          <a
            className="font-body-md text-body-md text-on-surface-variant transition-colors hover:text-primary"
            href="#"
          >
            Resources
          </a>
        </div>
      </div>
      <div className="flex items-center gap-4">
        {session && profile && !mfaRequired ? (
          <>
            <span className="hidden rounded-full border border-primary/20 bg-primary/10 px-3 py-1 font-label-sm text-label-sm text-primary md:inline">
              {ROLE_LABELS[profile.role]}
            </span>
            <Link
              to={getDashboardPath() ?? '/'}
              className="hidden font-body-sm text-body-sm text-on-surface-variant hover:text-primary md:inline"
            >
              Dashboard
            </Link>
            <Link
              to="/account/security"
              className="hidden font-body-sm text-body-sm text-on-surface-variant hover:text-primary md:inline"
            >
              Security
            </Link>
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="px-4 py-2 font-body-md text-body-md text-on-surface-variant transition-colors hover:text-primary"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link
              to="/login"
              className="px-4 py-2 font-body-md text-body-md text-on-surface-variant transition-colors hover:text-primary"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="rounded-full bg-primary px-6 py-2 font-body-md text-body-md text-on-primary transition-opacity hover:opacity-80"
            >
              Sign Up
            </Link>
          </>
        )}
      </div>
    </nav>
  )
}
