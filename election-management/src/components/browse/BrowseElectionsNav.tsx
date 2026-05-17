import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

function ShieldLogo() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  )
}

export function BrowseElectionsNav() {
  const location = useLocation()
  const { session, profile, getDashboardPath } = useAuth()
  const path = location.pathname

  return (
    <nav className="navbar">
      <Link className="nav-brand" to="/">
        <div className="nav-logo">
          <ShieldLogo />
        </div>
        <div className="nav-wordmark">
          Fortress<span>Vote</span>
        </div>
      </Link>
      <div className="nav-links">
        <Link className={`nav-link${path === '/' ? ' active' : ''}`} to="/">
          Home
        </Link>
        <Link className={`nav-link${path.startsWith('/browse-elections') ? ' active' : ''}`} to="/browse-elections">
          Elections
        </Link>
        <Link className={`nav-link${path.startsWith('/results') ? ' active' : ''}`} to="/results">
          Results
        </Link>
      </div>
      <div className="nav-right">
        {session && profile ? (
          <Link className="nav-btn primary" to={getDashboardPath() ?? '/'}>
            Dashboard
          </Link>
        ) : (
          <>
            <Link className="nav-btn ghost" to="/login">
              Log In
            </Link>
            <Link className="nav-btn primary" to="/register">
              Register Free
            </Link>
          </>
        )}
      </div>
    </nav>
  )
}
