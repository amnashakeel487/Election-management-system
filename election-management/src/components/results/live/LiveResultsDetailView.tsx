import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { LiveResultsFooter } from '@/components/results/live/LiveResultsFooter'
import { LiveResultsNav } from '@/components/results/live/LiveResultsNav'
import {
  buildFeedFromDelta,
  candidateInitials,
  enrichAndSortCandidates,
  formatFeedAge,
  leaderMargin,
  peakVotingHourLabel,
  votesPerMinuteLabel,
  type FeedItem,
} from '@/components/results/public/fortressResultsUtils'
import { useElectionResults } from '@/hooks/useElectionResults'
import { supabase } from '@/lib/supabase'
import { buildResultsSummary } from '@/utils/resultsDisplay'
import { formatSubmissionDate } from '@/utils/formatDate'
import {
  buildHourlyBars,
  buildLiveDonutSegments,
  categoryBadgeLabel,
  LR_AVATAR_GRADS,
  LR_BAR_FILLS,
  rankClass,
  splitCountdownParts,
} from '@/utils/liveResultsUi'
import '@/styles/live-results.css'

const FEED_ICON_CLASSES = ['green', 'orange', 'blue', 'purple', 'cyan', 'green', 'blue'] as const

export interface LiveResultsDetailViewProps {
  electionId: string
  /** When set, hides public nav/footer and uses voter-dashboard links. */
  embeddedIn?: 'voter'
}

