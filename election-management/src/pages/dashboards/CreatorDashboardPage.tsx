import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { VoteSecureDashboardShell } from '@/components/dashboard/VoteSecureDashboardShell'
import { useAuth } from '@/hooks/useAuth'
import { fetchCreatorElections } from '@/services/electionService'
import { fetchElectionRegistrationStats } from '@/services/voterRegistrationService'
import { finalizeAndEmailSecretVoterIds } from '@/services/secretVoterIdService'
import type { Election } from '@/types/election'
import {
  electionDisplayStatus,
  statusBadgeClass,
} from '@/utils/dashboardDisplay'
import { formatElectionCode, formatTimeRemaining } from '@/utils/electionTime'

export function CreatorDashboardPage() {
  const { profile } = useAuth()
  const [elections, setElections] = useState<Election[]>([])
  const [loading, setLoading] = useState(true)
  const [finalizingId, setFinalizingId] = useState<string | null>(null)
  const [finalizeMessage, setFinalizeMessage] = useState<string | null>(null)

  const status = profile?.approval_status
  const isPending = status === 'pending'
  const isRejected = status === 'rejected'
  const isApproved = status === 'approved'

  useEffect(() => {
    if (!profile?.id || !isApproved) {
      setLoading(false)
      return
    }
    void fetchCreatorElections(profile.id)
      .then(setElections)
      .finally(() => setLoading(false))
  }, [profile?.id, isApproved])

  const liveCount = elections.filter((e) => {
    const phase = electionDisplayStatus(e.status, e.start_date, e.end_date)
    return phase === 'active'
  }).length

  const publishedCount = elections.filter((e) => e.status === 'published' || e.status === 'active').length

  const primaryLive = elections.find((e) => electionDisplayStatus(e.status, e.start_date, e.end_date) === 'active')

  async function reloadElections() {
    if (!profile?.id) return
    setElections(await fetchCreatorElections(profile.id))
  }

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
      await reloadElections()
    } catch (err) {
      setFinalizeMessage(err instanceof Error ? err.message : 'Finalization failed')
    } finally {
      setFinalizingId(null)
    }
  }

  const topbarExtra = (
    <>
      <button type="button" className="vs-tb-btn" aria-label="Notifications">
        <svg viewBox="0 0 24 24" aria-hidden>
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        </svg>
      </button>
      {isApproved ? (
        <Link to="/creator/elections/new" className="vs-btn-create">
          <svg viewBox="0 0 24 24" aria-hidden>
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Election
        </Link>
      ) : null}
    </>
  )

  const crumb = isApproved
    ? `Manage your elections · ${liveCount} active, ${elections.length - liveCount} other`
    : 'Election creator account'

  return (
    <VoteSecureDashboardShell
      role="creator"
      pageTitle="Creator Dashboard"
      pageCrumb={crumb}
      electionCount={elections.length}
      showSearch={false}
      topbarExtra={topbarExtra}
    >
      {isPending ? (
        <div className="vs-pending-banner">
          <strong>Pending admin approval</strong>
          <p style={{ marginTop: 8, fontSize: 13, color: 'var(--vs-muted)' }}>
            Your election creator access request is under review. You can create elections once approved.
          </p>
        </div>
      ) : null}

      {isRejected ? (
        <div className="vs-alert vs-alert--error">Your creator application was rejected.</div>
      ) : null}

      {finalizeMessage ? <div className="vs-alert vs-alert--success">{finalizeMessage}</div> : null}

      {isApproved ? (
        <>
          <div className="vs-stat-grid">
            <div className="vs-stat-card vs-stat-card--blue">
              <div className="vs-stat-icon vs-stat-icon--blue">
                <svg viewBox="0 0 24 24" aria-hidden>
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                </svg>
              </div>
              <div className="vs-stat-num">{elections.length}</div>
              <div className="vs-stat-label">My Elections</div>
              {liveCount > 0 ? <div className="vs-stat-delta">{liveCount} live now</div> : null}
            </div>
            <div className="vs-stat-card vs-stat-card--green">
              <div className="vs-stat-icon vs-stat-icon--green">
                <svg viewBox="0 0 24 24" aria-hidden>
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                </svg>
              </div>
              <div className="vs-stat-num">{publishedCount}</div>
              <div className="vs-stat-label">Published / Active</div>
            </div>
            <div className="vs-stat-card vs-stat-card--purple">
              <div className="vs-stat-icon vs-stat-icon--purple">
                <svg viewBox="0 0 24 24" aria-hidden>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div className="vs-stat-num">{elections.filter((e) => e.voter_roll_finalized_at).length}</div>
              <div className="vs-stat-label">Rolls Finalized</div>
            </div>
            <div className="vs-stat-card vs-stat-card--cyan">
              <div className="vs-stat-icon vs-stat-icon--cyan">
                <svg viewBox="0 0 24 24" aria-hidden>
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </div>
              <Link to="/creator/elections/new" className="vs-stat-num" style={{ fontSize: 18, textDecoration: 'none' }}>
                Create →
              </Link>
              <div className="vs-stat-label">New Election</div>
            </div>
          </div>

          <div className="vs-dash-grid">
            <div className="vs-panel">
              <div className="vs-panel-head">
                <div>
                  <div className="vs-panel-title">My Elections</div>
                  <div className="vs-panel-sub">All elections you have created</div>
                </div>
                <Link to="/creator/elections/new" className="vs-panel-action">
                  + Create New
                </Link>
              </div>
              <div className="vs-panel-body vs-panel-body--flush">
                <div className="vs-table-wrap">
                  {loading ? (
                    <p className="vs-empty">Loading elections…</p>
                  ) : elections.length === 0 ? (
                    <p className="vs-empty">
                      No elections yet.{' '}
                      <Link to="/creator/elections/new">Create your first election</Link>.
                    </p>
                  ) : (
                    <table className="vs-table">
                      <thead>
                        <tr>
                          <th>Title</th>
                          <th>Status</th>
                          <th>Roll</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {elections.map((e) => {
                          const phase = electionDisplayStatus(e.status, e.start_date, e.end_date)
                          return (
                            <tr key={e.id}>
                              <td>
                                <div style={{ fontWeight: 700 }}>{e.title}</div>
                                <div className="vs-t-mono">{formatElectionCode(e.id)}</div>
                              </td>
                              <td>
                                <span className={`vs-t-badge ${statusBadgeClass(phase)}`}>
                                  {phase === 'active' ? <span className="vs-t-pulse" /> : null}
                                  {phase}
                                </span>
                              </td>
                              <td className="vs-t-mono">
                                {e.voter_roll_finalized_at ? 'Finalized' : 'Open'}
                              </td>
                              <td>
                                <div className="vs-t-actions">
                                  <Link to={`/creator/elections/${e.id}`} className="vs-t-btn vs-t-btn--primary">
                                    Details
                                  </Link>
                                  {!e.voter_roll_finalized_at ? (
                                    <button
                                      type="button"
                                      className="vs-t-btn"
                                      disabled={finalizingId === e.id}
                                      onClick={() => void handleFinalizeVoterRoll(e.id)}
                                    >
                                      {finalizingId === e.id ? '…' : 'Finalize roll'}
                                    </button>
                                  ) : null}
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>

            <div className="vs-dash-col">
              {primaryLive ? (
                <div className="vs-panel">
                  <div className="vs-panel-head">
                    <div>
                      <div className="vs-panel-title">Live: {primaryLive.title}</div>
                      <div className="vs-panel-sub">{formatElectionCode(primaryLive.id)}</div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#10B981' }}>● Live</span>
                  </div>
                  <div className="vs-panel-body">
                    <div className="vs-quick-strip">
                      <div className="vs-quick-stat">
                        <div className="vs-quick-num">{formatTimeRemaining(primaryLive.end_date)}</div>
                        <div className="vs-quick-lbl">Remaining</div>
                      </div>
                      <div className="vs-quick-stat">
                        <div className="vs-quick-num">{primaryLive.max_voters.toLocaleString()}</div>
                        <div className="vs-quick-lbl">Capacity</div>
                      </div>
                      <div className="vs-quick-stat">
                        <div className="vs-quick-num">{primaryLive.real_time_results ? 'On' : 'Off'}</div>
                        <div className="vs-quick-lbl">Live results</div>
                      </div>
                    </div>
                    <Link to={`/creator/elections/${primaryLive.id}`} className="vs-panel-action" style={{ display: 'inline-block' }}>
                      Election details &amp; QR invite
                    </Link>
                  </div>
                </div>
              ) : null}

              <div className="vs-panel">
                <div className="vs-panel-head">
                  <div className="vs-panel-title">Voting control</div>
                </div>
                <div className="vs-panel-body" style={{ padding: 16 }}>
                  <div className="vs-control-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <strong style={{ fontSize: 13 }}>Registration</strong>
                      <span className="vs-t-badge vs-t-badge--active">Managed</span>
                    </div>
                    <p style={{ fontSize: 11, color: 'var(--vs-subtle)', marginBottom: 12 }}>
                      Finalize the voter roll to issue secret IDs and close registration before voting opens.
                    </p>
                  </div>
                  <div className="vs-control-card" style={{ marginBottom: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <strong style={{ fontSize: 13 }}>Anonymous ballots</strong>
                      <span className="vs-t-badge vs-t-badge--completed">On</span>
                    </div>
                    <p style={{ fontSize: 11, color: 'var(--vs-subtle)' }}>
                      Votes are stored in anonymous_ballots without linking identity to choice.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="vs-dash-grid-3">
            <div className="vs-panel">
              <div className="vs-panel-head">
                <div className="vs-panel-title">Turnout overview</div>
              </div>
              <div className="vs-panel-body">
                {elections.slice(0, 4).map((e) => {
                  const phase = electionDisplayStatus(e.status, e.start_date, e.end_date)
                  const pct = phase === 'completed' ? 83 : phase === 'active' ? 62 : 0
                  return (
                    <div key={e.id} className="vs-turnout-item">
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 700 }}>{e.title}</span>
                        <span className={`vs-t-badge ${statusBadgeClass(phase)}`}>{phase}</span>
                      </div>
                      {pct > 0 ? (
                        <div className="vs-turnout-bar">
                          <div
                            className="vs-turnout-fill"
                            style={{
                              width: `${pct}%`,
                              background: 'linear-gradient(90deg,#10B981,#059669)',
                            }}
                          />
                        </div>
                      ) : (
                        <span className="vs-t-mono">—</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="vs-panel">
              <div className="vs-panel-head">
                <div className="vs-panel-title">Draft &amp; upcoming</div>
              </div>
              <div className="vs-panel-body">
                {elections.filter((e) => e.status === 'draft' || electionDisplayStatus(e.status, e.start_date, e.end_date) === 'upcoming').length === 0 ? (
                  <p className="vs-empty">No draft or upcoming elections.</p>
                ) : (
                  elections
                    .filter((e) => e.status === 'draft' || electionDisplayStatus(e.status, e.start_date, e.end_date) === 'upcoming')
                    .slice(0, 5)
                    .map((e) => (
                      <p key={e.id} style={{ fontSize: 12, marginBottom: 8 }}>
                        <strong>{e.title}</strong>
                        <span className="vs-t-mono" style={{ display: 'block' }}>
                          Starts {new Date(e.start_date).toLocaleDateString()}
                        </span>
                      </p>
                    ))
                )}
              </div>
            </div>
            <div className="vs-panel">
              <div className="vs-panel-head">
                <div className="vs-panel-title">Resources</div>
              </div>
              <div className="vs-panel-body" style={{ fontSize: 12, color: 'var(--vs-muted)', lineHeight: 1.6 }}>
                <p>Finalize voter rolls before polling opens.</p>
                <p style={{ marginTop: 8 }}>Use Brevo for secret ID emails — see docs.</p>
                <Link to="/creator/elections/new" className="vs-panel-action" style={{ marginTop: 12, display: 'inline-block' }}>
                  Launch wizard
                </Link>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </VoteSecureDashboardShell>
  )
}
