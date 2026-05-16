import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { VoterRollLockPanel } from '@/components/election/VoterRollLockPanel'
import { fetchElectionById } from '@/services/electionService'
import { fetchElectionResults } from '@/services/resultsService'
import type { ElectionWithCandidates } from '@/types/election'
import type { ElectionResultsPayload } from '@/types/electionResults'
import { adminElectionBadgeClass, shortElectionCode } from '@/utils/adminDisplay'
import { electionDisplayStatus, formatDashboardNumber } from '@/utils/dashboardDisplay'
import { formatSubmissionDate } from '@/utils/formatDate'

export function AdminElectionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [election, setElection] = useState<ElectionWithCandidates | null>(null)
  const [results, setResults] = useState<ElectionResultsPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    setError(null)
    void Promise.all([
      fetchElectionById(id),
      fetchElectionResults(id).catch(() => null),
    ])
      .then(([e, r]) => {
        setElection(e)
        setResults(r)
        if (!e) setError('Election not found')
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load election'))
      .finally(() => setLoading(false))
  }, [id])

  const phase =
    election != null
      ? electionDisplayStatus(election.status, election.start_date, election.end_date)
      : 'pending'

  const candidates = results?.candidates?.length
    ? results.candidates
    : (election?.candidates ?? []).map((c) => ({
        candidate_id: c.id,
        name: c.name,
        description: c.description,
        sort_order: c.sort_order,
        vote_count: 0,
      }))

  const maxVotes = Math.max(1, ...candidates.map((c) => c.vote_count ?? 0))

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <Link to="/admin/elections" className="btn btn-ghost btn-sm" style={{ gap: 5 }}>
          <svg
            viewBox="0 0 24 24"
            style={{
              width: 13,
              height: 13,
              stroke: 'currentColor',
              fill: 'none',
              strokeWidth: 2,
              strokeLinecap: 'round',
              strokeLinejoin: 'round',
            }}
            aria-hidden
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back
        </Link>
        {election ? (
          <>
            <div className="page-title" style={{ margin: 0 }}>
              {shortElectionCode(election.id)} — {election.title}
            </div>
            <span className={adminElectionBadgeClass(election.status, election.start_date, election.end_date)}>
              {phase === 'active' ? <span className="badge-dot" /> : null}
              {phase}
            </span>
          </>
        ) : null}
      </div>

      {error ? <div className="alert alert-danger">{error}</div> : null}

      {loading ? (
        <p style={{ color: 'var(--subtle)', fontSize: 13 }}>Loading election…</p>
      ) : election ? (
        <>
          <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
            <div className="stat-card">
              <div className="stat-num">{formatDashboardNumber(results?.registered_voters ?? 0)}</div>
              <div className="stat-label">Registered Voters</div>
            </div>
            <div className="stat-card">
              <div className="stat-num">{formatDashboardNumber(results?.total_votes ?? 0)}</div>
              <div className="stat-label">Votes Cast</div>
            </div>
            <div className="stat-card">
              <div className="stat-num">{results?.turnout_percent?.toFixed(1) ?? '0'}%</div>
              <div className="stat-label">Turnout</div>
            </div>
            <div className="stat-card">
              <div className="stat-num">{candidates.length}</div>
              <div className="stat-label">Candidates</div>
            </div>
          </div>

          <div className="grid-2" style={{ marginBottom: 16 }}>
            <div className="card-elevated">
              <div className="card-header">
                <div className="card-title">Candidate Standings</div>
              </div>
              <div className="card-body">
                {candidates.length === 0 ? (
                  <p style={{ color: 'var(--subtle)', fontSize: 12 }}>No candidates yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {[...candidates]
                      .sort((a, b) => (b.vote_count ?? 0) - (a.vote_count ?? 0))
                      .map((c) => (
                        <div key={c.candidate_id}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span style={{ fontSize: 12, fontWeight: 600 }}>{c.name}</span>
                            <span
                              style={{
                                fontFamily: "'IBM Plex Mono', monospace",
                                fontSize: 11,
                                color: 'var(--blue)',
                              }}
                            >
                              {formatDashboardNumber(c.vote_count ?? 0)}
                            </span>
                          </div>
                          <div className="progress-wrap">
                            <div
                              className="progress-fill"
                              style={{
                                width: `${((c.vote_count ?? 0) / maxVotes) * 100}%`,
                                background: 'linear-gradient(90deg,#2451A3,#6C3FC5)',
                              }}
                            />
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>

            <div className="card-elevated">
              <div className="card-header">
                <div className="card-title">Election Info</div>
              </div>
              <div className="card-body" style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>
                <p>
                  <strong>Window:</strong> {formatSubmissionDate(election.start_date)} –{' '}
                  {formatSubmissionDate(election.end_date)}
                </p>
                <p>
                  <strong>Status:</strong> {election.status}
                </p>
                {election.description ? <p>{election.description}</p> : null}
              </div>
            </div>
          </div>

          <div className="card-elevated">
            <div className="card-header">
              <div className="card-title">Voter roll (admin override)</div>
            </div>
            <div className="card-body">
              <VoterRollLockPanel
                isAdmin
                election={election}
                onChanged={() => {
                  if (!id) return
                  void fetchElectionById(id).then(setElection)
                }}
              />
            </div>
          </div>
        </>
      ) : null}
    </>
  )
}
