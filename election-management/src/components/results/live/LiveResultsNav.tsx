import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

function ShieldLogo() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  )
}

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  )
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )
}

export interface LiveResultsNavProps {
  isLive?: boolean
  onShare?: () => void
}

export function LiveResultsNav({ isLive, onShare }: LiveResultsNavProps) {
  const location = useLocation()
  const path = location.pathname
  const { session, profile, getDashboardPath } = useAuth()

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
        <Link className={`nav-link${path.includes('/results') ? ' active' : ''}`} to="/results">
          Results
        </Link>
      </div>
      <div className="nav-right">
        {isLive ? (
          <div className="live-pill">
            <div className="live-pill-dot" />
            Live
          </div>
        ) : null}
        {onShare ? (
          <button type="button" className="nav-btn ghost" onClick={onShare}>
            <ShareIcon />
            Share
          </button>
        ) : null}
        <button type="button" className="nav-btn pdf" onClick={() => window.print()}>
          <DownloadIcon />
          PDF
        </button>
        {session && profile ? (
          <Link className="nav-btn ghost" to={getDashboardPath() ?? '/'}>
            Dashboard
          </Link>
        ) : (
          <Link className="nav-btn ghost" to="/login">
            Log In
          </Link>
        )}
      </div>
    </nav>
  )
}
