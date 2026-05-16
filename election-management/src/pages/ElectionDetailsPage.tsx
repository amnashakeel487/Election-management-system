import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ElectionParticipationCard } from '@/components/election/ElectionParticipationCard'
import { Footer } from '@/components/layout/Footer'
import { TopNavBar } from '@/components/layout/TopNavBar'
import {
  CANDIDATE_PLACEHOLDER_IMAGES,
  ELECTION_DETAILS_HERO,
} from '@/constants/electionDetailsAssets'
import { useAuth } from '@/hooks/useAuth'
import { fetchElectionById } from '@/services/electionService'
import {
  fetchElectionRegistrationStats,
  fetchUserRegistrationForElection,
} from '@/services/voterRegistrationService'
import type { ElectionWithCandidates } from '@/types/election'
import type { ElectionRegistrationStats, VoterRegistration } from '@/types/voterRegistration'
import { candidatePortraitOrPlaceholder } from '@/utils/candidateDisplay'
import { formatElectionCode, formatTimeRemaining } from '@/utils/electionTime'
import { isPollingOpen } from '@/utils/electionPolling'

function formatMilestoneDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
}

function formatVoterCount(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}k`
  return count.toLocaleString()
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
      <div className="min-h-screen bg-surface text-on-surface">
        <TopNavBar />
        <main className="flex min-h-screen items-center justify-center pt-16">
          <p className="font-body-md text-body-md text-on-surface-variant">Loading election…</p>
        </main>
      </div>
    )
  }

  if (error || !election || !stats) {
    return (
      <div className="min-h-screen bg-surface text-on-surface">
        <TopNavBar />
        <main className="flex min-h-screen flex-col items-center justify-center gap-4 pt-16">
          <p className="font-body-md text-body-md text-error">{error ?? 'Election not found'}</p>
          <Link to="/" className="font-body-md text-primary hover:underline">
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
    <div className="min-h-screen bg-surface font-body-md text-on-surface selection:bg-primary/30">
      <TopNavBar />
      <main className="min-h-screen pb-24 pt-16">
        <section className="relative h-[400px] w-full overflow-hidden">
          <img
            src={ELECTION_DETAILS_HERO}
            alt=""
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/40 to-transparent" />
          <div className="absolute bottom-0 left-0 w-full p-margin pb-xl md:px-2xl">
            <div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 md:flex-row md:items-end">
              <div>
                <div className="mb-4 flex items-center gap-2">
                  <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 font-label-sm text-label-sm text-primary">
                    {isPolling ? 'Active Election' : 'Open Registration'}
                  </span>
                  <span className="rounded-full border border-tertiary/20 bg-tertiary/10 px-3 py-1 font-label-sm text-label-sm text-tertiary">
                    ID: {formatElectionCode(election.id)}
                  </span>
                </div>
                <h1 className="mb-2 font-headline-xl text-headline-xl text-on-surface">{election.title}</h1>
                <p className="max-w-2xl font-body-lg text-body-lg text-on-surface-variant">
                  {election.description ??
                    'Shape the future of decentralized infrastructure. Your vote is secured by multi-layered cryptographic verification.'}
                </p>
              </div>
              <div className="glass min-w-[320px] rounded-2xl p-6">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-label-md text-label-md text-on-surface-variant">Voter Participation</span>
                  <span className="font-label-md text-label-md text-primary">{stats.participation_percent}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container-highest">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${stats.participation_percent}%` }}
                  />
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-center">
                    <p className="font-headline-md text-headline-md text-on-surface">
                      {formatVoterCount(stats.registered_count)}
                    </p>
                    <p className="font-label-sm text-label-sm text-on-surface-variant">Registered Voters</p>
                  </div>
                  <div className="h-8 w-px bg-line" />
                  <div className="text-center">
                    <p className="font-headline-md text-headline-md text-on-surface">
                      {formatTimeRemaining(election.end_date)}
                    </p>
                    <p className="font-label-sm text-label-sm text-on-surface-variant">Remaining</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto mt-12 grid max-w-7xl grid-cols-1 gap-gutter px-margin lg:grid-cols-12">
          <div className="space-y-xl lg:col-span-8">
            <div>
              <h2 className="mb-6 flex items-center gap-3 font-headline-lg text-headline-lg text-on-surface">
                <span className="material-symbols-outlined text-primary">group</span>
                Leading Candidates
              </h2>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {election.candidates.map((candidate) => (
                  <div
                    key={candidate.id}
                    className="group flex flex-col gap-4 rounded-[24px] border border-line bg-surface-container p-6 transition-all hover:border-primary/40"
                  >
                      <div className="flex items-start gap-4">
                      <div className="relative">
                        <img
                          src={candidatePortraitOrPlaceholder(candidate, CANDIDATE_PLACEHOLDER_IMAGES)}
                          alt=""
                          className="h-20 w-20 rounded-2xl object-cover grayscale transition-all duration-500 group-hover:grayscale-0"
                        />
                        <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-4 border-surface-container bg-primary">
                          <span
                            className="material-symbols-outlined text-[14px] text-on-primary"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                          >
                            verified
                          </span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="mb-1 font-label-sm text-label-sm text-primary">
                          {candidate.designation?.trim() || 'Candidate'}
                        </p>
                        <h3 className="font-headline-md text-headline-md text-on-surface">{candidate.name}</h3>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">
                          {candidate.description ?? 'No manifesto provided.'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-line bg-surface-container-low p-8">
              <h2 className="mb-4 font-headline-md text-headline-md text-on-surface">Election Overview</h2>
              <div className="space-y-4 font-body-md text-on-surface-variant">
                <p>
                  {election.description ??
                    'This election is hosted on FortressVote with verified voter registration and secure ballot casting.'}
                </p>
                <p>
                  Eligible participants must sign in and join the election before polling closes. When capacity is
                  reached, additional registrants are placed on a waitlist in order of registration.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-gutter lg:col-span-4">
            <ElectionParticipationCard
              electionId={election.id}
              endDate={election.end_date}
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

            <div className="rounded-[24px] border border-line bg-surface-container p-6">
              <h3 className="mb-6 font-label-md text-label-md font-bold uppercase tracking-widest text-on-surface">
                Key Milestones
              </h3>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="h-3 w-3 rounded-full bg-on-surface-variant" />
                    <div className="h-full w-[2px] bg-line" />
                  </div>
                  <div>
                    <p className="font-label-sm text-label-sm text-on-surface-variant">
                      {formatMilestoneDate(election.created_at)}
                    </p>
                    <p className="font-body-sm text-body-sm text-on-surface">Election Created</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="h-3 w-3 rounded-full bg-on-surface-variant" />
                    <div className="h-full w-[2px] bg-line" />
                  </div>
                  <div>
                    <p className="font-label-sm text-label-sm text-on-surface-variant">
                      {formatMilestoneDate(election.start_date)}
                    </p>
                    <p className="font-body-sm text-body-sm text-on-surface">Voter Eligibility Window</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary ring-4 ring-primary/20">
                      <span
                        className="material-symbols-outlined text-[12px] text-on-primary"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        play_arrow
                      </span>
                    </div>
                    <div className="h-full w-[2px] bg-line" />
                  </div>
                  <div>
                    <p className="font-label-sm text-label-sm font-bold text-primary">
                      {isPolling ? 'Today' : 'Upcoming'}
                    </p>
                    <p className="font-body-sm text-body-sm font-bold text-on-surface">
                      {isPolling ? 'Active Polling Period' : 'Registration Open'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-4 opacity-40">
                  <div className="flex flex-col items-center">
                    <div className="h-3 w-3 rounded-full bg-on-surface-variant" />
                  </div>
                  <div>
                    <p className="font-label-sm text-label-sm text-on-surface-variant">
                      {formatMilestoneDate(election.end_date)}
                    </p>
                    <p className="font-body-sm text-body-sm text-on-surface">Audited Result Release</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
