import { Link } from 'react-router-dom'
import { VoterPageHeader } from '@/components/voter/VoterPageHeader'
import { useAuth } from '@/hooks/useAuth'
import { useVoterDashboard } from '@/hooks/useVoterDashboard'
import { userInitials } from '@/utils/dashboardDisplay'
import { formatElectionCode } from '@/utils/electionTime'
import { maskSecretVoterId } from '@/utils/maskSecretVoterId'

export function VoterProfilePage() {
  const { profile } = useAuth()
  const { registered, votedCount } = useVoterDashboard()

  const primarySecret = registered.find((r) => r.secret_voter_id)?.secret_voter_id
  const participation =
    registered.length > 0 ? Math.round((votedCount / registered.length) * 1000) / 10 : 100

  const history = registered.filter((r) => r.voted_at && r.election)

  return (
    <>
      <VoterPageHeader eyebrow="Account" title="My Profile" subtitle="Manage your voter account and history" />

      <div className="grid-2">
        <div className="card-elevated">
          <div className="card-body" style={{ textAlign: 'center', padding: 28 }}>
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: 18,
                background: 'linear-gradient(135deg,#10B981,#059669)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 26,
                fontWeight: 800,
                color: '#fff',
                margin: '0 auto 14px',
              }}
            >
              {userInitials(profile?.full_name, profile?.email)}
            </div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>{profile?.full_name?.trim() || 'Voter'}</div>
            <div style={{ fontSize: 12, color: 'var(--subtle)', marginTop: 3 }}>{profile?.email}</div>
            <div style={{ marginTop: 10, display: 'flex', justifyContent: 'center', gap: 8 }}>
              <span className="badge b-active">Verified Voter</span>
            </div>
            <div className="sid-box" style={{ margin: '14px auto 0', display: 'inline-flex' }}>
              <svg viewBox="0 0 24 24" aria-hidden>
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              {primarySecret ? maskSecretVoterId(primarySecret) : 'Issued per election'}
            </div>
            <div
              style={{
                marginTop: 16,
                display: 'flex',
                gap: 20,
                justifyContent: 'center',
                textAlign: 'center',
                paddingTop: 14,
                borderTop: '1px solid var(--border)',
              }}
            >
              <div>
                <div style={{ fontSize: 20, fontWeight: 800 }}>{registered.length}</div>
                <div style={{ fontSize: 11, color: 'var(--subtle)' }}>Elections</div>
              </div>
              <div style={{ width: 1, background: 'var(--border)' }} />
              <div>
                <div style={{ fontSize: 20, fontWeight: 800 }}>{votedCount}</div>
                <div style={{ fontSize: 11, color: 'var(--subtle)' }}>Votes Cast</div>
              </div>
              <div style={{ width: 1, background: 'var(--border)' }} />
              <div>
                <div style={{ fontSize: 20, fontWeight: 800 }}>{participation}%</div>
                <div style={{ fontSize: 11, color: 'var(--subtle)' }}>Participation</div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="card-elevated">
            <div className="card-header">
              <div className="card-title">Security</div>
            </div>
            <div className="card-body">
              <p style={{ fontSize: 12, color: 'var(--subtle)', marginBottom: 12, lineHeight: 1.6 }}>
                Update your password and manage multi-factor authentication from account security.
              </p>
              <Link to="/account/security" className="btn btn-success btn-sm">
                Open Account Security
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="card-elevated" style={{ marginTop: 16 }}>
        <div className="card-header">
          <div className="card-title">Voting History</div>
        </div>
        <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
          <table>
            <thead>
              <tr>
                <th>Election</th>
                <th>Voted On</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan={3} className="muted">
                    No votes recorded yet.
                  </td>
                </tr>
              ) : (
                history.map((reg) => (
                  <tr key={reg.id}>
                    <td style={{ fontSize: 12, fontWeight: 600 }}>
                      {reg.election?.title} {reg.election ? formatElectionCode(reg.election.id) : ''}
                    </td>
                    <td className="muted">{reg.voted_at ? new Date(reg.voted_at).toLocaleString() : '—'}</td>
                    <td>
                      <span className="badge b-voted">✓ Recorded</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
