import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { fetchElectionById } from '@/services/electionService'
import type { ElectionWithCandidates } from '@/types/election'
import { electionDisplayStatus } from '@/utils/dashboardDisplay'
import { formatElectionCode } from '@/utils/electionTime'
import { formatCountdown } from '@/utils/voterElectionUi'

function HeroCountdown({ endDate }: { endDate: string }) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])
  const { h, m, s } = formatCountdown(endDate, now)
  return (
    <div className="countdown">
      <div className="cd-unit" style={{ background: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.15)' }}>
        <div className="cd-num" style={{ color: '#fff' }}>
          {h}
        </div>
        <div className="cd-label" style={{ color: 'rgba(255,255,255,0.5)' }}>
          Hrs
        </div>
      </div>
      <div className="cd-unit" style={{ background: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.15)' }}>
        <div className="cd-num" style={{ color: '#fff' }}>
          {m}
        </div>
        <div className="cd-label" style={{ color: 'rgba(255,255,255,0.5)' }}>
          Min
        </div>
      </div>
      <div className="cd-unit" style={{ background: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.15)' }}>
        <div className="cd-num" style={{ color: '#fff' }}>
          {s}
        </div>
        <div className="cd-label" style={{ color: 'rgba(255,255,255,0.5)' }}>
          Sec
        </div>
      </div>
    </div>
  )
}

export function VoterElectionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [election, setElection] = useState<ElectionWithCandidates | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    setLoading(true)
    void fetchElectionById(id)
      .then((data) => {
        if (!cancelled) {
          setElection(data)
          setError(data ? null : 'Election not found.')
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id])

  if (loading) {
    return (
      <div className="card-elevated">
        <div className="card-body">Loading election…</div>
      </div>
    )
  }

  if (error || !election || !id) {
    return (
      <div className="card-elevated">
        <div className="card-body">
          <p>{error ?? 'Not found.'}</p>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => navigate('/voter/elections')}>
            ← Back
          </button>
        </div>
      </div>
    )
  }

  const phase = electionDisplayStatus(election.status, election.start_date, election.end_date)
  const accentColors = ['#1B3A6B', '#6C3FC5', '#06B6D4', '#10B981', '#2451A3']

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>
          ← Back
        </button>
      </div>

      <div className="hero-banner" style={{ marginBottom: 20 }}>
        <div className="hero-banner-content">
          <span className="badge b-active" style={{ marginBottom: 10 }}>
            {phase === 'active' ? (
              <>
                <span className="b-dot" />
                Active
              </>
            ) : (
              phase
            )}
          </span>
          <div style={{ fontSize: 'clamp(16px, 2.5vw, 24px)', fontWeight: 800, color: '#fff', marginBottom: 8, lineHeight: 1.3 }}>
            {election.title}
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginBottom: 16 }}>{election.description ?? ''}</div>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>🏛 {election.candidates?.length ?? 0} candidates</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{formatElectionCode(election.id)}</div>
          </div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Time Remaining
          </div>
          <HeroCountdown endDate={election.end_date} />
        </div>
      </div>

      <div className="grid-7-3">
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Candidates</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 14 }}>
            {(election.candidates ?? []).map((c, idx) => (
              <div key={c.id} className="card" style={{ padding: 16, borderTop: `4px solid ${accentColors[idx % accentColors.length]}` }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{c.name}</div>
                <div style={{ fontSize: 10, color: 'var(--subtle)', marginTop: 2 }}>{c.designation ?? 'Candidate'}</div>
                {c.description ? (
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 8, lineHeight: 1.5 }}>{c.description}</div>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="card-elevated">
            <div className="card-header">
              <div className="card-title">Join This Election</div>
            </div>
            <div className="card-body">
              <div style={{ fontSize: 12, color: 'var(--subtle)', marginBottom: 14, lineHeight: 1.6 }}>
                Register to participate. You will receive a secret voter ID after the organizer finalizes the roll.
              </div>
              <Link to={`/elections/${id}/join`} className="btn btn-success" style={{ width: '100%', justifyContent: 'center' }}>
                <svg viewBox="0 0 24 24" aria-hidden>
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                I Want to Participate
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
