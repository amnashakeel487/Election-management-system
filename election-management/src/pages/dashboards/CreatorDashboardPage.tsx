import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CreatorElectionsTable } from '@/components/creator/CreatorElectionsTable'
import { CreatorSidebar } from '@/components/creator/CreatorSidebar'
import { CREATOR_PROFILE_AVATAR } from '@/constants/electionAssets'
import { useAuth } from '@/hooks/useAuth'
import { fetchCreatorElections } from '@/services/electionService'
import { fetchElectionRegistrationStats } from '@/services/voterRegistrationService'
import { finalizeAndEmailSecretVoterIds } from '@/services/secretVoterIdService'
import type { Election } from '@/types/election'

/** design/election_creator_dashboard */
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

    async function load() {
      try {
        const data = await fetchCreatorElections(profile!.id)
        setElections(data)
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [profile?.id, isApproved])

  const draftCount = elections.filter((e) => e.status === 'draft').length
  const publishedCount = elections.filter((e) => e.status === 'published' || e.status === 'active').length

  async function reloadElections() {
    if (!profile?.id) return
    const data = await fetchCreatorElections(profile.id)
    setElections(data)
  }

  async function handleFinalizeVoterRoll(electionId: string) {
    const election = elections.find((e) => e.id === electionId)
    if (!election) return

    const regStats = await fetchElectionRegistrationStats(electionId)

    if (regStats.registered_count === 0) {
      const proceedEmpty = window.confirm(
        `No voters have registered for "${election.title}" yet (0 / ${regStats.max_voters}).\n\nFinalizing now will close registration permanently and no one will be able to join.\n\nAre you sure you want to finalize an empty voter roll?`,
      )
      if (!proceedEmpty) return
    } else {
      const confirmed = window.confirm(
        `Finalize the voter roll for "${election.title}"? This assigns Secret Voter IDs (e.g. ${election.secret_voter_id_prefix ?? 'POLL-A'}-0001) to ${regStats.registered_count} registered voter(s), emails each voter, and closes registration. This cannot be undone.`,
      )
      if (!confirmed) return
    }

    setFinalizingId(electionId)
    setFinalizeMessage(null)

    try {
      const { finalize, email } = await finalizeAndEmailSecretVoterIds(electionId)
      setFinalizeMessage(
        `Assigned ${finalize.assigned_count} new ID(s). Emailed ${email.sent} voter(s).${
          email.dev_mode ? ' (Dev mode: set BREVO_API_KEY in Supabase — see docs/AUTH_SETUP.md.)' : ''
        }`,
      )
      await reloadElections()
    } catch (err) {
      setFinalizeMessage(err instanceof Error ? err.message : 'Finalization failed')
    } finally {
      setFinalizingId(null)
    }
  }

  return (
    <div className="overflow-x-hidden bg-background text-on-background">
      <CreatorSidebar />

      <main className="ml-[280px] flex min-h-screen flex-col">
        <header className="sticky top-0 z-40 flex h-20 items-center justify-between bg-surface-dim px-margin py-sm">
          <div className="flex items-center gap-4">
            <button type="button" className="rounded-full p-2 transition-all hover:bg-surface-container-highest">
              <span className="material-symbols-outlined text-on-surface">menu</span>
            </button>
            <h2 className="font-headline-lg text-headline-lg text-primary">Election Creator Dashboard</h2>
          </div>
          <div className="flex items-center gap-4">
            <button type="button" className="relative rounded-full p-2 transition-all hover:bg-surface-container-highest">
              <span className="material-symbols-outlined text-on-surface">notifications</span>
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-error" />
            </button>
            <div className="flex items-center gap-3 border-l border-line pl-4">
              <img
                alt="User Avatar"
                className="h-10 w-10 rounded-full border border-primary/30 object-cover"
                src={CREATOR_PROFILE_AVATAR}
              />
              <div className="hidden lg:block">
                <p className="font-label-md text-label-md text-on-surface">{profile?.email ?? 'Creator'}</p>
                <p className="text-[10px] uppercase text-on-surface-variant">Elections Board</p>
              </div>
            </div>
          </div>
        </header>

        <div className="space-y-gutter p-margin">
          {isPending ? (
            <div className="rounded-[24px] border border-secondary/20 bg-secondary-container/10 p-lg">
              <div className="mb-2 flex items-center gap-2">
                <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-secondary" />
                <span className="font-label-sm text-label-sm font-bold uppercase tracking-widest text-secondary">
                  Pending Admin Approval
                </span>
              </div>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Your election creator access request is under review.
              </p>
            </div>
          ) : null}

          {isRejected ? (
            <div className="rounded-[24px] border border-error/30 bg-error-container/20 p-lg">
              <p className="font-label-md text-label-md text-error">Application Rejected</p>
            </div>
          ) : null}

          {isApproved ? (
            <>
              <div className="grid grid-cols-1 gap-gutter md:grid-cols-4">
                <div className="flex flex-col justify-between rounded-3xl border border-line bg-surface-container p-6 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="rounded-2xl bg-primary/10 p-3">
                      <span className="material-symbols-outlined text-primary">how_to_reg</span>
                    </div>
                    <span className="text-xs font-bold text-tertiary">—</span>
                  </div>
                  <div className="mt-4">
                    <p className="font-label-md text-label-md text-on-surface-variant">Total Elections</p>
                    <h3 className="mt-1 font-headline-lg text-headline-lg">{elections.length}</h3>
                  </div>
                </div>
                <div className="flex flex-col justify-between rounded-3xl border border-line bg-surface-container p-6 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="rounded-2xl bg-secondary/10 p-3">
                      <span className="material-symbols-outlined text-secondary">pending_actions</span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="font-label-md text-label-md text-on-surface-variant">Draft Elections</p>
                    <h3 className="mt-1 font-headline-lg text-headline-lg">{draftCount}</h3>
                  </div>
                </div>
                <div className="flex flex-col justify-between rounded-3xl border border-line bg-surface-container p-6 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="rounded-2xl bg-tertiary/10 p-3">
                      <span className="material-symbols-outlined text-tertiary">verified</span>
                    </div>
                    <span className="text-xs font-bold text-tertiary">Live</span>
                  </div>
                  <div className="mt-4">
                    <p className="font-label-md text-label-md text-on-surface-variant">Published</p>
                    <h3 className="mt-1 font-headline-lg text-headline-lg">{publishedCount}</h3>
                  </div>
                </div>
                <div className="flex flex-col justify-between rounded-3xl border border-line bg-surface-container p-6 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="rounded-2xl bg-error/10 p-3">
                      <span className="material-symbols-outlined text-error">timer</span>
                    </div>
                    <span className="text-xs font-bold text-on-surface-variant">Ready</span>
                  </div>
                  <div className="mt-4">
                    <p className="font-label-md text-label-md text-on-surface-variant">Create New</p>
                    <Link to="/creator/elections/new" className="mt-1 block font-headline-lg text-headline-lg text-primary hover:underline">
                      Start →
                    </Link>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-gutter lg:grid-cols-3">
                {loading ? (
                  <p className="font-body-md text-body-md text-on-surface-variant lg:col-span-2">Loading elections…</p>
                ) : (
                  <>
                    {finalizeMessage ? (
                      <p className="mb-4 rounded-xl border border-tertiary/30 bg-tertiary/10 px-md py-sm font-body-sm text-body-sm text-tertiary lg:col-span-3">
                        {finalizeMessage}
                      </p>
                    ) : null}
                    <CreatorElectionsTable
                      elections={elections}
                      finalizingId={finalizingId}
                      onFinalizeVoterRoll={(id) => void handleFinalizeVoterRoll(id)}
                      onRollChanged={() => void reloadElections()}
                    />
                  </>
                )}

                <div className="space-y-gutter">
                  <div className="relative overflow-hidden rounded-[32px] border border-line bg-surface-container p-8">
                    <div className="relative z-10">
                      <h4 className="mb-2 font-headline-md text-headline-md text-on-surface">Registration Flow</h4>
                      <p className="mb-6 font-body-sm text-body-sm text-on-surface-variant">
                        Real-time daily voter enrollment tracking across all jurisdictions.
                      </p>
                    </div>
                    <div className="absolute -bottom-12 -right-12 h-48 w-48 rounded-full bg-primary/10 blur-[80px]" />
                  </div>
                  <div className="rounded-[32px] border border-line bg-surface-container p-8">
                    <h4 className="mb-6 font-headline-md text-headline-md text-on-surface">Security Controls</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between rounded-2xl border border-line bg-surface-container-high p-4">
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-tertiary">shield</span>
                          <p className="font-label-md text-label-md text-on-surface">Encrypted Vault</p>
                        </div>
                        <div className="relative flex h-5 w-10 items-center rounded-full bg-tertiary px-1">
                          <div className="absolute right-1 h-3 w-3 rounded-full bg-white" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>

        <footer className="mt-auto flex w-full flex-col items-center justify-between border-t border-line bg-surface-container-lowest px-margin py-xl md:flex-row">
          <div className="mb-4 md:mb-0">
            <h5 className="font-label-md text-label-md font-bold text-on-surface">FortressVote</h5>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              © 2024 FortressVote Secure Systems. All Rights Reserved.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-6">
            <a className="font-body-sm text-body-sm text-on-surface-variant transition-colors hover:text-primary" href="#">
              Privacy Policy
            </a>
            <a className="font-body-sm text-body-sm text-on-surface-variant transition-colors hover:text-primary" href="#">
              Terms of Service
            </a>
            <a className="font-body-sm text-body-sm text-on-surface-variant transition-colors hover:text-primary" href="#">
              Security Audit
            </a>
            <a className="font-body-sm text-body-sm text-on-surface-variant transition-colors hover:text-primary" href="#">
              Voter Rights
            </a>
          </div>
        </footer>
      </main>

      {isApproved ? (
        <Link
          to="/creator/elections/new"
          className="fixed bottom-10 right-10 z-50 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-on-primary shadow-2xl transition-all hover:scale-105 active:scale-95"
        >
          <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            add
          </span>
        </Link>
      ) : null}
    </div>
  )
}
