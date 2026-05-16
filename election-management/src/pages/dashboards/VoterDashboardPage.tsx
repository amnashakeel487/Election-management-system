import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { VoteSecureDashboardShell } from '@/components/dashboard/VoteSecureDashboardShell'
import { SecretVoterIdDisplay } from '@/components/voter/SecretVoterIdDisplay'
import { useAuth } from '@/hooks/useAuth'
import { fetchUserRegistrations } from '@/services/voterRegistrationService'
import type { VoterRegistrationWithElection } from '@/types/voterRegistration'
import { electionDisplayStatus, userInitials } from '@/utils/dashboardDisplay'
import { isPollingOpen } from '@/utils/electionPolling'
import { formatTimeRemaining } from '@/utils/electionTime'
import { maskSecretVoterId } from '@/utils/maskSecretVoterId'
import { useWaitlistMessage } from '@/hooks/useWaitlistMessage'

export function VoterDashboardPage() {
  const { t } = useTranslation(['dashboard', 'common'])
  const formatWaitlist = useWaitlistMessage()
  const { profile, session } = useAuth()
  const [registrations, setRegistrations] = useState<VoterRegistrationWithElection[]>([])
  const [loading, setLoading] = useState(true)

  async function reloadRegistrations() {
    const userId = session?.user.id
    if (!userId) return
    try {
      const data = await fetchUserRegistrations(userId)
      setRegistrations(data)
    } catch {
      setRegistrations([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void reloadRegistrations()
  }, [session?.user.id])

  const registered = registrations.filter((r) => r.status === 'registered')
  const waitlisted = registrations.filter((r) => r.status === 'waitlisted')
  const votedCount = registered.filter((r) => r.voted_at).length
  const liveCount = registered.filter(
    (r) =>
      r.election &&
      !r.voted_at &&
      r.secret_voter_id &&
      isPollingOpen({
        start_date: r.election.start_date,
        end_date: r.election.end_date,
        status: r.election.status as 'published' | 'active',
        voter_roll_finalized_at: r.election.voter_roll_finalized_at ?? null,
      }),
  ).length

  const votedHistory = useMemo(
    () => registered.filter((r) => r.voted_at).slice(0, 6),
    [registered],
  )

  const displayName = profile?.full_name?.trim() || 'Voter'
  const primarySecret = registered.find((r) => r.secret_voter_id)?.secret_voter_id

  const topbarExtra = (
    <>
      <button type="button" className="vs-tb-btn" aria-label="Notifications">
        <svg viewBox="0 0 24 24" aria-hidden>
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        </svg>
        {liveCount > 0 ? <span className="vs-tb-notif">{liveCount}</span> : null}
      </button>
      <Link to="/" className="vs-tb-btn" aria-label="Profile">
        <svg viewBox="0 0 24 24" aria-hidden>
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </Link>
    </>
  )

  return (
    <VoteSecureDashboardShell
      role="voter"
      pageTitle="Home"
      pageCrumb={
        liveCount > 0
          ? `Your civic dashboard · ${liveCount} election${liveCount === 1 ? '' : 's'} live now`
          : 'Your civic dashboard'
      }
      electionCount={registered.length}
      liveVoteCount={liveCount}
      showSearch={false}
      topbarExtra={topbarExtra}
    >
      <div className="vs-voter-id">
        <div className="vs-voter-avatar-big">{userInitials(profile?.full_name, profile?.email)}</div>
        <div className="vs-voter-info">
          <div className="vs-voter-greeting">{t('dashboard:welcomeBack')}</div>
          <div className="vs-voter-name">{displayName}</div>
          <div className="vs-voter-chips">
            <div className="vs-voter-chip">Identity verified</div>
            <div className="vs-voter-chip">{registered.length} joined election(s)</div>
            {votedCount > 0 ? <div className="vs-voter-chip">{votedCount} vote(s) cast</div> : null}
            {waitlisted.length > 0 ? (
              <div className="vs-voter-chip">{waitlisted.length} on waitlist</div>
            ) : null}
          </div>
        </div>
        <div className="vs-voter-right">
          <div className="vs-voter-id-label">Secret voter ID</div>
          <div className="vs-voter-id-num">
            {primarySecret ? maskSecretVoterId(primarySecret) : 'Issued per election'}
          </div>
          <div className="vs-voter-verified">Eligible to vote</div>
        </div>
      </div>

      <div className="vs-stat-grid">
        <div className="vs-stat-card vs-stat-card--blue">
          <div className="vs-stat-icon vs-stat-icon--blue">
            <svg viewBox="0 0 24 24" aria-hidden>
              <rect x="3" y="4" width="18" height="18" rx="2" />
            </svg>
          </div>
          <div className="vs-stat-num">{registered.length}</div>
          <div className="vs-stat-label">{t('dashboard:joinedElections')}</div>
        </div>
        <div className="vs-stat-card vs-stat-card--green">
          <div className="vs-stat-icon vs-stat-icon--green">
            <svg viewBox="0 0 24 24" aria-hidden>
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div className="vs-stat-num">{votedCount}</div>
          <div className="vs-stat-label">Votes Cast</div>
        </div>
        <div className="vs-stat-card vs-stat-card--purple">
          <div className="vs-stat-icon vs-stat-icon--purple">
            <svg viewBox="0 0 24 24" aria-hidden>
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
            </svg>
          </div>
          <div className="vs-stat-num">{liveCount}</div>
          <div className="vs-stat-label">Open Ballots</div>
        </div>
        <div className="vs-stat-card vs-stat-card--cyan">
          <div className="vs-stat-icon vs-stat-icon--cyan">
            <svg viewBox="0 0 24 24" aria-hidden>
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <div className="vs-stat-num">100%</div>
          <div className="vs-stat-label">Vote Anonymity</div>
        </div>
      </div>

      <div className="vs-dash-grid">
        <div className="vs-panel">
          <div className="vs-panel-head">
            <div>
              <div className="vs-panel-title">My Elections</div>
              <div className="vs-panel-sub">Elections you are enrolled in</div>
            </div>
            <Link to="/#elections-catalog" className="vs-panel-action">
              Browse All
            </Link>
          </div>
          <div className="vs-panel-body">
            {loading ? (
              <p className="vs-empty">Loading your elections…</p>
            ) : registrations.length === 0 ? (
              <p className="vs-empty">
                You have not joined any elections yet.{' '}
                <Link to="/#elections-catalog">Browse the catalog</Link> to participate.
              </p>
            ) : (
              registrations.map((reg) => {
                if (!reg.election) return null
                if (reg.status === 'waitlisted') {
                  return (
                    <div key={reg.id} className="vs-election-card vs-election-card--upcoming">
                      <div className="vs-ec-top">
                        <div className="vs-ec-title">{reg.election.title}</div>
                        <span className="vs-ec-badge vs-ec-badge--upcoming">{t('dashboard:waitlistBadge')}</span>
                      </div>
                      <p className="vs-ec-meta" style={{ marginBottom: 12, fontWeight: 600 }}>
                        {formatWaitlist(reg.waitlist_position)}
                      </p>
                      <div className="vs-ec-footer">
                        <Link to={`/elections/${reg.election.id}`} className="vs-btn-voted">
                          {t('dashboard:viewElection')}
                        </Link>
                      </div>
                    </div>
                  )
                }
                const phase = electionDisplayStatus(
                  reg.election.status,
                  reg.election.start_date,
                  reg.election.end_date,
                )
                const canVote =
                  reg.status === 'registered' &&
                  Boolean(reg.secret_voter_id) &&
                  !reg.voted_at &&
                  isPollingOpen({
                    start_date: reg.election.start_date,
                    end_date: reg.election.end_date,
                    status: reg.election.status as 'published' | 'active',
                    voter_roll_finalized_at: reg.election.voter_roll_finalized_at ?? null,
                  })

                const cardClass =
                  reg.voted_at
                    ? 'vs-election-card vs-election-card--voted'
                    : phase === 'active'
                      ? 'vs-election-card vs-election-card--active'
                      : 'vs-election-card vs-election-card--upcoming'

                return (
                  <div key={reg.id} className={cardClass}>
                    <div className="vs-ec-top">
                      <div className="vs-ec-title">{reg.election.title}</div>
                      <span
                        className={`vs-ec-badge ${
                          reg.voted_at
                            ? 'vs-ec-badge--voted'
                            : phase === 'active'
                              ? 'vs-ec-badge--active'
                              : 'vs-ec-badge--upcoming'
                        }`}
                      >
                        {reg.voted_at ? '✓ Voted' : phase === 'active' ? 'Live' : phase}
                      </span>
                    </div>
                    <div className="vs-ec-meta">
                      <span>Joined {new Date(reg.created_at).toLocaleDateString()}</span>
                      {phase === 'active' && !reg.voted_at ? (
                        <span>Ends in {formatTimeRemaining(reg.election.end_date)}</span>
                      ) : null}
                    </div>
                    {reg.secret_voter_id ? (
                      <div style={{ marginBottom: 12 }}>
                        <SecretVoterIdDisplay
                          secretVoterId={reg.secret_voter_id}
                          electionId={reg.election_id}
                          pollPrefix={reg.election.secret_voter_id_prefix}
                          emailed={Boolean(reg.secret_voter_id_emailed_at)}
                          compact
                          onEmailed={() => void reloadRegistrations()}
                        />
                      </div>
                    ) : null}
                    <div className="vs-ec-footer">
                      {canVote ? (
                        <Link to={`/elections/${reg.election.id}/vote`} className="vs-btn-vote-now">
                          Cast My Vote →
                        </Link>
                      ) : reg.voted_at ? (
                        <Link
                          to={`/elections/${reg.election.id}/results`}
                          className="vs-btn-voted"
                        >
                          View Results
                        </Link>
                      ) : (
                        <Link to={`/elections/${reg.election.id}`} className="vs-btn-voted">
                          View Election
                        </Link>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        <div className="vs-dash-col">
          <div className="vs-panel">
            <div className="vs-panel-head">
              <div>
                <div className="vs-panel-title">Quick actions</div>
                <div className="vs-panel-sub">Stay ready for the next ballot</div>
              </div>
            </div>
            <div className="vs-panel-body">
              <div className="vs-notif-item">
                <div className="vs-notif-dot vs-notif-dot--blue" />
                <div>
                  <div className="vs-notif-text">
                    {liveCount > 0
                      ? `You have ${liveCount} live ballot(s). Cast your vote before polling closes.`
                      : 'No live ballots right now. Browse elections to join the next poll.'}
                  </div>
                </div>
              </div>
              {liveCount > 0 ? (
                <div className="vs-notif-item">
                  <div className="vs-notif-dot vs-notif-dot--green" />
                  <div>
                    <div className="vs-notif-text">
                      Use your <strong>Secret Voter ID</strong> on the ballot page — it is never shown in full
                      after email delivery.
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {votedHistory.length > 0 ? (
        <div className="vs-panel">
          <div className="vs-panel-head">
            <div>
              <div className="vs-panel-title">Voting History</div>
              <div className="vs-panel-sub">Your participation record</div>
            </div>
          </div>
          <div className="vs-panel-body">
            <div className="vs-history-grid">
              {votedHistory.map((reg) => (
                <div key={reg.id} className="vs-history-item">
                  <div className="vs-history-icon">
                    <svg viewBox="0 0 24 24" aria-hidden>
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <div>
                    <div className="vs-history-title">{reg.election?.title ?? 'Election'}</div>
                    <div className="vs-history-meta">
                      {reg.voted_at
                        ? new Date(reg.voted_at).toLocaleDateString()
                        : 'Completed'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </VoteSecureDashboardShell>
  )
}
