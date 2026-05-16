import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { TopNavBar } from '@/components/layout/TopNavBar'
import { Footer } from '@/components/layout/Footer'
import { useAuth } from '@/hooks/useAuth'
import { SecretVoterIdDisplay } from '@/components/voter/SecretVoterIdDisplay'
import { fetchUserRegistrations } from '@/services/voterRegistrationService'
import type { VoterRegistrationWithElection } from '@/types/voterRegistration'
import { isPollingOpen } from '@/utils/electionPolling'
import '@/components/voter/voter-registration-panel.css'

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

  const registeredCount = registrations.filter((r) => r.status === 'registered').length
  const waitlistCount = registrations.filter((r) => r.status === 'waitlisted').length

  return (
    <div className="min-h-screen bg-[#f0f4f9]">
      <TopNavBar />
      <main className="mx-auto max-w-4xl px-4 pb-16 pt-24 sm:px-6">
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold tracking-tight text-[#0f172a]">Voter dashboard</h1>
          <p className="mt-2 text-sm text-slate-600">
            Welcome, {profile?.full_name?.trim() || profile?.email}. Manage elections you have joined.
          </p>
        </div>

        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="vr-meta-cell">
            <p className="vr-meta-label">Registered</p>
            <p className="vr-meta-value">{registeredCount}</p>
          </div>
          <div className="vr-meta-cell">
            <p className="vr-meta-label">Waitlisted</p>
            <p className="vr-meta-value">{waitlistCount}</p>
          </div>
          <div className="vr-meta-cell col-span-2 sm:col-span-1">
            <p className="vr-meta-label">Account</p>
            <p className="vr-meta-value capitalize">{profile?.approval_status ?? '—'}</p>
          </div>
        </div>

        <section className="vr-panel">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="vr-panel-title">My election registrations</h2>
            <Link
              to="/#elections-catalog"
              className="rounded-lg bg-gradient-to-br from-[#1B3A6B] to-[#6C3FC5] px-4 py-2 text-xs font-bold text-white no-underline"
            >
              Browse elections
            </Link>
          </div>

          {loading ? (
            <p className="text-sm text-slate-500">Loading registrations…</p>
          ) : registrations.length === 0 ? (
            <p className="text-sm text-slate-600">
              You have not joined any elections yet. Browse the catalog and use{' '}
              <strong>I want to participate</strong> on an election page to register.
            </p>
          ) : (
            <ul className="space-y-3">
              {registrations.map((reg) => {
                const electionOpen =
                  reg.election &&
                  isPollingOpen({
                    start_date: reg.election.start_date,
                    end_date: reg.election.end_date,
                    status: reg.election.status as 'published' | 'active',
                    voter_roll_finalized_at: reg.election.voter_roll_finalized_at ?? null,
                  })

                return (
                  <li
                    key={reg.id}
                    className="rounded-xl border border-[#e2e8f0] bg-white p-4 transition-shadow hover:shadow-md"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900">{reg.election?.title ?? 'Election'}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          Joined {new Date(reg.created_at).toLocaleDateString()} ·{' '}
                          <span
                            className={
                              reg.status === 'registered' ? 'font-semibold text-emerald-700' : 'font-semibold text-amber-700'
                            }
                          >
                            {reg.status === 'registered'
                              ? 'Registered voter'
                              : `Waitlist #${reg.waitlist_position}`}
                          </span>
                        </p>
                        {reg.status === 'registered' && reg.secret_voter_id ? (
                          <div className="mt-2">
                            <SecretVoterIdDisplay
                              secretVoterId={reg.secret_voter_id}
                              emailed={Boolean(reg.secret_voter_id_emailed_at)}
                              compact
                            />
                          </div>
                        ) : null}
                        {reg.voted_at ? (
                          <p className="mt-2 text-xs font-semibold text-[#2451A3]">Ballot cast</p>
                        ) : null}
                      </div>
                      {reg.election?.id ? (
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <Link
                            to={`/elections/${reg.election.id}`}
                            className="rounded-lg border border-[#2451A3]/30 px-3 py-2 text-center text-xs font-bold text-[#2451A3] no-underline hover:bg-[#2451A3]/5"
                          >
                            View election
                          </Link>
                          {reg.status === 'registered' &&
                          reg.secret_voter_id &&
                          !reg.voted_at &&
                          reg.election &&
                          electionOpen ? (
                            <Link
                              to={`/elections/${reg.election.id}/vote`}
                              className="rounded-lg bg-gradient-to-br from-[#1B3A6B] to-[#6C3FC5] px-3 py-2 text-center text-xs font-bold text-white no-underline"
                            >
                              Vote
                            </Link>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/"
            className="rounded-xl border border-[#e2e8f0] bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 no-underline hover:bg-slate-50"
          >
            Home
          </Link>
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="rounded-xl bg-gradient-to-br from-[#1B3A6B] to-[#6C3FC5] px-5 py-2.5 text-sm font-bold text-white"
          >
            Log out
          </button>
        </div>
      </main>
      <Footer />
    </div>
  )
}
