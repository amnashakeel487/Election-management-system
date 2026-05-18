import { Link } from 'react-router-dom'
import { VoterPageHeader } from '@/components/voter/VoterPageHeader'
import { useVoterDashboard } from '@/hooks/useVoterDashboard'
import {
  areElectionResultsVisible,
  voterResultsActionLabel,
  voterResultsUnavailableMessage,
} from '@/utils/electionResultsVisibility'
import { electionDisplayStatus } from '@/utils/dashboardDisplay'
import { formatElectionCode } from '@/utils/electionTime'

export function VoterResultsIndexPage() {
  const { registrations } = useVoterDashboard()
  const rows = registrations.filter((r) => r.election)

  return (
    <>
      <VoterPageHeader eyebrow="Analytics" title="Election Results" subtitle="Open results for elections you joined" />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {rows.length === 0 ? (
          <div className="card-elevated">
            <div className="card-body">
              <p style={{ fontSize: 13, color: 'var(--subtle)' }}>
                No elections yet. <Link to="/browse-elections">Browse elections</Link>.
              </p>
            </div>
          </div>
        ) : (
          rows.map((reg) => {
            if (!reg.election) return null
            const election = reg.election
            const phase = electionDisplayStatus(election.status, election.start_date, election.end_date)
            const resultsVisible = areElectionResultsVisible(election)
            const blockedMessage = voterResultsUnavailableMessage(election)

            return (
              <div key={reg.id} className="card-elevated">
                <div
                  className="card-body"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 12,
                    flexWrap: 'wrap',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{election.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--subtle)', marginTop: 4 }}>
                      {formatElectionCode(election.id)} · {phase}
                      {reg.voted_at ? ' · You voted' : ''}
                      {!resultsVisible && election.real_time_results !== true ? ' · Live results off' : ''}
                    </div>
                    {!resultsVisible && blockedMessage ? (
                      <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 8, maxWidth: 420, lineHeight: 1.45 }}>
                        {blockedMessage}
                      </p>
                    ) : null}
                  </div>
                  {resultsVisible ? (
                    <Link to={`/voter/results/${election.id}`} className="btn btn-primary btn-sm">
                      {voterResultsActionLabel(election)}
                    </Link>
                  ) : (
                    <span className="btn btn-primary btn-sm" style={{ opacity: 0.45, cursor: 'not-allowed' }} aria-disabled>
                      {voterResultsActionLabel(election)}
                    </span>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </>
  )
}
