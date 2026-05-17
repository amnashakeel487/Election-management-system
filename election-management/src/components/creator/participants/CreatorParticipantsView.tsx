import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  fetchCreatorElectionParticipants,
  fetchCreatorParticipantStats,
} from '@/services/participantsService'
import {
  promoteNextWaitlistSlots,
  promoteWaitlistedParticipant,
  rejectElectionParticipant,
} from '@/services/waitlistService'
import { sendSecretVoterIdEmails } from '@/services/secretVoterIdService'
import type { Election } from '@/types/election'
import type {
  CreatorParticipantRow,
  CreatorParticipantStats,
  CreatorParticipantsTab,
} from '@/types/creatorParticipants'
import { formatDashboardNumber } from '@/utils/dashboardDisplay'
import { electionShortCode } from '@/utils/creatorDisplay'

function formatRegisteredOn(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function displayVoterId(row: CreatorParticipantRow): string {
  if (row.secret_voter_id?.trim()) return row.secret_voter_id.trim()
  return `REG-${row.registration_id.replace(/-/g, '').slice(0, 8).toUpperCase()}`
}

function secretIdStatus(row: CreatorParticipantRow): 'issued' | 'pending' | 'na' {
  if (row.status !== 'registered') return 'na'
  if (row.secret_voter_id?.trim()) return 'issued'
  return 'pending'
}

interface CreatorParticipantsViewProps {
  elections: Election[]
  electionsLoading: boolean
  selectedId: string | null
  selectedElection: Election | null
  onSelectElection: (id: string | null) => void
  onRefreshElections: () => Promise<void>
}

export function CreatorParticipantsView({
  elections,
  electionsLoading,
  selectedId,
  selectedElection,
  onSelectElection,
  onRefreshElections,
}: CreatorParticipantsViewProps) {
  const [tab, setTab] = useState<CreatorParticipantsTab>('registered')
  const [rows, setRows] = useState<CreatorParticipantRow[]>([])
  const [stats, setStats] = useState<CreatorParticipantStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [bulkBusy, setBulkBusy] = useState(false)
  const [viewRow, setViewRow] = useState<CreatorParticipantRow | null>(null)

  const rollFinalized = Boolean(selectedElection?.voter_roll_finalized_at)
  const electionLabel = selectedElection
    ? `${electionShortCode(selectedElection.id)} — ${selectedElection.title}`
    : ''

  const load = useCallback(async () => {
    if (!selectedId || !selectedElection || selectedElection.status === 'draft') {
      setRows([])
      setStats(null)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const list = await fetchCreatorElectionParticipants(selectedId)
      setRows(list)
      setStats(await fetchCreatorParticipantStats(selectedId, list))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load participants')
      setRows([])
      setStats(null)
    } finally {
      setLoading(false)
    }
  }, [selectedId, selectedElection])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!message) return
    const t = window.setTimeout(() => setMessage(null), 4000)
    return () => window.clearTimeout(t)
  }, [message])

  const waitlistRows = useMemo(() => rows.filter((r) => r.status === 'waitlisted'), [rows])
  const registeredRows = useMemo(() => rows.filter((r) => r.status === 'registered'), [rows])

  const tableRows = useMemo(() => {
    if (tab === 'waitlist') return waitlistRows
    if (tab === 'final') return registeredRows
    return registeredRows
  }, [tab, waitlistRows, registeredRows])

  const spotsOpen =
    stats != null && stats.registered_count < stats.max_voters && !rollFinalized

  async function handlePromoteOne(registrationId: string) {
    if (!selectedId) return
    setBusyId(registrationId)
    setError(null)
    try {
      await promoteWaitlistedParticipant(registrationId, selectedId)
      setMessage('Voter promoted from waitlist.')
      await load()
      await onRefreshElections()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Promotion failed')
    } finally {
      setBusyId(null)
    }
  }

  async function handlePromoteNext() {
    if (!selectedId || !spotsOpen) return
    setBulkBusy(true)
    setError(null)
    try {
      const result = await promoteNextWaitlistSlots(selectedId, 5)
      const count = result.promoted_count ?? result.promoted?.length ?? 0
      setMessage(count > 0 ? `Promoted ${count} voter(s).` : 'No waitlisted voters to promote.')
      await load()
      await onRefreshElections()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bulk promotion failed')
    } finally {
      setBulkBusy(false)
    }
  }

  async function handleRemove(row: CreatorParticipantRow) {
    if (!selectedId) return
    const label = row.full_name?.trim() || row.email
    if (!window.confirm(`Remove "${label}" from this election?`)) return
    setBusyId(row.registration_id)
    setError(null)
    try {
      await rejectElectionParticipant(row.registration_id, selectedId)
      setMessage('Participant removed.')
      await load()
      await onRefreshElections()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Remove failed')
    } finally {
      setBusyId(null)
    }
  }

  async function handleResendIds() {
    if (!selectedId) return
    setBulkBusy(true)
    setError(null)
    try {
      const result = await sendSecretVoterIdEmails(selectedId)
      setMessage(`Resent secret IDs to ${result.sent} voter(s).`)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Resend failed')
    } finally {
      setBulkBusy(false)
    }
  }

  return (
    <div className="creator-participants-page">
      <header className="cp-header">
        <h1 className="cp-title">Participants</h1>
        <p className="cp-subtitle">
          {selectedElection ? (
            <>
              Voter registrations and waitlist for <strong>{electionLabel}</strong>
            </>
          ) : (
            'Voter registrations and waitlist for your election'
          )}
        </p>
      </header>

      {elections.length > 0 ? (
        <div className="cp-toolbar">
          <div className="cp-election-field">
            <label htmlFor="cp-election-select">Active election</label>
            <select
              id="cp-election-select"
              value={selectedId ?? ''}
              disabled={electionsLoading}
              onChange={(e) => onSelectElection(e.target.value || null)}
            >
              {elections.map((e) => (
                <option key={e.id} value={e.id}>
                  {electionShortCode(e.id)} — {e.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      ) : null}

      {error ? <div className="cp-alert error">{error}</div> : null}
      {message ? (
        <div className="cp-alert success" role="status">
          {message}
        </div>
      ) : null}

      {!selectedElection ? (
        <p style={{ fontSize: 13, color: '#64748b' }}>Select an election to manage participants.</p>
      ) : selectedElection.status === 'draft' ? (
        <div className="cp-draft-card">
          <p>Publish this election before managing voter registrations.</p>
          <Link to={`/creator/elections/${selectedElection.id}/edit`} className="cp-draft-link">
            Open creation wizard
          </Link>
        </div>
      ) : (
        <>
          {stats ? (
            <div className="cp-stats">
              <div className="cp-stat-card">
                <div>
                  <div className="cp-stat-num">{formatDashboardNumber(stats.registered_count)}</div>
                  <div className="cp-stat-label">Registered</div>
                </div>
                <div className="cp-stat-icon green" aria-hidden>
                  <svg viewBox="0 0 24 24">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
              </div>
              <div className="cp-stat-card">
                <div>
                  <div className="cp-stat-num">{formatDashboardNumber(stats.voted_count)}</div>
                  <div className="cp-stat-label">Voted</div>
                </div>
                <div className="cp-stat-icon blue" aria-hidden>
                  <svg viewBox="0 0 24 24">
                    <polyline points="9 11 12 14 22 4" />
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                  </svg>
                </div>
              </div>
              <div className="cp-stat-card">
                <div>
                  <div className="cp-stat-num">{formatDashboardNumber(stats.waitlist_count)}</div>
                  <div className="cp-stat-label">Waitlist</div>
                </div>
                <div className="cp-stat-icon amber" aria-hidden>
                  <svg viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
              </div>
              <div className="cp-stat-card">
                <div>
                  <div className="cp-stat-num">{stats.turnout_percent}%</div>
                  <div className="cp-stat-label">Turnout</div>
                </div>
                <div className="cp-stat-icon cyan" aria-hidden>
                  <svg viewBox="0 0 24 24">
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                    <polyline points="17 6 23 6 23 12" />
                  </svg>
                </div>
              </div>
            </div>
          ) : null}

          <div className="cp-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              className={`cp-tab${tab === 'registered' ? ' active' : ''}`}
              aria-selected={tab === 'registered'}
              onClick={() => setTab('registered')}
            >
              Registered Voters
            </button>
            <button
              type="button"
              role="tab"
              className={`cp-tab${tab === 'waitlist' ? ' active' : ''}`}
              aria-selected={tab === 'waitlist'}
              onClick={() => setTab('waitlist')}
            >
              Waitlist ({stats?.waitlist_count ?? waitlistRows.length})
            </button>
            <button
              type="button"
              role="tab"
              className={`cp-tab${tab === 'final' ? ' active' : ''}`}
              aria-selected={tab === 'final'}
              onClick={() => setTab('final')}
            >
              Final Voter List
            </button>
          </div>

          <div className="cp-panel">
            {tab === 'waitlist' ? (
              <div className="cp-panel-head">
                <p>
                  {rollFinalized
                    ? 'Voter roll is finalized. Waitlist promotions are disabled.'
                    : spotsOpen
                      ? `${formatDashboardNumber(stats?.registered_count ?? 0)}/${formatDashboardNumber(stats?.max_voters ?? 0)} registered · ${waitlistRows.length} waiting`
                      : 'Registration is at capacity.'}
                </p>
                {spotsOpen && waitlistRows.length > 0 ? (
                  <button
                    type="button"
                    className="cp-promote-btn"
                    disabled={bulkBusy}
                    onClick={() => void handlePromoteNext()}
                  >
                    {bulkBusy ? 'Promoting…' : 'Promote next'}
                  </button>
                ) : null}
              </div>
            ) : tab === 'final' && !rollFinalized ? (
              <div className="cp-panel-head">
                <p>Finalize the voter roll on the Secret IDs page to lock the final list.</p>
                <Link to="/creator/secret-ids" className="cp-promote-btn" style={{ textDecoration: 'none' }}>
                  Secret IDs
                </Link>
              </div>
            ) : null}

            {loading ? (
              <div className="cp-empty">Loading participants…</div>
            ) : tableRows.length === 0 ? (
              <div className="cp-empty">
                {tab === 'waitlist'
                  ? 'No one on the waitlist.'
                  : tab === 'final' && !rollFinalized
                    ? 'No finalized voter list yet.'
                    : 'No registered voters yet.'}
              </div>
            ) : (
              <div className="cp-table-wrap">
                <table className="cp-table">
                  <thead>
                    <tr>
                      {tab === 'waitlist' ? <th>#</th> : null}
                      <th>Voter ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Registered on</th>
                      {tab !== 'waitlist' ? <th>Voted</th> : null}
                      {tab !== 'waitlist' ? <th>Secret ID status</th> : null}
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableRows.map((row) => {
                      const sid = secretIdStatus(row)
                      const busy = busyId === row.registration_id
                      return (
                        <tr key={row.registration_id}>
                          {tab === 'waitlist' ? (
                            <td className="cp-voter-id">{row.waitlist_position ?? '—'}</td>
                          ) : null}
                          <td className="cp-voter-id">{displayVoterId(row)}</td>
                          <td>
                            <div className="cp-name">{row.full_name?.trim() || '—'}</div>
                          </td>
                          <td>
                            <div className="cp-email">{row.email}</div>
                          </td>
                          <td>{formatRegisteredOn(row.created_at)}</td>
                          {tab !== 'waitlist' ? (
                            <td>
                              {row.voted_at ? (
                                <span className="cp-voted-yes">✓ VOTED</span>
                              ) : (
                                <span className="cp-voted-no">NOT VOTED</span>
                              )}
                            </td>
                          ) : null}
                          {tab !== 'waitlist' ? (
                            <td>
                              <span className={`cp-pill ${sid}`}>
                                {sid === 'issued' ? 'ISSUED' : sid === 'pending' ? 'PENDING' : '—'}
                              </span>
                            </td>
                          ) : null}
                          <td>
                            <div className="cp-actions">
                              <button
                                type="button"
                                className="cp-act view"
                                onClick={() => setViewRow(row)}
                              >
                                View
                              </button>
                              {tab === 'waitlist' && spotsOpen ? (
                                <button
                                  type="button"
                                  className="cp-act promote"
                                  disabled={busy}
                                  onClick={() => void handlePromoteOne(row.registration_id)}
                                >
                                  Promote
                                </button>
                              ) : null}
                              {tab !== 'waitlist' && sid === 'pending' && !rollFinalized ? (
                                <Link to="/creator/secret-ids" className="cp-act issue">
                                  Issue ID
                                </Link>
                              ) : null}
                              {tab !== 'waitlist' && sid === 'issued' ? (
                                <button
                                  type="button"
                                  className="cp-act resend"
                                  disabled={bulkBusy}
                                  onClick={() => void handleResendIds()}
                                >
                                  Resend ID
                                </button>
                              ) : null}
                              {!row.voted_at && !rollFinalized ? (
                                <button
                                  type="button"
                                  className="cp-act remove"
                                  disabled={busy}
                                  onClick={() => void handleRemove(row)}
                                >
                                  Remove
                                </button>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {viewRow ? (
        <div
          className="cp-modal-backdrop"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setViewRow(null)
          }}
        >
          <div className="cp-modal" role="dialog" aria-labelledby="cp-view-title">
            <h3 id="cp-view-title">{viewRow.full_name?.trim() || viewRow.email}</h3>
            <p className="cp-modal-sub">{viewRow.email}</p>
            <dl className="cp-modal-dl">
              <div>
                <dt>Voter ID</dt>
                <dd>{displayVoterId(viewRow)}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>{viewRow.status}</dd>
              </div>
              <div>
                <dt>Registered</dt>
                <dd>{formatRegisteredOn(viewRow.created_at)}</dd>
              </div>
              {viewRow.status === 'registered' ? (
                <>
                  <div>
                    <dt>Voted</dt>
                    <dd>{viewRow.voted_at ? 'Yes' : 'No'}</dd>
                  </div>
                  <div>
                    <dt>Secret ID</dt>
                    <dd>{viewRow.secret_voter_id?.trim() || 'Not issued'}</dd>
                  </div>
                </>
              ) : null}
              {viewRow.waitlist_position != null ? (
                <div>
                  <dt>Waitlist #</dt>
                  <dd>{viewRow.waitlist_position}</dd>
                </div>
              ) : null}
            </dl>
            <button type="button" className="cp-modal-close" onClick={() => setViewRow(null)}>
              Close
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
