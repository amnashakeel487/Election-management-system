import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useElectionResults } from '@/hooks/useElectionResults'
import { supabase } from '@/lib/supabase'
import { buildResultsSummary } from '@/utils/resultsDisplay'
import { formatSubmissionDate } from '@/utils/formatDate'
import {
  buildDonutSegments,
  buildFeedFromDelta,
  candidateInitials,
  enrichAndSortCandidates,
  formatCompactVotes,
  formatCountdownHms,
  formatFeedAge,
  FV_AVATAR_STYLES,
  FV_BAR_COLORS,
  leaderMargin,
  peakVotingHourLabel,
  votesPerMinuteLabel,
  type FeedItem,
} from '@/components/results/public/fortressResultsUtils'
import '@/styles/fortressvote-results-light.css'

interface FortressLiveResultsViewProps {
  electionId: string
}

interface ElectionMeta {
  description: string | null
  category: string | null
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  )
}

function SectionHead({
  iconBg,
  icon,
  title,
}: {
  iconBg: string
  icon: string
  title: string
}) {
  return (
    <div className="fv-sec-head">
      <div className="fv-sec-icon" style={{ background: iconBg }}>
        {icon}
      </div>
      <span className="fv-sec-title">{title}</span>
      <div className="fv-sec-line" />
    </div>
  )
}

