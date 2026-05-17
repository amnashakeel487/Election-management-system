import { PublicSiteNav } from '@/components/layout/PublicSiteNav'

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
  return (
    <PublicSiteNav
      active="results"
      trailing={
        <>
          {isLive ? (
            <div className="nav-live-pill">
              <div className="nav-live-pill-dot" />
              Live
            </div>
          ) : null}
          {onShare ? (
            <button type="button" className="btn-ghost-nav" onClick={onShare}>
              <ShareIcon />
              Share
            </button>
          ) : null}
          <button type="button" className="btn-accent-nav" onClick={() => window.print()}>
            <DownloadIcon />
            PDF
          </button>
        </>
      }
    />
  )
}
