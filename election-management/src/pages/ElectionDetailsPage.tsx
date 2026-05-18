import { useCallback, useEffect, useState, type CSSProperties } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CandidateAvatar } from '@/components/election/CandidateAvatar'
import { VotingEligibilityPanel } from '@/components/voting/VotingEligibilityPanel'
import { VoterRegistrationPanel } from '@/components/voter/VoterRegistrationPanel'
import { Footer } from '@/components/layout/Footer'
import { TopNavBar } from '@/components/layout/TopNavBar'
import { useAuth } from '@/hooks/useAuth'
import { useEnsureVotingReadyWhenDue } from '@/hooks/useEnsureVotingReadyWhenDue'
import { fetchElectionById } from '@/services/electionService'
import {
  fetchElectionRegistrationStats,
  fetchUserRegistrationForElection,
} from '@/services/voterRegistrationService'
import type { ElectionWithCandidates } from '@/types/election'
import type { ElectionRegistrationStats, VoterRegistration } from '@/types/voterRegistration'
import { formatElectionCode, formatTimeRemaining } from '@/utils/electionTime'
import { isPollingOpen } from '@/utils/electionPolling'
import './election-details-page.css'

function formatMilestoneDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
}

function formatVoterCount(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}k`
  return count.toLocaleString()
}

function ElectionQuickStats({
  stats,
  candidateCount,
  endDate,
}: {
  stats: ElectionRegistrationStats
  candidateCount: number
  endDate: string
}) {
  const capacityPct =
    stats.max_voters > 0
      ? Math.min(100, Math.round((stats.registered_count / stats.max_voters) * 100))
      : 0

  const cards = [
    {
      key: 'registered',
      label: 'Registered',
      icon: 'how_to_reg',
      tone: 'blue',
      value: stats.registered_count.toLocaleString(),
      sub: stats.max_voters > 0 ? `${capacityPct}% of capacity` : undefined,
      fillPct: capacityPct,
    },
    {
      key: 'capacity',
      label: 'Capacity',
      icon: 'groups',
      tone: 'purple',
      value: stats.max_voters.toLocaleString(),
      sub: 'Maximum voters',
    },
    {
      key: 'candidates',
      label: 'Candidates',
      icon: 'ballot',
      tone: 'cyan',
      value: candidateCount.toLocaleString(),
      sub: candidateCount === 1 ? '1 on the ballot' : `${candidateCount} on the ballot`,
    },
    {
      key: 'time',
      label: 'Time left',
      icon: 'schedule',
      tone: 'amber',
      value: formatTimeRemaining(endDate),
      sub: 'Until voting ends',
      valueSm: true,
    },
  ] as const

  return (
    <div className="ed-quick-stats" aria-label="Election summary">
      {cards.map((card, index) => (
        <article
          key={card.key}
          className={`ed-qs-card ed-qs-card--${card.tone}`}
          style={{ '--ed-qs-delay': `${index * 90}ms` } as CSSProperties}
        >
          <div className="ed-qs-accent" aria-hidden />
          <div className="ed-qs-icon" aria-hidden>
            <span className="material-symbols-outlined">{card.icon}</span>
          </div>
          <div className="ed-qs-label">{card.label}</div>
          <div className={`ed-qs-value${'valueSm' in card && card.valueSm ? ' ed-qs-value--sm' : ''}`}>
            {card.value}
          </div>
          {card.sub ? <p className="ed-qs-sub">{card.sub}</p> : null}
          {'fillPct' in card ? (
            <div className="ed-qs-track" aria-hidden>
              <div className="ed-qs-track-fill" style={{ width: `${card.fillPct}%` }} />
            </div>
          ) : null}
        </article>
      ))}
    </div>
  )
}

function ElectionDetailsHero({
  election,
  stats,
  isPolling,
}: {
  election: ElectionWithCandidates
  stats: ElectionRegistrationStats
  isPolling: boolean
}) {
  return (
    <section className="ed-hero">
      <div className="ed-hero-grid" aria-hidden />
      <div className="ed-hero-orb ed-hero-orb--1" aria-hidden />
      <div className="ed-hero-orb ed-hero-orb--2" aria-hidden />
      <div className="ed-hero-inner">
        <div className="min-w-0 flex-1">
          <Link to="/browse-elections" className="ed-back">
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Back to elections
          </Link>
          <div className="ed-badge-row">
            <span className={`ed-badge ${isPolling ? 'ed-badge--live' : 'ed-badge--id'}`}>
              {isPolling ? 'Active polling' : 'Open registration'}
            </span>
            <span className="ed-badge ed-badge--id">ID: {formatElectionCode(election.id)}</span>
            {election.category?.trim() ? (
              <span className="ed-badge ed-badge--id">{election.category.trim()}</span>
            ) : null}
          </div>
          <h1 className="ed-hero-title">{election.title}</h1>
          <p className="ed-hero-desc">
            {election.description?.trim() ||
              'Secure voter registration and encrypted ballot casting on FortressVote.'}
          </p>
        </div>
        <div className="ed-stats-card">
          <div className="ed-stats-label">
            <span>Voter participation</span>
            <span className="ed-stats-pct">{stats.participation_percent}%</span>
          </div>
          <div className="ed-stats-bar">
            <div className="ed-stats-bar-fill" style={{ width: `${stats.participation_percent}%` }} />
          </div>
          <div className="ed-stats-row">
            <div>
              <div className="ed-stats-num">{formatVoterCount(stats.registered_count)}</div>
              <div className="ed-stats-caption">Registered</div>
            </div>
            <div className="text-right">
              <div className="ed-stats-num">{formatTimeRemaining(election.end_date)}</div>
              <div className="ed-stats-caption">Remaining</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export function ElectionDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const { session } = useAuth()

  const [election, setElection] = useState<ElectionWithCandidates | null>(null)
  const [stats, setStats] = useState<ElectionRegistrationStats | null>(null)
  const [userRegistration, setUserRegistration] = useState<VoterRegistration | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadRegistrationData = useCallback(async () => {
    if (!id) return

    const [statsData, registration] = await Promise.all([
      fetchElectionRegistrationStats(id),
      session?.user.id
        ? fetchUserRegistrationForElection(id, session.user.id)
        : Promise.resolve(null),
    ])

    setStats(statsData)
    setUserRegistration(registration)
  }, [id, session?.user.id])

  const reloadElection = useCallback(async () => {
    if (!id) return
    const data = await fetchElectionById(id)
    if (!data || !['published', 'active'].includes(data.status)) return
    setElection(data)
    await loadRegistrationData()
  }, [id, loadRegistrationData])

  useEnsureVotingReadyWhenDue({
    election,
    enabled: Boolean(election),
    onPrepared: () => reloadElection(),
  })

  useEffect(() => {
    if (!id) return

    let cancelled = false

    async function load() {
      if (!id) return

      setLoading(true)
      setError(null)

      try {
        const data = await fetchElectionById(id)
        if (cancelled) return

        if (!data || !['published', 'active'].includes(data.status)) {
          setElection(null)
          setError('Election not found or not available for registration.')
          return
        }

        setElection(data)
        await loadRegistrationData()
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load election')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [id, loadRegistrationData])

  if (loading) {
    return (
      <div className="ed-root">
        <TopNavBar />
        <main className="ed-page-main pt-16">
          <div className="ed-loading-hero flex items-center justify-center">
            <p className="text-sm font-medium text-white/60">Loading election…</p>
          </div>
        </main>
      </div>
    )
  }

  if (error || !election || !stats) {
    return (
      <div className="ed-root">
        <TopNavBar />
        <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 pt-24">
          <p className="text-center text-sm text-red-600">{error ?? 'Election not found'}</p>
          <Link
            to="/"
            className="rounded-lg bg-gradient-to-br from-[#1B3A6B] to-[#6C3FC5] px-5 py-2.5 text-sm font-bold text-white no-underline"
          >
            Back to home
          </Link>
        </main>
      </div>
    )
  }

  const now = Date.now()
  const startMs = new Date(election.start_date).getTime()
  const endMs = new Date(election.end_date).getTime()
  const isPolling = now >= startMs && now <= endMs
  const categoryLabel = election.category?.trim().replace(/_/g, ' ') ?? 'General election'
  const regClosesLabel = election.registration_deadline
    ? formatMilestoneDate(election.registration_deadline)
    : formatMilestoneDate(election.start_date)

  return (
    <div className="ed-root">
      <TopNavBar />
      <main className="ed-page-main pt-16">
        <ElectionDetailsHero election={election} stats={stats} isPolling={isPolling} />

        <ElectionQuickStats
          stats={stats}
          candidateCount={election.candidates.length}
          endDate={election.end_date}
        />

        <div className="ed-main">
          <div className="ed-layout">
            <div className="ed-layout-primary">
              <section>
                <h2 className="ed-section-title">
                  <span className="material-symbols-outlined">groups</span>
                  Candidates
                </h2>
                {election.candidates.length === 0 ? (
                  <div className="ed-panel">
                    <p className="text-sm text-slate-500">No candidates have been added yet.</p>
                  </div>
                ) : (
                  <div className="ed-candidates-grid">
                    {election.candidates.map((candidate) => (
                      <article key={candidate.id} className="ed-candidate-card">
                        <CandidateAvatar name={candidate.name} photoUrl={candidate.photo_url} size="md" />
                        <div className="min-w-0 flex-1">
                          <p className="ed-candidate-role">{candidate.designation?.trim() || 'Candidate'}</p>
                          <h3 className="ed-candidate-name">{candidate.name}</h3>
                          <p className="ed-candidate-bio line-clamp-3">
                            {candidate.description?.trim() || 'No manifesto provided.'}
                          </p>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>

              <section className="ed-panel">
                <h2 className="mb-4 text-base font-extrabold tracking-tight text-slate-900">About this election</h2>
                <p className="ed-overview-text">
                  {election.description?.trim() ||
                    'This election is hosted on FortressVote with verified voter registration and secure ballot casting.'}
                </p>
                <div className="ed-info-grid">
                  <div className="ed-info-item">
                    <div className="ed-info-icon">
                      <span className="material-symbols-outlined">category</span>
                    </div>
                    <div>
                      <div className="ed-info-label">Category</div>
                      <div className="ed-info-value" style={{ textTransform: 'capitalize' }}>
                        {categoryLabel}
                      </div>
                    </div>
                  </div>
                  <div className="ed-info-item">
                    <div className="ed-info-icon">
                      <span className="material-symbols-outlined">event</span>
                    </div>
                    <div>
                      <div className="ed-info-label">Registration closes</div>
                      <div className="ed-info-value">{regClosesLabel}</div>
                    </div>
                  </div>
                  <div className="ed-info-item">
                    <div className="ed-info-icon">
                      <span className="material-symbols-outlined">how_to_vote</span>
                    </div>
                    <div>
                      <div className="ed-info-label">Voting window</div>
                      <div className="ed-info-value">
                        {formatMilestoneDate(election.start_date)} → {formatMilestoneDate(election.end_date)}
                      </div>
                    </div>
                  </div>
                  <div className="ed-info-item">
                    <div className="ed-info-icon">
                      <span className="material-symbols-outlined">insights</span>
                    </div>
                    <div>
                      <div className="ed-info-label">Results</div>
                      <div className="ed-info-value">
                        {election.real_time_results ? 'Live results when published' : 'Published after close'}
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="ed-panel">
                <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-500">Key milestones</h2>
                <div className="ed-milestones">
                  <div className="ed-milestone-row">
                    <div className="ed-milestone-track">
                      <div className="ed-milestone-dot" />
                      <div className="ed-milestone-line" />
                    </div>
                    <div className="ed-milestone-body">
                      <p className="text-[11px] text-slate-400">{formatMilestoneDate(election.created_at)}</p>
                      <p className="text-sm font-medium text-slate-800">Election created</p>
                    </div>
                  </div>
                  <div className="ed-milestone-row">
                    <div className="ed-milestone-track">
                      <div className="ed-milestone-dot" />
                      <div className="ed-milestone-line" />
                    </div>
                    <div className="ed-milestone-body">
                      <p className="text-[11px] text-slate-400">{formatMilestoneDate(election.start_date)}</p>
                      <p className="text-sm font-medium text-slate-800">Voting opens</p>
                    </div>
                  </div>
                  <div className="ed-milestone-row">
                    <div className="ed-milestone-track">
                      <div className="ed-milestone-dot ed-milestone-dot--active flex items-center justify-center">
                        <span className="material-symbols-outlined text-[10px] text-white">play_arrow</span>
                      </div>
                      <div className="ed-milestone-line" />
                    </div>
                    <div className="ed-milestone-body">
                      <p className="text-[11px] font-bold text-[#2451A3]">{isPolling ? 'Now' : 'Current phase'}</p>
                      <p className="text-sm font-bold text-slate-800">
                        {isPolling ? 'Active polling' : 'Registration open'}
                      </p>
                    </div>
                  </div>
                  <div className="ed-milestone-row opacity-75">
                    <div className="ed-milestone-track">
                      <div className="ed-milestone-dot" />
                    </div>
                    <div className="ed-milestone-body">
                      <p className="text-[11px] text-slate-400">{formatMilestoneDate(election.end_date)}</p>
                      <p className="text-sm font-medium text-slate-800">Results &amp; close</p>
                      {election.real_time_results ? (
                        <Link
                          to={`/elections/${election.id}/results`}
                          className="mt-1 inline-block text-xs font-semibold text-[#2451A3] no-underline hover:underline"
                        >
                          View results page →
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <aside className="ed-layout-sidebar">
              <VoterRegistrationPanel
                className="ed-participation-card"
                election={election}
                stats={stats}
                userRegistration={userRegistration}
                voterRollFinalized={Boolean(election.voter_roll_finalized_at)}
                canCastVote={
                  isPollingOpen(election) &&
                  Boolean(userRegistration?.secret_voter_id) &&
                  !userRegistration?.voted_at
                }
                onRegistrationChange={() => void loadRegistrationData()}
              />

              <VotingEligibilityPanel
                election={election}
                registration={userRegistration}
                sessionUserId={session?.user.id}
              />

              <div className="ed-panel">
                <div className="ed-callout">
                  <span className="material-symbols-outlined">badge</span>
                  <p>
                    Secret voter IDs look like <code>{election.secret_voter_id_prefix}-0001</code>. They are issued
                    after the organizer finalizes the roll and are unique per election.
                  </p>
                </div>
              </div>

            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

