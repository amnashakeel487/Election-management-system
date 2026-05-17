import { Link } from 'react-router-dom'
import type { Election } from '@/types/election'
import { shouldShowPublicBallotCount } from '@/utils/publicElectionLanding'
import {
  bannerGradClass,
  categoryDisplay,
  electionTimerLabel,
  isRegistrationJoinable,
  organizationLine,
} from '@/utils/browseElectionUi'
import type { PublicElectionPhase } from '@/utils/publicElectionLanding'

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

export interface BrowseElectionCardProps {
  election: Election
  phase: PublicElectionPhase
  index: number
  nowMs: number
  registeredCount: number
  ballotCount: number
  candidateCount: number
}

export function BrowseElectionCard({
  election,
  phase,
  index,
  nowMs,
  registeredCount,
  ballotCount,
  candidateCount,
}: BrowseElectionCardProps) {
  const cat = categoryDisplay(election.category)
  const grad = bannerGradClass(index, cat.slug)
  const showBallots = shouldShowPublicBallotCount(election, phase, nowMs)
  const joinable = isRegistrationJoinable(election, phase, nowMs)
  const turnoutPct =
    election.max_voters > 0 && showBallots
      ? Math.min(100, Math.round((ballotCount / election.max_voters) * 100))
      : election.max_voters > 0
        ? Math.min(100, Math.round((registeredCount / election.max_voters) * 100))
        : 0
  const timer = electionTimerLabel(election, phase, nowMs)
  const desc = election.description?.trim() || 'No description provided.'

  const primary =
    phase === 'completed'
      ? { to: `/elections/${election.id}/results`, label: 'View Results →', className: 'ec-btn results' }
      : phase === 'active'
        ? { to: `/elections/${election.id}`, label: 'Vote Now →', className: 'ec-btn join' }
        : joinable
          ? { to: `/elections/${election.id}/join`, label: 'Register →', className: 'ec-btn join' }
          : null

  const turnoutLabel =
    phase === 'upcoming' && !showBallots ? 'Registrations' : phase === 'completed' ? 'Final Turnout' : 'Turnout'
  const turnoutDisplay = phase === 'upcoming' && !showBallots ? registeredCount.toLocaleString() : `${turnoutPct}%`
  const showTurnoutRow = showBallots || registeredCount > 0

  return (
    <article className="election-card">
      <div className="ec-banner">
        <div className={`ec-banner-grad ${grad}`} />
        <div className="ec-banner-pattern" />
        <div className="ec-banner-overlay" />
        <div className="ec-banner-badges">
          {phase === 'active' ? (
            <span className="ec-status active">
              <span className="ec-status-dot" />
              Active
            </span>
          ) : phase === 'upcoming' ? (
            <span className="ec-status upcoming">Upcoming</span>
          ) : (
            <span className="ec-status completed">Completed</span>
          )}
          <span className="ec-cat-badge">
            {cat.icon} {cat.label}
          </span>
        </div>
        <div className="ec-banner-icon">{cat.icon}</div>
      </div>
      <div className="ec-body">
        <div className="ec-title">{election.title}</div>
        <div className="ec-org">
          <HomeIcon />
          {organizationLine(election)}
        </div>
        <p className="ec-desc">{desc}</p>
        <div className="ec-stats">
          <div className="ec-stat">
            <div className="ec-stat-num">{registeredCount.toLocaleString()}</div>
            <div className="ec-stat-label">{phase === 'upcoming' ? 'Eligible' : 'Voters'}</div>
          </div>
          <div className="ec-stat">
            <div className="ec-stat-num">{candidateCount > 0 ? candidateCount : '—'}</div>
            <div className="ec-stat-label">Candidates</div>
          </div>
        </div>
        {showTurnoutRow ? (
          <div className="ec-turnout-row">
            <div className="ec-turnout-label">
              <span className="ec-turnout-text">{turnoutLabel}</span>
              <span className="ec-turnout-pct">{turnoutDisplay}</span>
            </div>
            <div className="ec-bar">
              <div
                className="ec-bar-fill"
                style={{
                  width: `${turnoutPct}%`,
                  background:
                    phase === 'completed'
                      ? 'linear-gradient(90deg,#6C3FC5,#9333ea)'
                      : phase === 'upcoming'
                        ? 'linear-gradient(90deg,#2451A3,#1B3A6B)'
                        : turnoutPct > 50
                          ? 'linear-gradient(90deg,#10B981,#059669)'
                          : 'linear-gradient(90deg,#F59E0B,#d97706)',
                }}
              />
            </div>
          </div>
        ) : null}
        <div
          className={`ec-timer${timer.closing ? ' closing' : ''}`}
          style={timer.success ? { color: 'var(--success)' } : undefined}
        >
          {timer.success ? <CheckIcon /> : <ClockIcon />}
          {timer.text}
        </div>
        <div className="ec-footer">
          <Link to={`/elections/${election.id}`} className="ec-btn view">
            Details
          </Link>
          {primary ? (
            <Link to={primary.to} className={primary.className}>
              {primary.label}
            </Link>
          ) : null}
        </div>
      </div>
    </article>
  )
}
