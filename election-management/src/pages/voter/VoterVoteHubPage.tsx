import { Link } from 'react-router-dom'
import { VoterPageHeader } from '@/components/voter/VoterPageHeader'
import { useVoterDashboard } from '@/hooks/useVoterDashboard'
import { electionDisplayStatus } from '@/utils/dashboardDisplay'
import { formatElectionCode, formatTimeRemaining } from '@/utils/electionTime'
import { canVote, shouldShowVotingPreparing, votingPreparingMessage } from '@/utils/voterElectionUi'

export function VoterVoteHubPage() {
  const { registered } = useVoterDashboard()
  const voteables = registered.filter((r) => canVote(r) && r.election)
  const preparing = registered.filter((r) => shouldShowVotingPreparing(r))

  return (
    <>
      <VoterPageHeader eyebrow="Secure Voting" title="Vote Hub" subtitle="Elections where you can cast a ballot now" />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {preparing.map((reg) => {
          if (!reg.election) return null
          return (
            <div key={reg.id} className="card-elevated">
              <div className="card-body">
                <div style={{ fontSize: 15, fontWeight: 700 }}>{reg.election.title}</div>
                <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8, lineHeight: 1.5 }}>
                  {votingPreparingMessage()}
                </p>
              </div>
            </div>
          )
        })}
        {voteables.length === 0 && preparing.length === 0 ? (
          <div className="card-elevated">
            <div className="card-body">
              <p style={{ fontSize: 13, color: 'var(--subtle)', marginBottom: 12 }}>
                No open ballots right now. When polling opens for your elections, they appear here.
              </p>
              <Link to="/browse-elections" className="btn btn-primary btn-sm">
                Browse elections
              </Link>
            </div>
          </div>
        ) : (
          voteables.map((reg) => {
            if (!reg.election) return null
            const phase = electionDisplayStatus(reg.election.status, reg.election.start_date, reg.election.end_date)
            return (
              <div key={reg.id} className="card-elevated">
                <div
                  className="card-body"
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}
                >
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>{reg.election.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--subtle)', marginTop: 4 }}>
                      {formatElectionCode(reg.election.id)} · {phase} · Ends in{' '}
                      {formatTimeRemaining(reg.election.end_date)}
                    </div>
                  </div>
                  <Link to={`/voter/vote/${reg.election.id}`} className="btn btn-success">
                    <svg viewBox="0 0 24 24" aria-hidden>
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <path d="M9 12l2 2 4-4" />
                    </svg>
                    Cast vote
                  </Link>
                </div>
              </div>
            )
          })
        )}
      </div>
    </>
  )
}
