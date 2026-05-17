import { Link } from 'react-router-dom'
import { VoterPageHeader } from '@/components/voter/VoterPageHeader'
import { useVoterDashboard } from '@/hooks/useVoterDashboard'
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
            const phase = electionDisplayStatus(reg.election.status, reg.election.start_date, reg.election.end_date)
            return (
              <div key={reg.id} className="card-elevated">
                <div className="card-body" style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{reg.election.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--subtle)', marginTop: 4 }}>
                      {formatElectionCode(reg.election.id)} · {phase}
                      {reg.voted_at ? ' · You voted' : ''}
                    </div>
                  </div>
                  <Link to={`/voter/results/${reg.election.id}`} className="btn btn-primary btn-sm">
                    View results
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
