import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { SecretVoterIdDisplay } from '@/components/voter/SecretVoterIdDisplay'
import { fetchUserRegistrations } from '@/services/voterRegistrationService'
import type { VoterRegistrationWithElection } from '@/types/voterRegistration'

export function VoterDashboardPage() {
  const { profile, session, signOut } = useAuth()
  const navigate = useNavigate()
  const [registrations, setRegistrations] = useState<VoterRegistrationWithElection[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const userId = session?.user.id
    if (!userId) return

    let cancelled = false

    async function load(uid: string) {
      try {
        const data = await fetchUserRegistrations(uid)
        if (!cancelled) setRegistrations(data)
      } catch {
        if (!cancelled) setRegistrations([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load(userId)
    return () => {
      cancelled = true
    }
  }, [session?.user.id])

  async function handleLogout() {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-surface px-margin py-2xl text-on-surface">
      <div className="mx-auto max-w-4xl">
        <h1 className="font-headline-lg text-headline-lg text-primary">Voter Dashboard</h1>
        <p className="mt-2 font-body-md text-body-md text-on-surface-variant">
          Welcome, {profile?.email}. Manage your election registrations below.
        </p>

        <section className="mt-xl">
          <h2 className="mb-4 font-headline-md text-headline-md text-on-surface">My Elections</h2>
          {loading ? (
            <p className="font-body-sm text-body-sm text-on-surface-variant">Loading registrations…</p>
          ) : registrations.length === 0 ? (
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              You have not joined any elections yet.{' '}
              <Link to="/" className="text-primary hover:underline">
                Browse elections
              </Link>
            </p>
          ) : (
            <ul className="space-y-4">
              {registrations.map((reg) => (
                <li
                  key={reg.id}
                  className="rounded-xl border border-white/10 bg-surface-container p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-headline-md text-headline-md text-on-surface">
                        {reg.election?.title ?? 'Election'}
                      </p>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">
                        Status:{' '}
                        <span className={reg.status === 'registered' ? 'text-primary' : 'text-secondary'}>
                          {reg.status === 'registered' ? 'Registered' : `Waitlisted #${reg.waitlist_position}`}
                        </span>
                      </p>
                      {reg.status === 'registered' && reg.secret_voter_id ? (
                        <SecretVoterIdDisplay
                          secretVoterId={reg.secret_voter_id}
                          emailed={Boolean(reg.secret_voter_id_emailed_at)}
                          compact
                        />
                      ) : reg.status === 'registered' ? (
                        <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
                          {reg.election?.voter_roll_finalized_at
                            ? 'Secret voter ID pending assignment.'
                            : 'Secret voter ID will be issued after the organizer finalizes the voter roll.'}
                        </p>
                      ) : null}
                    </div>
                    {reg.election?.id ? (
                      <Link
                        to={`/elections/${reg.election.id}`}
                        className="rounded-lg border border-primary/20 px-4 py-2 font-label-md text-label-md text-primary hover:bg-primary/10"
                      >
                        View Election
                      </Link>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="mt-xl flex gap-md">
          <Link to="/" className="rounded-xl border border-outline px-lg py-md font-body-md hover:bg-surface-container">
            Home
          </Link>
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="rounded-xl bg-primary px-lg py-md font-body-md text-on-primary hover:opacity-90"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  )
}
