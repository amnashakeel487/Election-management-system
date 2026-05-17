import { Link } from 'react-router-dom'
import { VoterPageHeader } from '@/components/voter/VoterPageHeader'
import { useVoterDashboard } from '@/hooks/useVoterDashboard'
import { electionDisplayStatus } from '@/utils/dashboardDisplay'
import { formatElectionCode } from '@/utils/electionTime'
import { maskSecretVoterId } from '@/utils/maskSecretVoterId'
import { canVote } from '@/utils/voterElectionUi'

export function VoterJoinedPollsPage() {
  const { registrations } = useVoterDashboard()

  return (
    <>
      <VoterPageHeader
        eyebrow="My Polls"
        title="Joined Polls"
        subtitle="All elections you have registered to participate in"
      />

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Election</th>
              <th>Status</th>
              <th>Joined On</th>
              <th>Voting Status</th>
              <th>Secret ID</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {registrations.length === 0 ? (
              <tr>
                <td colSpan={6} className="muted">
                  No registrations yet.{' '}
                  <Link to="/browse-elections">Browse elections</Link>.
                </td>
              </tr>
            ) : (
              registrations.map((reg) => {
                if (!reg.election) return null
                const phase = electionDisplayStatus(reg.election.status, reg.election.start_date, reg.election.end_date)
                const voting = canVote(reg)
                return (
                  <tr key={reg.id}>
                    <td>
                      <div style={{ fontSize: 12, fontWeight: 700, maxWidth: 220 }}>{reg.election.title}</div>
                      <div style={{ fontSize: 10, color: 'var(--subtle)' }}>
                        {formatElectionCode(reg.election.id)} · Ends {new Date(reg.election.end_date).toLocaleDateString()}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${phase === 'active' ? 'b-active' : phase === 'upcoming' ? 'b-upcoming' : 'b-completed'}`}>
                        {phase === 'active' ? (
                          <>
                            <span className="b-dot" />
                            Active
                          </>
                        ) : (
                          phase
                        )}
                      </span>
                    </td>
                    <td className="muted">{new Date(reg.created_at).toLocaleDateString()}</td>
                    <td>
                      {reg.voted_at ? (
                        <span className="badge b-voted">✓ Voted</span>
                      ) : (
                        <span className="badge" style={{ background: '#FEE2E2', color: '#B91C1C' }}>
                          ⚠ Not Voted
                        </span>
                      )}
                    </td>
                    <td>
                      {reg.secret_voter_id ? (
                        <div className="sid-box" style={{ fontSize: 10, padding: '4px 10px', letterSpacing: 2 }}>
                          <svg viewBox="0 0 24 24" aria-hidden>
                            <rect x="3" y="11" width="18" height="11" rx="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                          </svg>
                          {maskSecretVoterId(reg.secret_voter_id)}
                        </div>
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </td>
                    <td>
                      <div className="td-actions">
                        {voting ? (
                          <Link to={`/voter/vote/${reg.election.id}`} className="btn btn-success btn-xs">
                            Vote
                          </Link>
                        ) : null}
                        <Link to={`/voter/elections/${reg.election.id}`} className="btn btn-ghost btn-xs">
                          Details
                        </Link>
                        <Link to={`/voter/results/${reg.election.id}`} className="btn btn-ghost btn-xs">
                          Results
                        </Link>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}
