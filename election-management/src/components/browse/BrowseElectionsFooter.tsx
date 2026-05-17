import { Link } from 'react-router-dom'

function ShieldLogo() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  )
}

export function BrowseElectionsFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-top">
          <div className="footer-brand">
            <div className="footer-brand-row">
              <div className="footer-logo">
                <ShieldLogo />
              </div>
              <div className="footer-brand-name">FortressVote</div>
            </div>
            <p className="footer-desc">
              Secure election hosting with verified registration, anonymous ballots, and transparent results.
            </p>
          </div>
          <div>
            <div className="footer-col-title">Product</div>
            <div className="footer-links">
              <Link className="footer-link" to="/browse-elections">
                Browse elections
              </Link>
              <Link className="footer-link" to="/results">
                Live results
              </Link>
              <Link className="footer-link" to="/register">
                Create account
              </Link>
            </div>
          </div>
          <div>
            <div className="footer-col-title">Account</div>
            <div className="footer-links">
              <Link className="footer-link" to="/login">
                Sign in
              </Link>
              <Link className="footer-link" to="/register">
                Register
              </Link>
            </div>
          </div>
          <div>
            <div className="footer-col-title">Legal</div>
            <div className="footer-links">
              <a className="footer-link" href="#">
                Privacy
              </a>
              <a className="footer-link" href="#">
                Terms
              </a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <div className="footer-copy">© {year} FortressVote. All rights reserved.</div>
        </div>
      </div>
    </footer>
  )
}