export function FortressLiveResultsView({ electionId }: FortressLiveResultsViewProps) {
  const { results, loading, error, lastUpdated, isLive, refresh } = useElectionResults(electionId)
  const [meta, setMeta] = useState<ElectionMeta | null>(null)
  const [nowMs, setNowMs] = useState(() => Date.now())
  const [feed, setFeed] = useState<FeedItem[]>([])
  const [copyOk, setCopyOk] = useState(false)
  const [barsReady, setBarsReady] = useState(false)
  const prevVotesRef = useRef<number | null>(null)

  useEffect(() => {
    let cancelled = false
    void supabase
      .from('elections')
      .select('description, category')
      .eq('id', electionId)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled && data) {
          setMeta({ description: data.description, category: data.category })
        }
      })
    return () => {
      cancelled = true
    }
  }, [electionId])

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    if (!isLive) return
    const id = window.setInterval(() => void refresh(), 5000)
    return () => window.clearInterval(id)
  }, [isLive, refresh])

  useEffect(() => {
    if (!results) return
    const prev = prevVotesRef.current
    if (prev != null && prev !== results.total_votes) {
      const leader = enrichAndSortCandidates(results.candidates, results.total_votes)[0]?.name ?? null
      const item = buildFeedFromDelta(prev, results, leader)
      if (item) {
        setFeed((f) => [item, ...f].slice(0, 12))
      }
    }
    prevVotesRef.current = results.total_votes
  }, [results])

  useEffect(() => {
    const t = window.setTimeout(() => setBarsReady(true), 200)
    return () => window.clearTimeout(t)
  }, [results?.updated_at])

  const handleShare = useCallback(async () => {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({
          title: results?.title ?? 'Election results',
          url,
        })
        return
      } catch {
        /* fall through */
      }
    }
    try {
      await navigator.clipboard.writeText(url)
      setCopyOk(true)
      window.setTimeout(() => setCopyOk(false), 1500)
    } catch {
      /* ignore */
    }
  }, [results?.title])

  const secondsAgo = lastUpdated
    ? Math.max(0, Math.floor((nowMs - lastUpdated.getTime()) / 1000))
    : null

  const sorted = useMemo(
    () => (results ? enrichAndSortCandidates(results.candidates, results.total_votes) : []),
    [results],
  )

  const donutSegments = useMemo(() => buildDonutSegments(sorted), [sorted])
  const { outcome } = useMemo(
    () => (results ? buildResultsSummary(results) : { outcome: { type: 'none' as const } }),
    [results],
  )

  const remaining = results
    ? Math.max(0, results.registered_voters - results.total_votes)
    : 0

  const turnoutStroke = results
    ? `${((results.turnout_percent / 100) * 314).toFixed(1)} ${(314 - (results.turnout_percent / 100) * 314).toFixed(1)}`
    : '0 314'

  if (loading) {
    return (
      <div className="fv-results-light">
        <nav className="fv-nav">
          <Link to="/" className="fv-logo">
            <span className="fv-logo-icon">
              <ShieldIcon />
            </span>
            <span className="fv-logo-text">FortressVote</span>
          </Link>
        </nav>
        <div className="fv-empty">
          <p>Loading live results…</p>
        </div>
      </div>
    )
  }

  if (error || !results) {
    return (
      <div className="fv-results-light">
        <nav className="fv-nav">
          <Link to="/" className="fv-logo">
            <span className="fv-logo-icon">
              <ShieldIcon />
            </span>
            <span className="fv-logo-text">FortressVote</span>
          </Link>
        </nav>
        <div className="fv-empty">
          <h2>Results unavailable</h2>
          <p>{error ?? 'Live results are not published for this election yet.'}</p>
          <Link to="/results">Browse all results</Link>
        </div>
      </div>
    )
  }

  const leader = sorted[0]
  const margin = leaderMargin(sorted)
  const peakHour = peakVotingHourLabel(results.vote_trend)
  const growthRate = votesPerMinuteLabel(results.vote_trend)
  const countdown = results.polling_ended ? '00:00:00' : formatCountdownHms(results.end_date, nowMs)
  const countdownLabel = results.polling_ended ? 'VOTING CLOSED' : 'VOTING ENDS IN'

  const winnerName =
    outcome.type === 'winner'
      ? outcome.candidate.name
      : outcome.type === 'tie'
        ? 'Tie between leaders'
        : leader?.name ?? '—'

  const winnerShare =
    outcome.type === 'winner'
      ? outcome.share_percent
      : leader?.share_percent ?? 0

  return (
    <div className="fv-results-light">
      <nav className="fv-nav">
        <Link to="/" className="fv-logo">
          <span className="fv-logo-icon">
            <ShieldIcon />
          </span>
          <span className="fv-logo-text">FortressVote</span>
          <span className="fv-nav-tag">PUBLIC</span>
        </Link>
        <div className="fv-nav-right">
          <Link to="/results" className="fv-nav-btn">
            ← All results
          </Link>
          <button type="button" className="fv-nav-btn" onClick={() => void handleShare()}>
            Share
          </button>
          <Link to={`/elections/${electionId}`} className="fv-nav-btn">
            Election info
          </Link>
        </div>
      </nav>

      <header className="fv-hero">
        <div className="fv-hero-inner">
          <div>
            <div className="fv-hero-badge">
              <span className="fv-live-blink" />
              {isLive ? 'Live Results' : results.results_locked_at ? 'Certified Results' : 'Election Results'}
            </div>
            <h1 className="fv-hero-title">{results.title}</h1>
            {meta?.description ? <p className="fv-hero-desc">{meta.description}</p> : null}
            {meta?.category ? (
              <p className="fv-hero-org">Category · {meta.category}</p>
            ) : (
              <p className="fv-hero-org">
                Poll window · {formatSubmissionDate(results.start_date)} → {formatSubmissionDate(results.end_date)}
              </p>
            )}
          </div>
          <div className="fv-hero-right">
            {isLive ? (
              <div className="fv-live-pill">
                <span className="fv-live-dot" />
                <span className="fv-live-txt">LIVE</span>
              </div>
            ) : null}
            <div className="fv-countdown-box">
              <div className="fv-cd-label">{countdownLabel}</div>
              <div className="fv-cd-time">{countdown}</div>
            </div>
          </div>
        </div>
      </header>

      <div className="fv-status-bar">
        <div className="fv-status-inner">
          <div className="fv-status-live">
            <span className="fv-live-blink" />
            {isLive ? 'Live counting in progress' : 'Final tallies published'}
          </div>
          <div className="fv-status-sep" />
          <div className="fv-status-meta">
            Updated {secondsAgo != null ? `${secondsAgo}s` : '—'} ago
          </div>
          {isLive ? (
            <>
              <div className="fv-status-sep" />
              <span className="fv-auto-chip">Auto-refresh on</span>
            </>
          ) : null}
        </div>
      </div>

      <div className="fv-main">
        <SectionHead iconBg="#EDE9FE" icon="📊" title="Live Statistics" />
        <div className="fv-stats-grid">
          <div className="fv-stat-card" style={{ ['--fv-accent' as string]: '#6C63FF' }}>
            <div className="fv-stat-lbl">Total votes</div>
            <div className="fv-stat-val">{results.total_votes.toLocaleString()}</div>
            <div className="fv-stat-sub">Counted so far</div>
          </div>
          <div className="fv-stat-card" style={{ ['--fv-accent' as string]: '#22C55E' }}>
            <div className="fv-stat-lbl">Turnout</div>
            <div className="fv-stat-val">{results.turnout_percent.toFixed(1)}%</div>
            <div className="fv-stat-sub">Of eligible voters</div>
          </div>
          <div className="fv-stat-card" style={{ ['--fv-accent' as string]: '#06B6D4' }}>
            <div className="fv-stat-lbl">Registered</div>
            <div className="fv-stat-val">{results.registered_voters.toLocaleString()}</div>
            <div className="fv-stat-sub">Eligible voters</div>
          </div>
          <div className="fv-stat-card" style={{ ['--fv-accent' as string]: '#F59E0B' }}>
            <div className="fv-stat-lbl">Remaining</div>
            <div className="fv-stat-val">{remaining.toLocaleString()}</div>
            <div className="fv-stat-sub">Yet to vote</div>
          </div>
          <div className="fv-stat-card" style={{ ['--fv-accent' as string]: '#0F1F4B' }}>
            <div className="fv-stat-lbl">Candidates</div>
            <div className="fv-stat-val">{results.candidates.length}</div>
            <div className="fv-stat-sub">On the ballot</div>
          </div>
        </div>

        {sorted.length > 0 ? (
          <>
            <SectionHead iconBg="#FEE2E2" icon="📈" title="Live Results Chart" />
            <div className="fv-charts-row">
              <div className="fv-chart-card">
                <div className="fv-chart-card-title">Vote distribution by candidate</div>
                <div className="fv-bar-list">
                  {sorted.slice(0, 8).map((c, i) => {
                    const color = FV_BAR_COLORS[i % FV_BAR_COLORS.length] ?? FV_BAR_COLORS[0]
                    const width = barsReady ? Math.max(c.share_percent, c.vote_count > 0 ? 4 : 0) : 0
                    return (
                      <div key={c.candidate_id} className="fv-bar-item">
                        <div className="fv-bar-name" title={c.name}>
                          {c.name}
                        </div>
                        <div className="fv-bar-track">
                          <div
                            className="fv-bar-fill"
                            style={{ width: `${width}%`, background: color }}
                          >
                            {width >= 12 ? (
                              <span className="fv-bar-pct">{c.share_percent}%</span>
                            ) : null}
                          </div>
                        </div>
                        <div className="fv-bar-votes">{c.vote_count.toLocaleString()}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
              <div className="fv-chart-card">
                <div className="fv-chart-card-title">Vote share</div>
                <div className="fv-donut-wrap">
                  <div className="fv-donut-svg-w">
                    <svg viewBox="0 0 120 120" width="130" height="130" role="img" aria-label="Vote share chart">
                      <circle cx="60" cy="60" r="50" fill="none" stroke="#F1F5F9" strokeWidth="14" />
                      {donutSegments.map((seg, i) => (
                        <circle
                          key={i}
                          cx="60"
                          cy="60"
                          r="50"
                          fill="none"
                          stroke={seg.color}
                          strokeWidth="14"
                          strokeLinecap="butt"
                          strokeDasharray={seg.dasharray}
                          style={{
                            transform: `rotate(${seg.rotation}deg)`,
                            transformOrigin: '50% 50%',
                            transition: 'stroke-dasharray 1s ease',
                          }}
                        />
                      ))}
                    </svg>
                    <div className="fv-donut-ctr">
                      <div className="fv-donut-ctr-val">{formatCompactVotes(results.total_votes)}</div>
                      <div className="fv-donut-ctr-lbl">VOTES</div>
                    </div>
                  </div>
                  <div className="fv-d-legend">
                    {sorted.slice(0, 5).map((c, i) => (
                      <div key={c.candidate_id} className="fv-d-leg-item">
                        <span
                          className="fv-d-leg-dot"
                          style={{ background: FV_BAR_COLORS[i % FV_BAR_COLORS.length] }}
                        />
                        {c.name} — {c.share_percent}%
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <SectionHead iconBg="#FEF3C7" icon="🏆" title="Candidate Rankings" />
            <div className="fv-rankings">
              {sorted.map((c, i) => {
                const style = FV_AVATAR_STYLES[i % FV_AVATAR_STYLES.length]!
                const color = FV_BAR_COLORS[i % FV_BAR_COLORS.length] ?? FV_BAR_COLORS[0]
                const width = barsReady ? c.share_percent : 0
                const isLeader = i === 0 && c.vote_count > 0
                return (
                  <article
                    key={c.candidate_id}
                    className={`fv-rank-card${isLeader ? ' leader' : ''}`}
                  >
                    <div className="fv-rank-pos">{isLeader ? '👑' : `#${i + 1}`}</div>
                    <div
                      className="fv-rank-avatar"
                      style={{ background: style.bg, color: style.color }}
                    >
                      {candidateInitials(c.name)}
                    </div>
                    <div className="fv-rank-info">
                      <div className="fv-rank-name">{c.name}</div>
                      <div className="fv-rank-party">
                        {c.designation?.trim() || 'Candidate'}
                      </div>
                      <div className="fv-rank-bar-t">
                        <div
                          className="fv-rank-bar-f"
                          style={{ width: `${width}%`, background: color }}
                        />
                      </div>
                    </div>
                    <div className="fv-rank-right">
                      <div className="fv-rank-votes">{c.vote_count.toLocaleString()}</div>
                      <div className="fv-rank-pct">{c.share_percent}%</div>
                    </div>
                  </article>
                )
              })}
            </div>
          </>
        ) : null}

        <SectionHead iconBg="#DCFCE7" icon="👥" title="Turnout & Participation" />
        <div className="fv-turnout-grid">
          <div className="fv-circle-card">
            <div className="fv-circ-svg-w">
              <svg viewBox="0 0 120 120" width="120" height="120" role="img" aria-label="Turnout">
                <circle cx="60" cy="60" r="50" fill="none" stroke="#E2E8F0" strokeWidth="12" />
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  stroke="#6C63FF"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={turnoutStroke}
                  style={{
                    transform: 'rotate(-90deg)',
                    transformOrigin: '50% 50%',
                    transition: 'stroke-dasharray 1s ease',
                  }}
                />
              </svg>
              <div className="fv-circ-ctr">
                <div className="fv-circ-pct">{results.turnout_percent.toFixed(0)}%</div>
                <div className="fv-circ-lbl">Turnout</div>
              </div>
            </div>
            {peakHour ? (
              <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--fv-txd)' }}>
                Peak: {peakHour}
              </div>
            ) : null}
          </div>
          <div className="fv-tur-table">
            <div className="fv-tur-row">
              <div className="fv-tur-key">Registered voters</div>
              <div className="fv-tur-val">{results.registered_voters.toLocaleString()}</div>
            </div>
            <div className="fv-tur-row">
              <div className="fv-tur-key">Votes cast</div>
              <div className="fv-tur-val" style={{ color: '#6C63FF' }}>
                {results.total_votes.toLocaleString()}
              </div>
            </div>
            <div className="fv-tur-row">
              <div className="fv-tur-key">Turnout rate</div>
              <div className="fv-tur-val" style={{ color: 'var(--fv-teal2)' }}>
                {results.turnout_percent.toFixed(1)}%
              </div>
            </div>
            <div className="fv-tur-row">
              <div className="fv-tur-key">Remaining</div>
              <div className="fv-tur-val">{remaining.toLocaleString()}</div>
            </div>
            {growthRate ? (
              <div className="fv-tur-row">
                <div className="fv-tur-key">Vote growth rate</div>
                <div className="fv-tur-val" style={{ color: 'var(--fv-teal2)' }}>
                  {growthRate}
                </div>
              </div>
            ) : null}
            {peakHour ? (
              <div className="fv-tur-row">
                <div className="fv-tur-key">Peak voting hour</div>
                <div className="fv-tur-val">{peakHour}</div>
              </div>
            ) : null}
          </div>
        </div>

        {feed.length > 0 ? (
          <>
            <SectionHead iconBg="#CFFAFE" icon="⚡" title="Live Activity Feed" />
            <div className="fv-feed-card">
              <div className="fv-feed-hdr">
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="fv-live-blink" />
                  Real-time updates
                </span>
                <span style={{ fontSize: 10, color: 'var(--fv-txd)' }}>Updates when votes are cast</span>
              </div>
              <div className="fv-feed-scroll">
                {feed.map((item) => (
                  <div key={item.id} className="fv-feed-item">
                    <span className="fv-feed-dot" style={{ background: item.color }} />
                    <span className="fv-feed-txt">{item.text}</span>
                    <span className="fv-feed-time">{formatFeedAge(item.at, nowMs)}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : null}

        {leader && leader.vote_count > 0 ? (
          <>
            <SectionHead iconBg="#FEF3C7" icon="👑" title="Current Leader" />
            <div className="fv-winner-card">
              <div className="fv-winner-lbl">
                {results.polling_ended || results.results_locked_at
                  ? 'WINNING CANDIDATE'
                  : 'CURRENT LEADING CANDIDATE'}
              </div>
              <div
                className="fv-winner-avatar"
                style={{
                  background: FV_AVATAR_STYLES[0]!.bg,
                  color: FV_AVATAR_STYLES[0]!.color,
                  borderColor: '#FDE68A',
                }}
              >
                {candidateInitials(winnerName)}
              </div>
              <div className="fv-winner-name">👑 {winnerName}</div>
              <div className="fv-winner-pct">{winnerShare}% of total votes</div>
              <div className="fv-winner-sub">
                {leader.vote_count.toLocaleString()} votes
                {margin && margin.leadVotes > 0
                  ? ` · Leading by ${margin.leadVotes.toLocaleString()} votes`
                  : ''}
              </div>
              {leader.designation ? (
                <div className="fv-winner-tags">
                  <span className="fv-winner-tag" style={{ background: '#EDE9FE', color: '#4C1D95' }}>
                    {leader.designation}
                  </span>
                </div>
              ) : null}
            </div>
          </>
        ) : null}

        <SectionHead iconBg="#EDE9FE" icon="🔗" title="Share Results" />
        <div className="fv-share-row">
          <button type="button" className="fv-share-btn" onClick={() => void handleShare()}>
            {copyOk ? '✓ Link copied' : 'Copy link'}
          </button>
          <Link to="/browse-elections" className="fv-share-btn">
            Browse elections
          </Link>
        </div>

        <SectionHead iconBg="#DCFCE7" icon="🛡" title="Transparency & Security" />
        <div className="fv-trans-card">
          Votes are cast as anonymous ballots. Duplicate voting is blocked, and administrative actions
          are recorded in audit logs when enabled by the organizer.
          <div className="fv-verify-grid">
            <div className="fv-verify-item">Anonymous voting enabled</div>
            <div className="fv-verify-item">Duplicate vote protection active</div>
            <div className="fv-verify-item">Immutable ballot records</div>
            <div className="fv-verify-item">End-to-end encryption in transit</div>
          </div>
          <div className="fv-audit-row">
            <span className="fv-audit-key">Last tally refresh</span>
            <span className="fv-audit-val">
              <span className="fv-live-blink" />
              {secondsAgo != null ? `${secondsAgo} seconds ago` : '—'}
            </span>
          </div>
        </div>
      </div>

      <footer className="fv-footer">
        <div className="fv-ft-inner">
          <Link to="/" className="fv-logo" style={{ marginBottom: 4 }}>
            <span className="fv-logo-icon" style={{ width: 26, height: 26 }}>
              <ShieldIcon />
            </span>
            <span className="fv-logo-text" style={{ color: 'var(--fv-tx)', fontSize: 14 }}>
              FortressVote
            </span>
          </Link>
          <div className="fv-ft-links">
            <Link className="fv-ft-link" to="/">
              Home
            </Link>
            <Link className="fv-ft-link" to="/results">
              All results
            </Link>
            <Link className="fv-ft-link" to="/browse-elections">
              Elections
            </Link>
          </div>
          <div className="fv-ft-copy">© {new Date().getFullYear()} FortressVote · Secure, transparent voting</div>
        </div>
      </footer>
    </div>
  )
}