export function LiveResultsDetailView({ electionId, embeddedIn }: LiveResultsDetailViewProps) {
  const voterEmbed = embeddedIn === 'voter'
  const rootClass = voterEmbed ? 'lr-root lr-root--voter-embed' : 'lr-root'
  const { results, loading, error, lastUpdated, isLive, refresh } = useElectionResults(electionId || undefined)
  const [meta, setMeta] = useState<{ description: string | null; category: string | null } | null>(null)
  const [nowMs, setNowMs] = useState(() => Date.now())
  const [feed, setFeed] = useState<FeedItem[]>([])
  const [copyOk, setCopyOk] = useState(false)
  const [barsReady, setBarsReady] = useState(false)
  const prevVotesRef = useRef<number | null>(null)

  useEffect(() => {
    if (!electionId) return
    let cancelled = false
    void supabase
      .from('elections')
      .select('description, category')
      .eq('id', electionId)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled && data) setMeta({ description: data.description, category: data.category })
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
      if (item) setFeed((f) => [item, ...f].slice(0, 10))
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
        await navigator.share({ title: results?.title ?? 'Election results', url })
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

  const sorted = useMemo(
    () => (results ? enrichAndSortCandidates(results.candidates, results.total_votes) : []),
    [results],
  )
  const donutSegments = useMemo(() => buildLiveDonutSegments(sorted), [sorted])
  const hourlyBars = useMemo(() => buildHourlyBars(results?.vote_trend ?? []), [results?.vote_trend])
  const { outcome } = useMemo(
    () => (results ? buildResultsSummary(results) : { outcome: { type: 'none' as const } }),
    [results],
  )

  const remaining = results ? Math.max(0, results.registered_voters - results.total_votes) : 0
  const ringCirc = 2 * Math.PI * 82
  const turnoutRing = results ? ((results.turnout_percent / 100) * ringCirc).toFixed(0) : '0'
  const turnoutRemain = results ? (ringCirc - Number(turnoutRing)).toFixed(0) : String(ringCirc)
  const secondsAgo = lastUpdated ? Math.max(0, Math.floor((nowMs - lastUpdated.getTime()) / 1000)) : null
  const growthRate = results ? votesPerMinuteLabel(results.vote_trend) : null
  const peakHour = results ? peakVotingHourLabel(results.vote_trend) : null
  const catBadge = categoryBadgeLabel(meta?.category)
  const margin = leaderMargin(sorted)
  const leader = sorted[0]
  const winnerName =
    outcome.type === 'winner'
      ? outcome.candidate.name
      : outcome.type === 'tie'
        ? 'Tie between leaders'
        : (leader?.name ?? '—')
  const winnerShare =
    outcome.type === 'winner' ? outcome.share_percent : (leader?.share_percent ?? 0)

  const countdownTarget = results?.polling_ended ? null : results?.end_date
  const cd = countdownTarget ? splitCountdownParts(countdownTarget, nowMs) : null
  const cdLabel = results?.polling_ended ? 'Voting closed' : 'Voting ends in'

  if (!electionId) {
    return (
      <div className={rootClass}>
        {!voterEmbed ? <LiveResultsNav /> : null}
        <div className="page" style={{ paddingTop: voterEmbed ? 32 : 80, textAlign: 'center' }}>
          <p>Missing election id.</p>
          <Link to={voterEmbed ? '/voter/results' : '/results'}>Back to results</Link>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className={rootClass}>
        {!voterEmbed ? <LiveResultsNav isLive /> : null}
        <div className="page" style={{ paddingTop: voterEmbed ? 32 : 80, textAlign: 'center', color: 'var(--subtle)' }}>
          Loading live results…
        </div>
      </div>
    )
  }

  if (error || !results) {
    return (
      <div className={rootClass}>
        {!voterEmbed ? <LiveResultsNav /> : null}
        <div className="page" style={{ paddingTop: voterEmbed ? 32 : 80, textAlign: 'center' }}>
          <h2 style={{ marginBottom: 8 }}>Results unavailable</h2>
          <p style={{ color: 'var(--muted)', marginBottom: 16 }}>
            {error ?? 'Live results are not published for this election yet.'}
          </p>
          <Link to={voterEmbed ? '/voter/results' : '/results'}>Back to results</Link>
        </div>
      </div>
    )
  }

  return (
    <div className={rootClass}>
      {!voterEmbed ? <LiveResultsNav isLive={isLive} onShare={() => void handleShare()} /> : null}

      {voterEmbed ? (
        <div className="lr-voter-toolbar">
          <Link to="/voter/results" className="lr-voter-toolbar-back">
            ← My results
          </Link>
          <div className="lr-voter-toolbar-actions">
            {isLive ? (
              <span className="lr-voter-toolbar-live">
                <span className="lr-voter-toolbar-live-dot" aria-hidden />
                Live
              </span>
            ) : null}
            <button type="button" className="lr-voter-toolbar-share" onClick={() => void handleShare()}>
              {copyOk ? 'Copied' : 'Share'}
            </button>
          </div>
        </div>
      ) : null}

      <section className="hero">
        <div className="hero-grid" />
        <div className="hero-orb1" />
        <div className="hero-orb2" />
        <div className="hero-orb3" />
        <div className="hero-inner">
          <div className="hero-top">
            <div className="hero-left">
              {voterEmbed ? (
                <div className="hero-breadcrumb">
                  <Link to="/voter/results">My results</Link>
                  <span className="hero-breadcrumb-sep">/</span>
                  <span>{results.title}</span>
                  <span className="hero-breadcrumb-sep">/</span>
                  <span>Live Results</span>
                </div>
              ) : (
                <div className="hero-breadcrumb">
                  <Link to="/browse-elections">Elections</Link>
                  <span className="hero-breadcrumb-sep">/</span>
                  <Link to={`/elections/${electionId}`}>{results.title}</Link>
                  <span className="hero-breadcrumb-sep">/</span>
                  <span>Live Results</span>
                </div>
              )}
              <div className="hero-badges">
                <div className="hero-badge live">
                  <div className="bd" />
                  {isLive ? 'Live Counting' : results.results_locked_at ? 'Certified' : 'Results'}
                </div>
                <div className="hero-badge cat">
                  {catBadge.icon} {catBadge.label}
                </div>
              </div>
              <h1 className="hero-title">{results.title}</h1>
              <div className="hero-org">
                {meta?.category?.trim() ?? `Poll · ${formatSubmissionDate(results.start_date)} → ${formatSubmissionDate(results.end_date)}`}
              </div>
              {meta?.description ? <div className="hero-desc">{meta.description}</div> : null}
            </div>
{voterEmbed && !cd ? (
              <div className="hero-right">
                <button type="button" className="share-btn link" onClick={() => void handleShare()}>
                  {copyOk ? '✓ Copied!' : 'Share results'}
                </button>
              </div>
            ) : null}
            {cd ? (
              <div className="hero-right">
                <div className="countdown-box">
                  <div className="cd-label">{cdLabel}</div>
                  <div className="cd-units">
                    <div className="cd-unit">
                      <div className="cd-num">{cd.h}</div>
                      <div className="cd-lbl">Hrs</div>
                    </div>
                    <div className="cd-sep">:</div>
                    <div className="cd-unit">
                      <div className="cd-num">{cd.m}</div>
                      <div className="cd-lbl">Min</div>
                    </div>
                    <div className="cd-sep">:</div>
                    <div className="cd-unit">
                      <div className="cd-num">{cd.s}</div>
                      <div className="cd-lbl">Sec</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <div className="live-banner">
        <div className="lb-status">
          <div className="lb-dot" />
          {isLive ? 'Live vote counting in progress' : 'Final tallies published'}
        </div>
        <div className="lb-divider" />
        <div className="lb-item">
          <svg viewBox="0 0 24 24" aria-hidden>
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          Updated <span className="lb-highlight">{secondsAgo != null ? `${secondsAgo}s ago` : '—'}</span>
        </div>
        {isLive ? (
          <div className="lb-pulse">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
            Syncing realtime
          </div>
        ) : null}
      </div>

      <div className="page">
        <div className="stats-grid">
          <div className="stat-card blue">
            <div className="sc-icon blue">
              <svg viewBox="0 0 24 24" aria-hidden>
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div className="sc-num">{results.total_votes.toLocaleString()}</div>
            <div className="sc-label">Total Votes</div>
            {growthRate ? <div className="sc-delta up">{growthRate}</div> : null}
          </div>
          <div className="stat-card green">
            <div className="sc-icon green">
              <svg viewBox="0 0 24 24" aria-hidden>
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
            </div>
            <div className="sc-num">{results.turnout_percent.toFixed(0)}%</div>
            <div className="sc-label">Turnout</div>
          </div>
          <div className="stat-card purple">
            <div className="sc-icon purple">
              <svg viewBox="0 0 24 24" aria-hidden>
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
              </svg>
            </div>
            <div className="sc-num">{results.registered_voters.toLocaleString()}</div>
            <div className="sc-label">Registered Voters</div>
          </div>
          <div className="stat-card orange">
            <div className="sc-icon orange">
              <svg viewBox="0 0 24 24" aria-hidden>
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div className="sc-num">{remaining.toLocaleString()}</div>
            <div className="sc-label">Remaining</div>
          </div>
          <div className="stat-card cyan">
            <div className="sc-icon cyan">
              <svg viewBox="0 0 24 24" aria-hidden>
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <div className="sc-num">{results.candidates.length}</div>
            <div className="sc-label">Candidates</div>
          </div>
        </div>

        {sorted.length > 0 ? (
          <>
            <div className="charts-grid">
              <div className="panel">
                <div className="panel-head">
                  <div>
                    <div className="panel-title">Candidate Vote Comparison</div>
                    <div className="panel-sub">Live vote distribution by candidate</div>
                  </div>
                  {isLive ? (
                    <div className="live-pill" style={{ fontSize: 10 }}>
                      <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#10B981', animation: 'livePulse 1.5s infinite' }} />
                      Live
                    </div>
                  ) : null}
                </div>
                <div className="panel-body">
                  <div className="bc-bars">
                    {sorted.map((c, i) => {
                      const width = barsReady ? Math.max(c.share_percent, c.vote_count > 0 ? 2 : 0) : 0
                      const rc = rankClass(i)
                      return (
                        <div key={c.candidate_id} className="bc-row">
                          <div className="bc-header">
                            <div className="bc-name">
                              <span className={`bc-rank ${rc}`}>#{i + 1}</span>
                              {c.name}
                            </div>
                            <div className="bc-values">
                              <span className="bc-pct">{c.share_percent}%</span>
                              <span className="bc-votes">{c.vote_count.toLocaleString()} votes</span>
                            </div>
                          </div>
                          <div className="bc-bar-track">
                            <div
                              className="bc-bar-fill"
                              style={{ width: `${width}%`, background: LR_BAR_FILLS[i % LR_BAR_FILLS.length] }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div className="panel">
                <div className="panel-head">
                  <div>
                    <div className="panel-title">Vote Share Distribution</div>
                    <div className="panel-sub">Percentage breakdown</div>
                  </div>
                </div>
                <div className="panel-body">
                  <div className="donut-section">
                    <div className="donut-outer">
                      <svg width="180" height="180" viewBox="0 0 180 180" role="img" aria-label="Vote share">
                        <circle cx="90" cy="90" r="72" fill="none" stroke="#F0F4F9" strokeWidth="22" />
                        {donutSegments.map((seg, i) => (
                          <circle
                            key={i}
                            cx="90"
                            cy="90"
                            r="72"
                            fill="none"
                            stroke={seg.color}
                            strokeWidth="22"
                            strokeDasharray={seg.dasharray}
                            strokeDashoffset={seg.dashoffset}
                            strokeLinecap="round"
                          />
                        ))}
                      </svg>
                      <div className="donut-center">
                        <div className="donut-center-num">{results.total_votes.toLocaleString()}</div>
                        <div className="donut-center-label">Votes</div>
                      </div>
                    </div>
                    <div className="donut-legend-grid">
                      {sorted.slice(0, 4).map((c, i) => (
                        <div key={c.candidate_id} className="dl-item">
                          <div className="dl-dot" style={{ background: donutSegments[i]?.color ?? '#94A3B8' }} />
                          <div className="dl-name">{c.name}</div>
                          <div className="dl-pct" style={{ color: donutSegments[i]?.color }}>
                            {c.share_percent}%
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="panel" style={{ marginBottom: 20 }}>
              <div className="panel-head">
                <div>
                  <div className="panel-title">Live Candidate Rankings</div>
                  <div className="panel-sub">Rankings update in real-time</div>
                </div>
              </div>
              <div className="panel-body">
                <div className="rankings-list">
                  {sorted.map((c, i) => {
                    const isLeader = i === 0 && c.vote_count > 0
                    const width = barsReady ? c.share_percent : 0
                    return (
                      <article key={c.candidate_id} className={`rank-card${isLeader ? ' leader' : ''}`}>
                        <div className="rank-row">
                          {isLeader ? (
                            <div className="rank-crown">👑</div>
                          ) : (
                            <div className="rank-num" style={{ color: i === 2 ? '#B45309' : undefined }}>
                              #{i + 1}
                            </div>
                          )}
                          <div
                            className="rank-avatar"
                            style={{ background: LR_AVATAR_GRADS[i % LR_AVATAR_GRADS.length] }}
                          >
                            {candidateInitials(c.name)}
                          </div>
                          <div className="rank-info">
                            <div className="rank-name">
                              {c.name}
                              {isLeader ? <span className="leader-badge">★ Leading</span> : null}
                            </div>
                            <div className="rank-party">{c.designation?.trim() || 'Candidate'}</div>
                          </div>
                          <div className="rank-bar-wrap">
                            <div className="rank-stats-row">
                              <span className="rank-pct">{c.share_percent}%</span>
                              <span className="rank-votes">{c.vote_count.toLocaleString()} votes</span>
                            </div>
                            <div className="rank-bar-track">
                              <div
                                className="rank-bar-fill"
                                style={{ width: `${width}%`, background: LR_BAR_FILLS[i % LR_BAR_FILLS.length] }}
                              />
                            </div>
                            {isLeader && margin && margin.secondVotes > 0 ? (
                              <div className="ws-prog-header" style={{ marginTop: 4, marginBottom: 0 }}>
                                <span style={{ fontSize: 10, color: 'var(--muted)' }}>Plurality lead over #2</span>
                                <span
                                  style={{
                                    fontSize: 10,
                                    fontFamily: 'IBM Plex Mono, monospace',
                                    color: 'var(--success)',
                                    fontWeight: 700,
                                  }}
                                >
                                  +{((c.share_percent ?? 0) - (sorted[1]?.share_percent ?? 0)).toFixed(1)}%
                                </span>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </article>
                    )
                  })}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="panel" style={{ marginBottom: 20 }}>
            <div className="panel-body" style={{ textAlign: 'center', padding: '32px 22px' }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
                {results.candidates.length === 0 ? 'No candidates yet' : 'No votes cast yet'}
              </p>
              <p style={{ fontSize: 13, color: 'var(--subtle)', maxWidth: 420, margin: '0 auto' }}>
                {results.candidates.length === 0
                  ? 'Candidate rankings and charts will appear once candidates are added to this election.'
                  : 'Vote counts and charts will update here as soon as the first ballot is cast.'}
              </p>
            </div>
          </div>
        )}

        <div className="distribution-grid">
          <div className="panel">
            <div className="panel-head">
              <div>
                <div className="panel-title">Participation & Turnout</div>
                <div className="panel-sub">Real-time voter participation metrics</div>
              </div>
            </div>
            <div className="panel-body">
              <div className="ring-container">
                <div className="ring-outer">
                  <svg width="200" height="200" viewBox="0 0 200 200" role="img" aria-label="Turnout">
                    <circle cx="100" cy="100" r="82" fill="none" stroke="#F0F4F9" strokeWidth="18" />
                    <circle
                      cx="100"
                      cy="100"
                      r="82"
                      fill="none"
                      stroke="url(#ringGrad)"
                      strokeWidth="18"
                      strokeDasharray={`${turnoutRing} ${turnoutRemain}`}
                      strokeLinecap="round"
                      transform="rotate(-90 100 100)"
                    />
                    <defs>
                      <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#2451A3" />
                        <stop offset="50%" stopColor="#6C3FC5" />
                        <stop offset="100%" stopColor="#06B6D4" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="ring-center">
                    <div className="ring-pct">{results.turnout_percent.toFixed(0)}%</div>
                    <div className="ring-label">Participation</div>
                  </div>
                </div>
                <div className="turnout-stats">
                  <div className="ts-item">
                    <div className="ts-num" style={{ color: 'var(--success)' }}>
                      {results.total_votes.toLocaleString()}
                    </div>
                    <div className="ts-label">Voted</div>
                  </div>
                  <div className="ts-item">
                    <div className="ts-num" style={{ color: 'var(--warning)' }}>
                      {remaining.toLocaleString()}
                    </div>
                    <div className="ts-label">Remaining</div>
                  </div>
                  <div className="ts-item">
                    <div className="ts-num" style={{ color: 'var(--blue)' }}>
                      {results.registered_voters.toLocaleString()}
                    </div>
                    <div className="ts-label">Registered</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="panel-head">
              <div>
                <div className="panel-title">Hourly Voting Trends</div>
                <div className="panel-sub">Votes per hour with peak detection</div>
              </div>
            </div>
            <div className="panel-body">
              {hourlyBars.length > 0 ? (
                <div className="hourly-chart">
                  <div className="hc-bars">
                    {hourlyBars.map((bar, i) => (
                      <div
                        key={i}
                        className={`hc-bar${bar.isPeak ? ' peak' : ''}`}
                        style={{
                          height: `${bar.heightPct}%`,
                          background: bar.isPeak
                            ? 'linear-gradient(180deg,rgba(245,158,11,0.9),rgba(245,158,11,0.3))'
                            : 'linear-gradient(180deg,rgba(36,81,163,0.7),rgba(36,81,163,0.2))',
                        }}
                        title={`${bar.votes} votes`}
                      />
                    ))}
                  </div>
                  <div className="hc-labels">
                    {hourlyBars.map((bar, i) => (
                      <div key={i} className="hc-label">
                        {bar.label}
                      </div>
                    ))}
                  </div>
                  {peakHour ? (
                    <div className="hc-peak-tag">
                      <div className="hc-peak-icon">
                        <svg viewBox="0 0 24 24" aria-hidden>
                          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                        </svg>
                      </div>
                      <div className="hc-peak-text">
                        <strong>Peak voting hour: {peakHour}</strong>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : (
                <p style={{ fontSize: 13, color: 'var(--subtle)' }}>Hourly trend data will appear as votes are cast.</p>
              )}
            </div>
          </div>
        </div>

        {feed.length > 0 ? (
          <div className="panel" style={{ marginBottom: 20 }}>
            <div className="panel-head">
              <div>
                <div className="panel-title">Live Activity Feed</div>
                <div className="panel-sub">Real-time election events</div>
              </div>
            </div>
            <div className="panel-body" style={{ padding: '0 22px' }}>
              <div className="activity-feed">
                {feed.map((item, i) => (
                  <div key={item.id} className="af-item">
                    <div className={`af-icon ${FEED_ICON_CLASSES[i % FEED_ICON_CLASSES.length]}`}>
                      <svg viewBox="0 0 24 24" aria-hidden>
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <div className="af-content">
                      <div className="af-text">{item.text}</div>
                      <div className="af-time">{formatFeedAge(item.at, nowMs)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {leader && leader.vote_count > 0 ? (
          <div className="winner-section">
            <div className="ws-orb" />
            <div className="ws-orb2" />
            <div className="ws-inner">
              <div className="ws-left">
                <div className="ws-crown">👑</div>
                <div className="ws-avatar" style={{ background: LR_AVATAR_GRADS[0] }}>
                  {candidateInitials(winnerName)}
                </div>
              </div>
              <div className="ws-right">
                <div className="ws-status-label">
                  ★ {results.polling_ended || results.results_locked_at ? 'Winning candidate' : 'Current leader — election still live'}
                </div>
                <div className="ws-name">{winnerName}</div>
                <div className="ws-party">{leader.designation?.trim() || 'Leading candidate'}</div>
                <div className="ws-stats">
                  <div className="ws-stat">
                    <div className="ws-stat-num">{leader.vote_count.toLocaleString()}</div>
                    <div className="ws-stat-label">Votes</div>
                  </div>
                  <div className="ws-stat">
                    <div className="ws-stat-num" style={{ color: 'var(--warning)' }}>
                      {winnerShare}%
                    </div>
                    <div className="ws-stat-label">Share</div>
                  </div>
                  {margin && margin.leadVotes > 0 ? (
                    <div className="ws-stat">
                      <div className="ws-stat-num" style={{ color: 'var(--success)' }}>
                        +{margin.leadVotes.toLocaleString()}
                      </div>
                      <div className="ws-stat-label">Lead vs #2</div>
                    </div>
                  ) : null}
                </div>
                <div className="ws-actions">
                  <Link to={`/elections/${electionId}`} className="ws-btn primary">
                    Election details
                  </Link>
                  <button type="button" className="ws-btn ghost" onClick={() => void handleShare()}>
                    {copyOk ? 'Link copied' : 'Share results'}
                  </button>
                </div>
                <div className="ws-progress">
                  <div className="ws-prog-header">
                    <span className="ws-prog-label">Vote share</span>
                    <span className="ws-prog-val">{winnerShare}%</span>
                  </div>
                  <div className="ws-prog-track">
                    <div className="ws-prog-fill" style={{ width: `${winnerShare}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <div className="panel">
          <div className="panel-head">
            <div>
              <div className="panel-title">Transparency & Security</div>
              <div className="panel-sub">How your vote is protected</div>
            </div>
          </div>
          <div className="panel-body">
            <div className="transparency-grid">
              {[
                { title: 'Anonymous ballots', desc: 'Votes cannot be linked to voter identity.' },
                { title: 'Duplicate protection', desc: 'Each eligible voter may cast at most one ballot.' },
                { title: 'Immutable records', desc: 'Ballots are stored with tamper-evident logging.' },
                { title: 'Encrypted in transit', desc: 'All traffic uses modern TLS encryption.' },
              ].map((row) => (
                <div key={row.title} className="tr-card">
                  <div className="tr-icon">
                    <svg viewBox="0 0 24 24" aria-hidden>
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <div className="tr-content">
                    <div className="tr-title">
                      <span className="tr-check">
                        <svg viewBox="0 0 24 24" aria-hidden>
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </span>
                      {row.title}
                    </div>
                    <div className="tr-desc">{row.desc}</div>
                    <div className="tr-verified">Verified</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="share-row">
              <button type="button" className="share-btn link" onClick={() => void handleShare()}>
                {copyOk ? '✓ Copied!' : 'Copy link'}
              </button>
              <Link to={voterEmbed ? '/voter/results' : '/browse-elections'} className="share-btn">
                {voterEmbed ? '← All my results' : 'Browse elections'}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {!voterEmbed ? <LiveResultsFooter /> : null}
    </div>
  )
}
