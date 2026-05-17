import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { VoterPageHeader } from '@/components/voter/VoterPageHeader'
import { useVoterDashboard } from '@/hooks/useVoterDashboard'
import { electionDisplayStatus } from '@/utils/dashboardDisplay'
import { formatElectionCode, formatTimeRemaining } from '@/utils/electionTime'
import { maskSecretVoterId } from '@/utils/maskSecretVoterId'
import { canVote, formatCountdown, getRegistrationPhase } from '@/utils/voterElectionUi'

type Tab = 'all' | 'active' | 'upcoming' | 'completed'

function CountdownRow({ endDate }: { endDate: string }) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])
  const { h, m, s } = formatCountdown(endDate, now)
  return (
    <div className="countdown">
      <div className="cd-unit">
        <div className="cd-num">{h}</div>
        <div className="cd-label">Hrs</div>
      </div>
      <div className="cd-unit">
        <div className="cd-num">{m}</div>
        <div className="cd-label">Min</div>
      </div>
      <div className="cd-unit">
        <div className="cd-num">{s}</div>
        <div className="cd-label">Sec</div>
      </div>
    </div>
  )
}

export function VoterMyElectionsPage() {
  const { registrations, registered, votedCount } = useVoterDashboard()
  const [tab, setTab] = useState<Tab>('all')

  const filtered = useMemo(() => {
    return registrations.filter((r) => {
      if (!r.election) return false
      const phase = electionDisplayStatus(r.election.status, r.election.start_date, r.election.end_date)
      if (tab === 'all') return true
      if (tab === 'active') return phase === 'active'
      if (tab === 'upcoming') return phase === 'upcoming'
      return phase === 'completed'
    })
  }, [registrations, tab])

  const upcomingVotes = useMemo(
    () =>
      registered.filter((r) => {
        if (!r.election || r.voted_at) return false
        return (
          electionDisplayStatus(r.election.status, r.election.start_date, r.election.end_date) !== 'completed'
        )
      }).length,
    [registered],
  )

  const resultsAvail = useMemo(
    () =>
      registered.filter((r) => r.election && Date.now() > new Date(r.election.end_date).getTime()).length,
    [registered],
  )

  const withElection = useMemo(() => registrations.filter((r) => r.election), [registrations])

  const tabs: { id: Tab; label: string }[] = [
    { id: 'all', label: `All (${withElection.length})` },
    {
      id: 'active',
      label: `Active (${withElection.filter((r) => electionDisplayStatus(r.election!.status, r.election!.start_date, r.election!.end_date) === 'active').length})`,
    },
    {
      id: 'upcoming',
      label: `Upcoming (${withElection.filter((r) => electionDisplayStatus(r.election!.status, r.election!.start_date, r.election!.end_date) === 'upcoming').length})`,
    },
    {
      id: 'completed',
      label: `Completed (${withElection.filter((r) => electionDisplayStatus(r.election!.status, r.election!.start_date, r.election!.end_date) === 'completed').length})`,
    },
  ]

  return (
    <>
      <VoterPageHeader
        eyebrow="Dashboard"
        title="My Elections"
        subtitle="All elections you have joined and their status"
      />

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-icon-row">
            <div className="stat-icon" style={{ background: '#EFF4FF', color: '#2451A3' }}>
              <svg viewBox="0 0 24 24" aria-hidden>
                <circle cx="12" cy="12" r="10" />
              </svg>
            </div>
          </div>
          <div className="stat-num">{registered.length}</div>
          <div className="stat-label">Joined Elections</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-row">
            <div className="stat-icon" style={{ background: '#DCFCE7', color: '#16A34A' }}>
              <svg viewBox="0 0 24 24" aria-hidden>
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            </div>
          </div>
          <div className="stat-num">{votedCount}</div>
          <div className="stat-label">Votes Cast</div>
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
          <div className="stat-num">{upcomingVotes}</div>
          <div className="stat-label">Upcoming Votes</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-row">
            <div className="stat-icon" style={{ background: '#F5F3FF', color: '#6C3FC5' }}>
              <svg viewBox="0 0 24 24" aria-hidden>
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
            </div>
          </div>
          <div className="stat-num">{resultsAvail}</div>
          <div className="stat-label">Results Available</div>
        </div>
      </div>

      <div className="tabs">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`tab-btn${tab === t.id ? ' active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {filtered.length === 0 ? (
          <div className="card-elevated">
            <div className="card-body">
              <p style={{ fontSize: 13, color: 'var(--subtle)' }}>No elections in this tab.</p>
            </div>
          </div>
        ) : (
          filtered.map((reg) => {
            if (!reg.election) return null
            const phase = electionDisplayStatus(reg.election.status, reg.election.start_date, reg.election.end_date)
            const voting = canVote(reg)
            const border =
              phase === 'completed' ? '#6C3FC5' : voting ? '#EF4444' : reg.voted_at ? '#10B981' : 'var(--border)'
            const opacity = phase === 'completed' ? 0.85 : 1

            return (
              <div key={reg.id} className="card-elevated" style={{ borderLeft: `4px solid ${border}`, opacity }}>
                <div className="card-body">
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 14,
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 220 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                        <span
                          className={`badge ${phase === 'active' ? 'b-active' : phase === 'upcoming' ? 'b-upcoming' : 'b-completed'}`}
                        >
                          {phase === 'active' ? (
                            <>
                              <span className="b-dot" />
                              Active
                            </>
                          ) : (
                            phase
                          )}
                        </span>
                        {reg.voted_at ? (
                          <span className="badge b-voted">✓ Voted</span>
                        ) : voting ? (
                          <span className="badge" style={{ background: '#FEE2E2', color: '#B91C1C', fontSize: 9 }}>
                            ⚠ YOU HAVEN&apos;T VOTED
                          </span>
                        ) : null}
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{reg.election.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--subtle)', marginBottom: 12 }}>
                        {formatElectionCode(reg.election.id)}
                        {phase === 'active' && !reg.voted_at
                          ? ` · Ends in ${formatTimeRemaining(reg.election.end_date)}`
                          : null}
                      </div>
                      {phase === 'active' && !reg.voted_at ? <CountdownRow endDate={reg.election.end_date} /> : null}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      {reg.secret_voter_id ? (
                        <>
                          <div style={{ fontSize: 10, color: 'var(--subtle)', fontWeight: 700, marginBottom: 6 }}>
                            YOUR SECRET ID
                          </div>
                          <div className="sid-box" style={{ fontSize: 12, marginBottom: 12 }}>
                            <svg viewBox="0 0 24 24" aria-hidden>
                              <rect x="3" y="11" width="18" height="11" rx="2" />
                              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                            {maskSecretVoterId(reg.secret_voter_id)}
                          </div>
                        </>
                      ) : (
                        <div style={{ fontSize: 11, color: 'var(--subtle)', marginBottom: 12 }}>
                          Phase: {getRegistrationPhase(reg)}
                        </div>
                      )}
                      {voting ? (
                        <Link to={`/voter/vote/${reg.election.id}`} className="btn btn-success">
                          <svg viewBox="0 0 24 24" aria-hidden>
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                            <path d="M9 12l2 2 4-4" />
                          </svg>
                          Vote Now
                        </Link>
                      ) : (
                        <Link to={`/voter/results/${reg.election.id}`} className="btn btn-ghost btn-sm">
                          View Results
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </>
  )
}
