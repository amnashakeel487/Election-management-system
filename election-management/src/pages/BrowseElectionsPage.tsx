import { Link } from 'react-router-dom'
import { PublicElectionCatalog } from '@/components/home/PublicElectionCatalog'
import { Footer } from '@/components/layout/Footer'
import { TopNavBar } from '@/components/layout/TopNavBar'
import '@/components/home/landing-page.css'

export function BrowseElectionsPage() {
  return (
    <div className="lp-root min-h-screen" style={{ background: '#F0F4F9' }}>
      <TopNavBar />
      <main className="pt-16">
        <div className="browse-elections-hero">
          <div className="section-inner" style={{ paddingTop: 32, paddingBottom: 8 }}>
            <Link to="/" className="browse-back-link">
              <svg viewBox="0 0 24 24" width={16} height={16} aria-hidden>
                <line x1="19" y1="12" x2="5" y2="12" stroke="currentColor" strokeWidth="2" />
                <polyline points="12 19 5 12 12 5" fill="none" stroke="currentColor" strokeWidth="2" />
              </svg>
              Back to home
            </Link>
          </div>
        </div>
        <PublicElectionCatalog sectionId="browse-elections-catalog" />
      </main>
      <Footer />
    </div>
  )
}
