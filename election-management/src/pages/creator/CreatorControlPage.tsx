import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CreatorElectionPicker } from '@/components/creator/CreatorElectionPicker'
import { CreatorPageHeader } from '@/components/creator/layout/CreatorPageHeader'
import { CREATOR_PAGE_META } from '@/config/creatorNav'
import { useCreatorElection } from '@/context/CreatorElectionContext'
import { creatorPhaseBadge } from '@/utils/creatorDisplay'
import { formatSubmissionDate } from '@/utils/formatDate'
import { formatTimeRemaining } from '@/utils/electionTime'

const meta = CREATOR_PAGE_META.control

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function useCountdown(endIso: string | null | undefined) {
  const [parts, setParts] = useState({ d: 0, h: 0, m: 0, s: 0 })

  useEffect(() => {
    if (!endIso) return
    const tick = () => {
      const diff = new Date(endIso).getTime() - Date.now()
      if (diff <= 0) {
        setParts({ d: 0, h: 0, m: 0, s: 0 })
        return
      }
      const d = Math.floor(diff / 86400000)
      const h = Math.floor((diff % 86400000) / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setParts({ d, h, m, s })
    }
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [endIso])

  return parts
}

export function CreatorControlPage() {
  const { selectedElection } = useCreatorElection()
  const badge = selectedElection ? creatorPhaseBadge(selectedElection) : null
  const countdown = useCountdown(selectedElection?.end_date)

  return (
    <>
      <CreatorPageHeader eyebrow={meta.eyebrow} title={meta.title} subtitle={meta.subtitle} />
      <CreatorElectionPicker className="mb-4" />

      {!selectedElection ? (
        <p style={{ fontSize: 13, color: 'var(--subtle)' }}>Select an election to view voting controls.</p>
      ) : (
        <div className="control-panel">
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 11, opacity: 0.7, textTransform: 'uppercase', letterSpacing: 1 }}>Active election</div>
                <div style={{ fontSize: 18, fontWeight: 800 }}>{selectedElection.title}</div>
              </div>
              {badge ? (
                <span className="badge b-live">
                  <span className="b-dot" /> {badge.label}
                </span>
              ) : null}
            </div>

            <div className="control-timer">
              {pad(countdown.d)}:{pad(countdown.h)}:{pad(countdown.m)}:{pad(countdown.s)}
            </div>
            <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 16 }}>
              {formatTimeRemaining(selectedElection.end_date)} until polls close · ends{' '}
              {formatSubmissionDate(selectedElection.end_date)}
            </div>

            <div className="timer-units">
              {[
                { n: countdown.d, l: 'Days' },
                { n: countdown.h, l: 'Hours' },
                { n: countdown.m, l: 'Min' },
                { n: countdown.s, l: 'Sec' },
              ].map((u) => (
                <div key={u.l} className="timer-unit">
                  <div className="timer-num">{pad(u.n)}</div>
                  <div className="timer-label">{u.l}</div>
                </div>
              ))}
            </div>

            <div className="control-btns">
              <Link to={`/creator/elections/${selectedElection.id}`} className="ctrl-btn ctrl-start">
                Manage election
              </Link>
              <Link to="/creator/participants" className="ctrl-btn ctrl-lock">
                Participants
              </Link>
              <Link to={`/elections/${selectedElection.id}/results`} className="ctrl-btn ctrl-restart" target="_blank" rel="noreferrer">
                Public results
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="grid-2" style={{ marginTop: 20 }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">Registration</div>
          </div>
          <div className="card-body" style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>
            <p>
              Roll status:{' '}
              <strong>{selectedElection?.voter_roll_finalized_at ? 'Finalized' : 'Open'}</strong>
            </p>
            <p style={{ marginTop: 8 }}>
              Finalize the voter roll before polling opens to email secret IDs and lock registration.
            </p>
            {selectedElection && !selectedElection.voter_roll_finalized_at ? (
              <Link to="/creator/secret-ids" className="btn btn-sm btn-cyan" style={{ marginTop: 12 }}>
                Secret ID management
              </Link>
            ) : null}
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <div className="card-title">Ballot security</div>
          </div>
          <div className="card-body" style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>
            <p>Anonymous ballots are stored without linking voter identity to choices.</p>
            <p style={{ marginTop: 8 }}>Real-time results: {selectedElection?.real_time_results ? 'Enabled' : 'Disabled'}</p>
          </div>
        </div>
      </div>
    </>
  )
}
