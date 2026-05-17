import { Link } from 'react-router-dom'

export function LiveResultsFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="footer">
      <div className="footer-links-row">
        <Link className="footer-link" to="/">
          Home
        </Link>
        <Link className="footer-link" to="/browse-elections">
          Elections
        </Link>
        <Link className="footer-link" to="/results">
          All results
        </Link>
      </div>
      <div className="footer-copy">© {year} FortressVote · Secure, transparent voting</div>
    </footer>
  )
}
