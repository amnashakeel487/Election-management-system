import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CreatorApprovalBanner } from '@/components/creator/CreatorApprovalBanner'
import { CreatorPageHeader } from '@/components/creator/layout/CreatorPageHeader'
import { CREATOR_PAGE_META } from '@/config/creatorNav'
import { useAuth } from '@/hooks/useAuth'
import { useCreatorElection } from '@/context/CreatorElectionContext'
import { fetchElectionRegistrationStats } from '@/services/voterRegistrationService'
import { finalizeAndEmailSecretVoterIds } from '@/services/secretVoterIdService'
import { creatorPhaseBadge, electionShortCode } from '@/utils/creatorDisplay'
import { formatSubmissionDate } from '@/utils/formatDate'
import { formatTimeRemaining } from '@/utils/electionTime'

const meta = CREATOR_PAGE_META.dashboard

export function CreatorDashboardPage() {
  const { profile } = useAuth()
  const { elections, loading, refreshElections } = useCreatorElection()
  const [finalizingId, setFinalizingId] = useState<string | null>(null)
  const [finalizeMessage, setFinalizeMessage] = useState<string | null>(null)

  const isApproved = profile?.approval_status === 'approved'
  const liveCount = elections.filter((e) => creatorPhaseBadge(e).live).length
  const publishedCount = elections.filter((e) => e.status === 'published' || e.status === 'active').length
  const primaryLive = elections.find((e) => creatorPhaseBadge(e).live)

  async function handleFinalizeVoterRoll(electionId: string) {
    const election = elections.find((e) => e.id === electionId)
    if (!election) return
    const regStats = await fetchElectionRegistrationStats(electionId)
    if (regStats.registered_count === 0) {
      if (
        !window.confirm(
          `No voters registered for "${election.title}" yet. Finalizing will close registration permanently. Continue?`,
        )
      ) {
        return
      }
    } else if (
      !window.confirm(
        `Finalize voter roll for "${election.title}"? This emails secret IDs to ${regStats.registered_count} voter(s) and cannot be undone.`,
      )
    ) {
      return
    }
    setFinalizingId(electionId)
    setFinalizeMessage(null)
    try {
      const { finalize, email } = await finalizeAndEmailSecretVoterIds(electionId)
      setFinalizeMessage(`Assigned ${finalize.assigned_count} ID(s). Emailed ${email.sent} voter(s).`)
      await refreshElections()
    } catch (err) {
      setFinalizeMessage(err instanceof Error ? err.message : 'Finalization failed')
    } finally {
      setFinalizingId(null)
    }
  }

  return (
    <>
      <CreatorApprovalBanner />
      <CreatorPageHeader
        eyebrow={meta.eyebrow}
        title={meta.title}
        subtitle={meta.subtitle}
        actions={
          isApproved ? (
            <Link to="/creator/elections/new" className="btn btn-primary">
              + New Election
            </Link>
          ) : null
        }
      />

      {finalizeMessage ? <div className="alert-banner alert-banner--success">{finalizeMessage}</div> : null}

      {isApproved ? (
        <>
          <div className="stat-grid">
            <div className="stat-card">
              <div className="stat-icon-row">
                <div className="stat-icon" style={{ background: '#DBEAFE', color: '#2563EB' }}>
                  <svg viewBox="0 0 24 24" aria-hidden>
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                  </svg>
                </div>
                {liveCount > 0 ? <span className="stat-delta du">{liveCount} live</span> : null}
              </div>
              <div className="stat-num">{elections.length}</div>
              <div className="stat-label">My Elections</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#DCFCE7', color: '#16A34A', marginBottom: 14 }}>
                <svg viewBox="0 0 24 24" aria-hidden>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div className="stat-num">{publishedCount}</div>
              <div className="stat-label">Published / Active</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#EDE9FE', color: '#6D28D9', marginBottom: 14 }}>
                <svg viewBox="0 0 24 24" aria-hidden>
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                </svg>
              </div>
              <div className="stat-num">{elections.filter((e) => e.voter_roll_finalized_at).length}</div>
              <div className="stat-label">Rolls Finalized</div>
            </div>
            <div className="stat-card">
              <Link to="/creator/elections/new" className="stat-num" style={{ fontSize: 20, textDecoration: 'none' }}>
                Create →
              </Link>
              <div className="stat-label">New Election</div>
            </div>
          </div>

          <div className="grid-2" style={{ marginBottom: 20 }}>
            <div className="card-elevated">
              <div className="card-header">
                <div>
                  <div className="card-title">My Elections</div>
                  <div className="card-subtitle">Recent elections you manage</div>
                </div>
                <Link to="/creator/elections" className="btn btn-sm btn-ghost">
                  View all
                </Link>
              </div>
              <div className="table-wrap">
                {loading ? (
                  <p style={{ padding: 16, fontSize: 13, color: 'var(--subtle)' }}>Loading…</p>
                ) : elections.length === 0 ? (
                  <p style={{ padding: 16, fontSize: 13, color: 'var(--subtle)' }}>
                    No elections yet. <Link to="/creator/elections/new">Create one</Link>.
                  </p>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Status</th>
                        <th>Roll</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {elections.slice(0, 6).map((e) => {
                        const badge = creatorPhaseBadge(e)
                        return (
                          <tr key={e.id}>
                            <td>
                              <strong>{e.title}</strong>
                              <div style={{ fontSize: 10, fontFamily: 'IBM Plex Mono, monospace', color: 'var(--subtle)' }}>
                                {electionShortCode(e.id)}
                              </div>
                            </td>
                            <td>
                              <span className={badge.className}>
                                {badge.live ? <span className="b-dot" /> : null}
                                {badge.label}
                              </span>
                            </td>
                            <td>{e.voter_roll_finalized_at ? 'Finalized' : 'Open'}</td>
                            <td>
                              <Link to={`/creator/elections/${e.id}`} className="btn btn-xs btn-primary">
                                Open
                              </Link>
                              {!e.voter_roll_finalized_at && e.status !== 'draft' ? (
                                <button
                                  type="button"
                                  className="btn btn-xs btn-ghost"
                                  style={{ marginLeft: 6 }}
                                  disabled={finalizingId === e.id}
                                  onClick={() => void handleFinalizeVoterRoll(e.id)}
                                >
                                  {finalizingId === e.id ? '…' : 'Finalize'}
                                </button>
                              ) : null}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {primaryLive ? (
                <div className="card-elevated">
                  <div className="card-header">
                    <div>
                      <div className="card-title">Live: {primaryLive.title}</div>
                      <div className="card-subtitle">{electionShortCode(primaryLive.id)}</div>
                    </div>
                    <span className="badge b-live">
                      <span className="b-dot" /> Live
                    </span>
                  </div>
                  <div className="card-body">
                    <div style={{ display: 'flex', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'IBM Plex Mono, monospace' }}>
                          {formatTimeRemaining(primaryLive.end_date)}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--subtle)' }}>Remaining</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 22, fontWeight: 800 }}>{primaryLive.max_voters}</div>
                        <div style={{ fontSize: 10, color: 'var(--subtle)' }}>Capacity</div>
                      </div>
                    </div>
                    <Link to={`/creator/elections/${primaryLive.id}`} className="btn btn-sm btn-primary">
                      Election details
                    </Link>
                  </div>
                </div>
              ) : null}

              <div className="card">
                <div className="card-header">
                  <div className="card-title">Quick links</div>
                </div>
                <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <Link to="/creator/control" className="btn btn-sm btn-ghost">
                    Voting control
                  </Link>
                  <Link to="/creator/participants" className="btn btn-sm btn-ghost">
                    Participants
                  </Link>
                  <Link to="/creator/results" className="btn btn-sm btn-ghost">
                    Results
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="card-elevated">
            <div className="card-header">
              <div className="card-title">Activity timeline</div>
            </div>
            <div className="card-body">
              <div className="timeline">
                {elections.slice(0, 5).map((e) => (
                  <div key={e.id} className="tl-item">
                    <div className="tl-dot" style={{ background: 'var(--card)' }}>
                      <div className="tl-dot-inner" style={{ background: 'var(--blue)' }} />
                    </div>
                    <div className="tl-title">{e.title}</div>
                    <div className="tl-sub">
                      {e.status} · updated {formatSubmissionDate(e.updated_at ?? e.start_date)}
                    </div>
                  </div>
                ))}
                {elections.length === 0 ? (
                  <p style={{ fontSize: 12, color: 'var(--subtle)' }}>No activity yet.</p>
                ) : null}
              </div>
            </div>
          </div>
        </>
      ) : null}
    </>
  )
}
