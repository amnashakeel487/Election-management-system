import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { VoterPageHeader } from '@/components/voter/VoterPageHeader'
import { useAuth } from '@/hooks/useAuth'
import { useVoterDashboard } from '@/hooks/useVoterDashboard'
import { electionDisplayStatus } from '@/utils/dashboardDisplay'
import { formatElectionCode } from '@/utils/electionTime'
import { maskSecretVoterId } from '@/utils/maskSecretVoterId'
import { areElectionResultsVisible } from '@/utils/electionResultsVisibility'
import { canVote, formatCountdown, getRegistrationPhase, registrationBadgeClass } from '@/utils/voterElectionUi'

function LiveCountdown({ endDate }: { endDate: string }) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])
  const { h, m, s } = formatCountdown(endDate, now)
  return (
    <div className="countdown" style={{ marginBottom: 12 }}>
      <div className="cd-unit">
        <div className="cd-num">{h}</div>
        <div className="cd-label">Hrs</div>
      </div>
      <div className="cd-unit">
        <div className="cd-num">{m}</div>
        <div className="cd-label">Min</div>
      </div>
      <div className="cd-unit">
        <div className="cd-num">{s}</div>
        <div className="cd-label">Sec</div>
      </div>
    </div>
  )
}

export function VoterHomePage() {
  const { profile } = useAuth()
  const {
    registered,
    loading,
    votedCount,
    liveVoteCount,
    pendingVoteCount,
  } = useVoterDashboard()

  const secretIssued = useMemo(() => registered.filter((r) => r.secret_voter_id).length, [registered])

  const activeRegs = useMemo(
    () =>
      registered.filter((r) => {
        if (!r.election) return false
        return electionDisplayStatus(r.election.status, r.election.start_date, r.election.end_date) === 'active'
      }),
    [registered],
  )

  const displayName = profile?.full_name?.trim() || 'Voter'

  return (
    <>
      <VoterPageHeader
        eyebrow="Voter Dashboard"
        title={`Welcome back, ${displayName} 👋`}
        subtitle="Your democratic journey — all elections in one place"
      />

      {liveVoteCount > 0 ? (
        <div className="hero-banner">
          <div className="hero-banner-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span className="live-dot" />
                  <span style={{ fontSize: 11, color: '#67E8F9', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {liveVoteCount} Active Election{liveVoteCount === 1 ? '' : 's'} Awaiting Your Vote
                  </span>
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 6 }}>Your vote is waiting! Don&apos;t miss it ⏰</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>
                  Cast your vote before the deadline. Every vote counts in a democracy.
                </div>
              </div>
              <Link to="/voter/vote" className="btn btn-success" style={{ padding: '12px 24px', fontSize: 14, whiteSpace: 'nowrap' }}>
                <svg viewBox="0 0 24 24" aria-hidden>
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
                Vote Now →
              </Link>
            </div>
          </div>
        </div>
      ) : null}

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-icon-row">
            <div className="stat-icon" style={{ background: '#EFF4FF', color: '#2451A3' }}>
              <svg viewBox="0 0 24 24" aria-hidden>
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <span className="stat-delta du">Joined</span>
          </div>
          <div className="stat-num">{registered.length}</div>
          <div className="stat-label">My Elections</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-row">
            <div className="stat-icon" style={{ background: '#DCFCE7', color: '#16A34A' }}>
              <svg viewBox="0 0 24 24" aria-hidden>
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            </div>
            <span className="stat-delta du">Done</span>
          </div>
          <div className="stat-num">{votedCount}</div>
          <div className="stat-label">Votes Cast</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-row">
            <div className="stat-icon" style={{ background: '#FEF9C3', color: '#CA8A04' }}>
              <svg viewBox="0 0 24 24" aria-hidden>
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <span className="stat-delta" style={{ background: '#FEF9C3', color: '#CA8A04' }}>
              Urgent
            </span>
          </div>
          <div className="stat-num">{pendingVoteCount}</div>
          <div className="stat-label">Pending Votes</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-row">
            <div className="stat-icon" style={{ background: '#ECFEFF', color: '#06B6D4' }}>
              <svg viewBox="0 0 24 24" aria-hidden>
                <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5" />
              </svg>
            </div>
            <span className="stat-delta du">Active</span>
          </div>
          <div className="stat-num">{secretIssued}</div>
          <div className="stat-label">Secret IDs Issued</div>
        </div>
      </div>

      <div className="grid-7-3">
        <div className="card-elevated">
          <div className="card-header">
            <div className="card-title">My Active Elections</div>
            <span className="badge b-live">
              <span className="b-dot" />
              Live
            </span>
          </div>
          <div className="card-body">
            {loading ? (
              <p style={{ fontSize: 13, color: 'var(--subtle)' }}>Loading…</p>
            ) : activeRegs.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--subtle)' }}>
                No active elections right now.{' '}
                <Link to="/browse-elections">Browse elections</Link> to join.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {activeRegs.slice(0, 6).map((reg) => {
                  if (!reg.election) return null
                  const voting = canVote(reg)
                  const border = voting ? '#EF4444' : reg.voted_at ? '#10B981' : 'var(--border)'
                  return (
                    <div
                      key={reg.id}
                      style={{
                        background: '#F8FAFC',
                        borderRadius: 12,
                        padding: 14,
                        border: '1px solid var(--border)',
                        borderLeft: `4px solid ${border}`,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700 }}>{reg.election.title}</div>
                          <div style={{ fontSize: 11, color: 'var(--subtle)' }}>
                            {formatElectionCode(reg.election.id)} · Ends {new Date(reg.election.end_date).toLocaleString()}
                          </div>
                        </div>
                        {reg.voted_at ? (
                          <span className="badge b-voted">✓ Voted</span>
                        ) : voting ? (
                          <span className="badge" style={{ background: '#FEE2E2', color: '#B91C1C', fontSize: 9 }}>
                            ⚠ NOT VOTED
                          </span>
                        ) : (
                          <span className={`badge ${registrationBadgeClass(getRegistrationPhase(reg))}`}>
                            {getRegistrationPhase(reg).replace(/_/g, ' ')}
                          </span>
                        )}
                      </div>
                      {!reg.voted_at && reg.election ? <LiveCountdown endDate={reg.election.end_date} /> : null}
                      {voting ? (
                        <Link to={`/voter/vote/${reg.election.id}`} className="btn btn-success btn-sm">
                          <svg viewBox="0 0 24 24" aria-hidden>
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                            <path d="M9 12l2 2 4-4" />
                          </svg>
                          Cast Your Vote
                        </Link>
                      ) : reg.voted_at && areElectionResultsVisible(reg.election) ? (
                        <Link to={`/voter/results/${reg.election.id}`} className="btn btn-ghost btn-sm" style={{ marginTop: 10 }}>
                          View results
                        </Link>
                      ) : reg.voted_at ? (
                        <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 10, maxWidth: 280 }}>
                          Results available after voting ends
                        </p>
                      ) : (
                        <Link to={`/voter/elections/${reg.election.id}`} className="btn btn-ghost btn-sm" style={{ marginTop: 10 }}>
                          View Election
                        </Link>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="card-elevated">
            <div className="card-header">
              <div className="card-title">My Secret IDs</div>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '12px 16px' }}>
              <div style={{ fontSize: 10, color: 'var(--subtle)', marginBottom: 4 }}>Masked on dashboard</div>
              {registered.filter((r) => r.secret_voter_id && r.election).length === 0 ? (
                <p style={{ fontSize: 12, color: 'var(--subtle)' }}>No secret IDs yet.</p>
              ) : (
                registered
                  .filter((r) => r.secret_voter_id && r.election)
                  .slice(0, 8)
                  .map((r) => (
                    <div
                      key={r.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 10px',
                        background: '#F8FAFC',
                        borderRadius: 9,
                        border: '1px solid var(--border)',
                      }}
                    >
                      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)' }}>{formatElectionCode(r.election!.id)}</div>
                      <div className="sid-box" style={{ fontSize: 11, padding: '5px 10px', letterSpacing: 2 }}>
                        <svg viewBox="0 0 24 24" aria-hidden>
                          <rect x="3" y="11" width="18" height="11" rx="2" />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                        {maskSecretVoterId(r.secret_voter_id!)}
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>

          <div className="card-elevated">
            <div className="card-header">
              <div className="card-title">Quick Links</div>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '12px 16px' }}>
              <Link to="/voter/polls" className="btn btn-ghost" style={{ width: '100%', justifyContent: 'flex-start' }}>
                <svg viewBox="0 0 24 24" aria-hidden>
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                  <rect x="8" y="2" width="8" height="4" rx="1" />
                </svg>
                My Joined Polls
              </Link>
              <Link to="/voter/results" className="btn btn-ghost" style={{ width: '100%', justifyContent: 'flex-start' }}>
                <svg viewBox="0 0 24 24" aria-hidden>
                  <line x1="18" y1="20" x2="18" y2="10" />
                  <line x1="12" y1="20" x2="12" y2="4" />
                  <line x1="6" y1="20" x2="6" y2="14" />
                </svg>
                View Live Results
              </Link>
              <Link to="/browse-elections" className="btn btn-ghost" style={{ width: '100%', justifyContent: 'flex-start' }}>
                <svg viewBox="0 0 24 24" aria-hidden>
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                Browse Elections
              </Link>
            </div>
          </div>
        </div>
      </div>

    </>
  )
}
