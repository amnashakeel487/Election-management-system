import { Link, useSearchParams } from 'react-router-dom'

export function VoterVoteSuccessPage() {
  const [params] = useSearchParams()
  const electionId = params.get('electionId') ?? ''
  const receipt = params.get('receipt') ?? ''

  const shortReceipt =
    receipt.length > 18 ? `${receipt.slice(0, 12)}…${receipt.slice(-8)}` : receipt || '—'

  return (
    <div className="success-scene">
      <div className="success-icon-wrap">
        <svg viewBox="0 0 24 24" aria-hidden>
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>Vote Recorded! 🎉</div>
      <div style={{ fontSize: 14, color: 'var(--subtle)', lineHeight: 1.7, maxWidth: 440, marginBottom: 24 }}>
        Your vote has been anonymously encrypted and permanently recorded. Thank you for participating in democracy.
      </div>
      <div style={{ background: '#0F2347', border: '1px solid rgba(6,182,212,0.25)', borderRadius: 12, padding: '14px 20px', marginBottom: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 5 }}>
          Receipt / Transaction Hash
        </div>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, color: 'var(--cyan)', letterSpacing: 1 }}>{shortReceipt}</div>
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
        {electionId ? (
          <Link to={`/voter/results/${electionId}`} className="btn btn-primary">
            View Live Results →
          </Link>
        ) : (
          <Link to="/voter/results" className="btn btn-primary">
            View Results →
          </Link>
        )}
        <Link to="/voter/dashboard" className="btn btn-ghost">
          Back to Dashboard
        </Link>
      </div>
    </div>
  )
}
