import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import { useAuth } from '@/hooks/useAuth'
import { ROLE_LABELS } from '@/types/auth'

export function TopNavBar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { session, profile, signOut, getDashboardPath, mfaRequired } = useAuth()

  async function handleLogout() {
    await signOut()
    navigate('/login', { replace: true })
  }

  const onLanding = location.pathname === '/'

  return (
    <nav className="fixed top-0 z-50 flex h-16 w-full items-center justify-between border-b border-line/80 bg-nav px-4 shadow-md backdrop-blur-md sm:px-8">
      <div className="flex items-center gap-6 md:gap-10">
        <Link to="/" className="font-headline-md text-headline-md font-extrabold tracking-tight text-on-nav">
          FortressVote
        </Link>
        <div className="hidden gap-8 md:flex">
          <Link
            to="/#elections-catalog"
            className={
              onLanding
                ? 'border-b-2 border-tertiary pb-0.5 font-body-md text-body-md font-medium text-on-nav'
                : 'font-body-md text-body-md text-on-nav/70 transition-colors hover:text-on-nav'
            }
          >
            Elections
          </Link>
          <Link
            to="/results"
            className="font-body-md text-body-md text-on-nav/70 transition-colors hover:text-on-nav"
          >
            Results
          </Link>
          <a
            className="font-body-md text-body-md text-on-nav/70 transition-colors hover:text-on-nav"
            href="#elections-catalog"
          >
            Browse
          </a>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        <ThemeToggle variant="nav" />
        {session && profile && !mfaRequired ? (
          <>
            <span className="hidden items-center gap-2 rounded-full border border-on-nav/20 bg-on-nav/10 px-3 py-1 font-label-sm text-label-sm text-on-nav md:inline-flex">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-tertiary opacity-50" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-tertiary" />
              </span>
              {ROLE_LABELS[profile.role]}
            </span>
            <Link
              to={getDashboardPath() ?? '/'}
              className="hidden font-body-sm text-body-sm text-on-nav/70 hover:text-on-nav md:inline"
            >
              Dashboard
            </Link>
            <Link
              to="/account/security"
              className="hidden font-body-sm text-body-sm text-on-nav/70 hover:text-on-nav md:inline"
            >
              Security
            </Link>
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="px-3 py-2 font-body-md text-body-md text-on-nav/70 transition-colors hover:text-on-nav sm:px-4"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="text-sm font-semibold text-on-nav/80 hover:text-on-nav sm:hidden">
              Login
            </Link>
            <Link
              to="/login"
              className="btn-ghost hidden border-on-nav/25 py-2 text-on-nav/90 hover:border-on-nav/50 hover:bg-on-nav/10 hover:text-on-nav sm:inline-flex sm:px-4"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="btn-gradient-primary hidden py-2 text-sm sm:inline-flex sm:px-5"
            >
              Sign up
            </Link>
            <Link to="/login" className="btn-gradient-primary py-2 text-sm sm:hidden sm:px-4">
              Join
            </Link>
          </>
        )}
      </div>
    </nav>
  )
}
