import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ResultsExportToolbar } from '@/components/results/ResultsExportToolbar'
import { CandidateVoterBreakdown } from '@/components/results/CandidateVoterBreakdown'
import {
  RESULT_BAR_COLORS,
  RESULT_BAR_GRADIENTS,
  candidateFirstName,
  enrichResultRows,
  formatCountdownHm,
  turnoutDeltaLabel,
  votesTrendDeltaLabel,
} from '@/components/creator/results/creatorResultsUtils'
import { CANDIDATE_PLACEHOLDER_IMAGES } from '@/constants/electionDetailsAssets'
import { fetchElectionById } from '@/services/electionService'
import type { ElectionWithCandidates } from '@/types/election'
import type { ElectionResultsPayload } from '@/types/electionResults'
import {
  candidateInitial,
  candidatePortraitOrPlaceholder,
  stablePlaceholderIndex,
} from '@/utils/candidateDisplay'
import { formatDashboardNumber } from '@/utils/dashboardDisplay'
import { buildResultsSummary } from '@/utils/resultsDisplay'

export interface CreatorResultsViewProps {
  electionId: string
  results: ElectionResultsPayload
  isLive: boolean
  onRefresh: () => void
}

function CandidateAvatar({
  candidateId,
  name,
  photoUrl,
}: {
  candidateId: string
  name: string
  photoUrl: string | null
}) {
  const idx = stablePlaceholderIndex(candidateId, CANDIDATE_PLACEHOLDER_IMAGES.length)
  const src = photoUrl ?? CANDIDATE_PLACEHOLDER_IMAGES[idx]

  if (photoUrl) {
    return <img src={src} alt="" className="result-avatar" />
  }

  return (
    <span className="result-avatar result-avatar--placeholder" aria-hidden>
      {candidateInitial(name)}
    </span>
  )
}

