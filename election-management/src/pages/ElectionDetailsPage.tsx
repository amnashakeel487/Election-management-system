import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CandidateAvatar } from '@/components/election/CandidateAvatar'
import { VoterRegistrationPanel } from '@/components/voter/VoterRegistrationPanel'
import { Footer } from '@/components/layout/Footer'
import { TopNavBar } from '@/components/layout/TopNavBar'
import { useAuth } from '@/hooks/useAuth'
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
          <Link to="/#elections-catalog" className="ed-back">
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
        <main className="pt-16">
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

  return (
    <div className="ed-root">
      <TopNavBar />
      <main className="pt-16">
        <ElectionDetailsHero election={election} stats={stats} isPolling={isPolling} />

        <div className="ed-main">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10">
            <div className="space-y-8 lg:col-span-8">
              <section>
                <h2 className="ed-section-title">
                  <span className="material-symbols-outlined">groups</span>
                  Candidates
                </h2>
                {election.candidates.length === 0 ? (
                  <p className="text-sm text-slate-500">No candidates have been added yet.</p>
                ) : (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {election.candidates.map((candidate) => (
                      <article key={candidate.id} className="ed-candidate-card">
                        <CandidateAvatar name={candidate.name} photoUrl={candidate.photo_url} size="md" />
                        <div className="min-w-0 flex-1">
                          <p className="ed-candidate-role">{candidate.designation?.trim() || 'Candidate'}</p>
                          <h3 className="ed-candidate-name">{candidate.name}</h3>
                          <p className="ed-candidate-bio">{candidate.description ?? 'No manifesto provided.'}</p>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>

              <section className="ed-panel">
                <h2 className="mb-3 text-base">Election overview</h2>
                <div className="space-y-3 text-sm leading-relaxed text-slate-600">
                  <p>
                    {election.description ??
                      'This election is hosted on FortressVote with verified voter registration and secure ballot casting.'}
                  </p>
                  <p>
                    Eligible participants must sign in and join before the registration deadline. Registration
                    auto-locks when capacity is reached; the organizer finalizes the voter roll to freeze the list
                    and issue secret voter IDs.
                  </p>
                  <p className="text-xs text-slate-400">
                    Capacity: {stats.registered_count.toLocaleString()} / {stats.max_voters.toLocaleString()} voters
                    {election.real_time_results ? ' · Live results enabled' : ''}
                  </p>
                </div>
              </section>
            </div>

            <aside className="space-y-6 lg:col-span-4">
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

              <div className="ed-panel">
                <h3 className="mb-5 text-xs font-bold uppercase tracking-widest text-slate-500">Key milestones</h3>
                <div className="space-y-5">
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center pt-1">
                      <div className="ed-milestone-dot" />
                      <div className="mt-1 w-px flex-1 bg-slate-200" style={{ minHeight: 24 }} />
                    </div>
                    <div className="pb-1">
                      <p className="text-[11px] text-slate-400">{formatMilestoneDate(election.created_at)}</p>
                      <p className="text-sm font-medium text-slate-800">Election created</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center pt-1">
                      <div className="ed-milestone-dot" />
                      <div className="mt-1 w-px flex-1 bg-slate-200" style={{ minHeight: 24 }} />
                    </div>
                    <div className="pb-1">
                      <p className="text-[11px] text-slate-400">{formatMilestoneDate(election.start_date)}</p>
                      <p className="text-sm font-medium text-slate-800">Voting opens</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center pt-1">
                      <div className="ed-milestone-dot ed-milestone-dot--active flex items-center justify-center">
                        <span className="material-symbols-outlined text-[10px] text-white">play_arrow</span>
                      </div>
                      <div className="mt-1 w-px flex-1 bg-slate-200" style={{ minHeight: 24 }} />
                    </div>
                    <div className="pb-1">
                      <p className="text-[11px] font-bold text-[#2451A3]">{isPolling ? 'Now' : 'Upcoming'}</p>
                      <p className="text-sm font-bold text-slate-800">
                        {isPolling ? 'Active polling' : 'Registration open'}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3 opacity-60">
                    <div className="flex flex-col items-center pt-1">
                      <div className="ed-milestone-dot" />
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-400">{formatMilestoneDate(election.end_date)}</p>
                      <p className="text-sm font-medium text-slate-800">Results &amp; close</p>
                    </div>
                  </div>
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
