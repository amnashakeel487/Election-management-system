import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { FortressLiveResultsView } from '@/components/results/public/FortressLiveResultsView'
import { VoterPageHeader } from '@/components/voter/VoterPageHeader'
import { fetchElectionResults } from '@/services/resultsService'
import type { ElectionResultsPayload } from '@/types/electionResults'
import { electionDisplayStatus } from '@/utils/dashboardDisplay'
import { formatElectionCode, formatTimeRemaining } from '@/utils/electionTime'

const BAR_COLORS = ['#1B3A6B', '#6C3FC5', '#06B6D4', '#10B981', '#2451A3']

export function VoterResultsDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [payload, setPayload] = useState<ElectionResultsPayload | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    void fetchElectionResults(id)
      .then((data) => {
        if (!cancelled) setPayload(data)
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load results')
      })
    return () => {
      cancelled = true
    }
  }, [id])

  const sorted = useMemo(() => {
    const list = payload?.candidates ?? []
    return [...list].sort((a, b) => b.vote_count - a.vote_count)
  }, [payload])

  const phase = payload
    ? electionDisplayStatus(payload.status, payload.start_date, payload.end_date)
    : 'pending'

  if (!id) return null

  if (error) {
    return (
      <div className="card-elevated">
        <div className="card-body">{error}</div>
      </div>
    )
  }

  return (
    <>
      <VoterPageHeader
        eyebrow="Analytics"
        title="Election Results"
        subtitle={payload?.title ? `${payload.title} (${formatElectionCode(id)})` : 'Loading…'}
      />

      {payload ? (
        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-icon-row">
              <div className="stat-icon" style={{ background: '#DCFCE7', color: '#16A34A' }}>
                <svg viewBox="0 0 24 24" aria-hidden>
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
              </div>
              <span className="stat-delta du">{payload.is_live ? 'Live' : 'Final'}</span>
            </div>
            <div className="stat-num">{payload.total_votes.toLocaleString()}</div>
            <div className="stat-label">Total Votes</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon-row">
              <div className="stat-icon" style={{ background: '#EFF4FF', color: '#2451A3' }}>
                <svg viewBox="0 0 24 24" aria-hidden>
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                </svg>
              </div>
              <span className="stat-delta du">Turnout</span>
            </div>
            <div className="stat-num">{Math.round(payload.turnout_percent)}%</div>
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
            <div className="stat-num">{formatTimeRemaining(payload.end_date)}</div>
            <div className="stat-label">Time Remaining</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon-row">
              <div className="stat-icon" style={{ background: '#F5F3FF', color: '#6C3FC5' }}>
                <svg viewBox="0 0 24 24" aria-hidden>
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                </svg>
              </div>
            </div>
            <div className="stat-num">{payload.registered_voters.toLocaleString()}</div>
            <div className="stat-label">Registered</div>
          </div>
        </div>
      ) : null}

      {sorted.length > 0 && payload ? (
        <div className="card-elevated" style={{ marginBottom: 16 }}>
          <div className="card-header">
            <div className="card-title">Results breakdown</div>
            <span className={`badge ${payload.is_live ? 'b-live' : 'b-completed'}`}>
              {payload.is_live ? (
                <>
                  <span className="b-dot" />
                  Live
                </>
              ) : (
                phase
              )}
            </span>
          </div>
          <div className="card-body">
            {sorted.map((c, idx) => {
              const pct = payload.total_votes > 0 ? Math.round((c.vote_count / payload.total_votes) * 1000) / 10 : 0
              const color = BAR_COLORS[idx % BAR_COLORS.length]
              return (
                <div key={c.candidate_id} className="result-row">
                  <div className="result-meta">
                    <div className="result-name">{c.name}</div>
                    <div className="result-pct" style={{ color }}>
                      {pct}%
                    </div>
                  </div>
                  <div className="result-bar">
                    <div
                      className="result-fill"
                      style={{
                        width: `${pct}%`,
                        background: `linear-gradient(90deg, ${color}, ${color}CC)`,
                      }}
                    />
                  </div>
                  <div className="result-votes">{c.vote_count.toLocaleString()} votes</div>
                </div>
              )
            })}
          </div>
        </div>
      ) : null}

      <div className="card-elevated">
        <div className="card-header">
          <div className="card-title">Detailed live view</div>
          <Link to="/voter/results" className="btn btn-ghost btn-xs">
            ← All results
          </Link>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          <FortressLiveResultsView electionId={id} />
        </div>
      </div>
    </>
  )
}