export function CreatorResultsView({
  electionId,
  results,
  isLive,
  onRefresh,
}: CreatorResultsViewProps) {
  const [electionDetail, setElectionDetail] = useState<ElectionWithCandidates | null>(null)
  const [nowMs, setNowMs] = useState(() => Date.now())
  const [shareMsg, setShareMsg] = useState<string | null>(null)

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 30_000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    let cancelled = false
    void fetchElectionById(electionId)
      .then((data) => {
        if (!cancelled) setElectionDetail(data)
      })
      .catch(() => {
        if (!cancelled) setElectionDetail(null)
      })
    return () => {
      cancelled = true
    }
  }, [electionId])

  const photoByCandidateId = useMemo(() => {
    const map = new Map<string, string | null>()
    for (const c of electionDetail?.candidates ?? []) {
      map.set(c.id, c.photo_url)
    }
    return map
  }, [electionDetail?.candidates])

  const totalVotes = results.total_votes
  const registered = results.registered_voters
  const turnout = results.turnout_percent
  const pending = Math.max(0, registered - totalVotes)
  const invalidVotes = 0

  const rows = enrichResultRows(results.candidates, totalVotes)
  const leader = rows[0] ?? null
  const { outcome } = buildResultsSummary(results)

  const leaderDesignation =
    leader && outcome.type === 'winner' && outcome.candidate.candidate_id === leader.candidate_id
      ? outcome.candidate.designation
      : leader?.designation

  const timeLeft = results.polling_ended ? '00:00' : formatCountdownHm(results.end_date, nowMs)
  const votesDelta = votesTrendDeltaLabel(results.vote_trend ?? [])
  const turnoutDelta = turnoutDeltaLabel(results.vote_trend ?? [], registered)
  const maxShare = rows[0]?.share_percent ?? 0

  async function handleShareLink() {
    const url = `${window.location.origin}/elections/${electionId}/results`
    try {
      await navigator.clipboard.writeText(url)
      setShareMsg('Link copied to clipboard')
    } catch {
      setShareMsg(url)
    }
    window.setTimeout(() => setShareMsg(null), 3000)
  }

  return (
    <div className="creator-results-page">
      <div className="stat-grid creator-results-stats">
        <div className="stat-card">
          <div className="stat-icon-row">
            <div className="stat-icon" style={{ background: '#EFF4FF', color: '#2451A3' }}>
              <svg viewBox="0 0 24 24" aria-hidden>
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
              </svg>
            </div>
            {votesDelta ? <span className="stat-delta du">{votesDelta}</span> : null}
          </div>
          <div className="stat-num">{formatDashboardNumber(totalVotes)}</div>
          <div className="stat-label">Total Votes</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-row">
            <div className="stat-icon" style={{ background: '#DCFCE7', color: '#16A34A' }}>
              <svg viewBox="0 0 24 24" aria-hidden>
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
              </svg>
            </div>
            {turnoutDelta ? <span className="stat-delta du">{turnoutDelta}</span> : null}
          </div>
          <div className="stat-num">{Math.round(turnout)}%</div>
          <div className="stat-label">Turnout</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-row">
            <div className="stat-icon" style={{ background: '#FEF9C3', color: '#CA8A04' }}>
              <svg viewBox="0 0 24 24" aria-hidden>
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
          </div>
          <div className="stat-num">{timeLeft}</div>
          <div className="stat-label">{results.polling_ended ? 'Ended' : 'Time Left'}</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-row">
            <div className="stat-icon" style={{ background: '#FEF2F2', color: '#EF4444' }}>
              <svg viewBox="0 0 24 24" aria-hidden>
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              </svg>
            </div>
          </div>
          <div className="stat-num">{formatDashboardNumber(invalidVotes)}</div>
          <div className="stat-label">Invalid Votes</div>
        </div>
      </div>

      <div className="grid-7-3 creator-results-grid">
        <div className="card-elevated">
          <div className="card-header">
            <div className="card-title">Live Vote Standings</div>
            {isLive ? (
              <span className="badge b-live">
                <span className="b-dot" /> Live
              </span>
            ) : (
              <button type="button" className="btn btn-sm btn-ghost" onClick={() => onRefresh()}>
                Refresh
              </button>
            )}
          </div>
          <div className="card-body">
            {leader ? (
              <div className="winner-card winner-card--leader">
                <div className="winner-label">🏆 Current Leader</div>
                <div className="winner-leader-row">
                  {photoByCandidateId.get(leader.candidate_id) ? (
                    <img
                      src={candidatePortraitOrPlaceholder(
                        {
                          id: leader.candidate_id,
                          election_id: electionId,
                          name: leader.name,
                          description: leader.description,
                          designation: leader.designation ?? null,
                          photo_url: photoByCandidateId.get(leader.candidate_id) ?? null,
                          sort_order: leader.sort_order,
                          created_at: '',
                        },
                        CANDIDATE_PLACEHOLDER_IMAGES,
                      )}
                      alt=""
                      className="winner-leader-photo"
                    />
                  ) : (
                    <span className="winner-leader-photo winner-leader-photo--placeholder" aria-hidden>
                      {candidateInitial(leader.name)}
                    </span>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="winner-name">{leader.name}</div>
                    <div className="winner-votes">
                      {formatDashboardNumber(leader.vote_count)} votes
                      {leaderDesignation ? ` · ${leaderDesignation}` : ''}
                    </div>
                  </div>
                  <div className="winner-leader-pct">{leader.share_percent}%</div>
                </div>
              </div>
            ) : null}

            {rows.length > 0 ? (
              <div className="mini-chart creator-results-mini-chart">
                {rows.slice(0, 5).map((row, i) => {
                  const barHeight =
                    maxShare > 0 ? Math.max(12, Math.round((row.share_percent / maxShare) * 100)) : 12
                  return (
                    <div key={row.candidate_id} className="chart-col">
                      <div style={{ fontSize: 10, color: 'var(--subtle)', marginBottom: 4 }}>
                        {row.share_percent}%
                      </div>
                      <div
                        className="chart-bar"
                        style={{
                          height: `${barHeight}%`,
                          background: RESULT_BAR_COLORS[i % RESULT_BAR_COLORS.length],
                          borderRadius: '6px 6px 0 0',
                        }}
                      />
                      <div className="chart-label" style={{ marginTop: 5 }}>
                        {candidateFirstName(row.name)}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : null}

            {rows.map((row, i) => (
              <div key={row.candidate_id} className="result-row">
                <div className="result-meta">
                  <div className="result-name">
                    <CandidateAvatar
                      candidateId={row.candidate_id}
                      name={row.name}
                      photoUrl={photoByCandidateId.get(row.candidate_id) ?? null}
                    />
                    {row.name}
                  </div>
                  <div className="result-pct" style={{ color: RESULT_BAR_COLORS[i % RESULT_BAR_COLORS.length] }}>
                    {row.share_percent}%
                  </div>
                </div>
                <div className="result-bar">
                  <div
                    className="result-fill"
                    style={{
                      width: `${row.share_percent}%`,
                      background: RESULT_BAR_GRADIENTS[i % RESULT_BAR_GRADIENTS.length],
                    }}
                  />
                </div>
                <div className="result-votes">{formatDashboardNumber(row.vote_count)} votes</div>
              </div>
            ))}

            {rows.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--subtle)' }}>No ballots recorded yet.</p>
            ) : null}
          </div>

          <CandidateVoterBreakdown
            electionId={electionId}
            electionTitle={results.title}
            show={Boolean(results.polling_ended || results.results_locked_at)}
            candidates={rows.map((r) => ({
              candidate_id: r.candidate_id,
              name: r.name,
              description: r.description,
              designation: r.designation,
              sort_order: r.sort_order,
              vote_count: r.vote_count,
            }))}
          />
        </div>

        <div className="creator-results-side">
          <div className="card-elevated">
            <div className="card-header">
              <div className="card-title">Turnout Analytics</div>
            </div>
            <div className="card-body">
              <div className="turnout-metric">
                <div className="turnout-metric-head">
                  <span>Voted</span>
                  <strong className="voted">{formatDashboardNumber(totalVotes)}</strong>
                </div>
                <div className="progress-wrap">
                  <div className="progress-fill" style={{ width: `${Math.min(100, turnout)}%`, background: '#10B981' }} />
                </div>
              </div>
              <div className="turnout-metric">
                <div className="turnout-metric-head">
                  <span>Pending</span>
                  <strong className="pending">{formatDashboardNumber(pending)}</strong>
                </div>
                <div className="progress-wrap">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${registered > 0 ? Math.min(100, (pending / registered) * 100) : 0}%`,
                      background: '#F59E0B',
                    }}
                  />
                </div>
              </div>
              <div className="turnout-metric">
                <div className="turnout-metric-head">
                  <span>Invalid</span>
                  <strong className="invalid">{formatDashboardNumber(invalidVotes)}</strong>
                </div>
                <div className="progress-wrap">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${registered > 0 ? Math.max(invalidVotes > 0 ? 0.3 : 0, (invalidVotes / registered) * 100) : 0}%`,
                      background: '#EF4444',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="card-elevated">
            <div className="card-header">
              <div className="card-title">Export Results</div>
            </div>
            <ResultsExportToolbar results={results} variant="creator" onShareLink={() => void handleShareLink()} />
            {shareMsg ? <p className="creator-results-share-msg">{shareMsg}</p> : null}
            <div style={{ padding: '0 16px 14px' }}>
              <Link
                to={`/elections/${electionId}/results`}
                className="btn btn-ghost btn-sm"
                style={{ width: '100%', justifyContent: 'center' }}
                target="_blank"
                rel="noreferrer"
              >
                Open public results page
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
