import { useCallback, useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { CreatorPageHeader } from '@/components/creator/layout/CreatorPageHeader'
import { CREATOR_PAGE_META } from '@/config/creatorNav'
import { ElectionQrInvitePanel } from '@/components/election/ElectionQrInvitePanel'
import { VoterRollLockPanel } from '@/components/election/VoterRollLockPanel'
import { ElectionWaitlistPanel } from '@/components/waitlist/ElectionWaitlistPanel'
import { useAuth } from '@/hooks/useAuth'
import { fetchElectionById } from '@/services/electionService'
import { fetchElectionRegistrationStats } from '@/services/voterRegistrationService'
import { finalizeAndEmailSecretVoterIds } from '@/services/secretVoterIdService'
import type { ElectionWithCandidates } from '@/types/election'
import type { ElectionRegistrationStats } from '@/types/voterRegistration'
import { electionDisplayStatus, statusBadgeClass } from '@/utils/dashboardDisplay'
import { formatElectionCode, formatTimeRemaining } from '@/utils/electionTime'
import { getElectionJoinUrl } from '@/utils/electionInvite'
import { formatSubmissionDate } from '@/utils/formatDate'

export function CreatorElectionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { profile } = useAuth()
  const [election, setElection] = useState<ElectionWithCandidates | null>(null)
  const [stats, setStats] = useState<ElectionRegistrationStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [finalizingId, setFinalizingId] = useState<string | null>(null)
  const [finalizeMessage, setFinalizeMessage] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const data = await fetchElectionById(id)
      if (!data) {
        setError('Election not found')
        setElection(null)
        return
      }
      if (data.creator_id !== profile?.id && profile?.role !== 'admin') {
        setError('You do not have access to this election')
        setElection(null)
        return
      }
      setElection(data)
      if (data.status !== 'draft') {
        setStats(await fetchElectionRegistrationStats(id))
      } else {
        setStats(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load election')
    } finally {
      setLoading(false)
    }
  }, [id, profile?.id, profile?.role])

  useEffect(() => {
    void load()
  }, [load])

  async function handleFinalize() {
    if (!election) return
    setFinalizingId(election.id)
    setFinalizeMessage(null)
    try {
      const { finalize, email } = await finalizeAndEmailSecretVoterIds(election.id)
      setFinalizeMessage(`Assigned ${finalize.assigned_count} ID(s). Emailed ${email.sent} voter(s).`)
      await load()
    } catch (err) {
      setFinalizeMessage(err instanceof Error ? err.message : 'Finalization failed')
    } finally {
      setFinalizingId(null)
    }
  }

  if (!id) {
    return <Navigate to="/creator/dashboard" replace />
  }

  const phase = election
    ? electionDisplayStatus(election.status, election.start_date, election.end_date)
    : null
  const showInvite = election && election.status !== 'draft'
  const showRoll =
    election &&
    (election.status === 'published' || election.status === 'active' || election.voter_roll_finalized_at)

  const detailMeta = CREATOR_PAGE_META['election-detail']

  return (
    <>
      <CreatorPageHeader
        title={election?.title ?? detailMeta.title}
        subtitle={
          election
            ? `${formatElectionCode(election.id)} · ${phase ?? election.status}`
            : detailMeta.topSub
        }
        actions={
          <Link to="/creator/elections" className="btn btn-sm btn-ghost">
            All elections
          </Link>
        }
      />
      {loading ? (
        <p className="vs-empty">Loading election details…</p>
      ) : error ? (
        <div className="vs-panel">
          <div className="vs-panel-body">
            <p style={{ color: 'var(--vs-danger, #dc2626)' }}>{error}</p>
            <Link to="/creator/dashboard" className="vs-panel-action" style={{ display: 'inline-block', marginTop: 12 }}>
              Return to dashboard
            </Link>
          </div>
        </div>
      ) : election ? (
        <div className="space-y-6" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="vs-panel">
            <div className="vs-panel-head">
              <div>
                <div className="vs-panel-title">{election.title}</div>
                <div className="vs-panel-sub">{election.description?.trim() || 'No description'}</div>
              </div>
              {phase ? (
                <span className={`vs-t-badge ${statusBadgeClass(phase)}`}>{phase}</span>
              ) : null}
            </div>
            <div className="vs-panel-body">
              <div className="vs-quick-strip">
                <div className="vs-quick-stat">
                  <div className="vs-quick-num">{formatSubmissionDate(election.start_date)}</div>
                  <div className="vs-quick-lbl">Voting starts</div>
                </div>
                <div className="vs-quick-stat">
                  <div className="vs-quick-num">{formatTimeRemaining(election.end_date)}</div>
                  <div className="vs-quick-lbl">Time left</div>
                </div>
                {stats ? (
                  <div className="vs-quick-stat">
                    <div className="vs-quick-num">{stats.registered_count}</div>
                    <div className="vs-quick-lbl">Registered</div>
                  </div>
                ) : null}
              </div>
              <div className="vs-t-actions" style={{ marginTop: 16, flexWrap: 'wrap' }}>
                {election.status === 'draft' ? (
                  <Link to={`/creator/elections/${election.id}/edit`} className="vs-t-btn vs-t-btn--primary">
                    Continue wizard
                  </Link>
                ) : null}
                <Link to={`/elections/${election.id}`} className="vs-t-btn" target="_blank" rel="noreferrer">
                  Public page
                </Link>
                {election.status !== 'draft' ? (
                  <Link to={`/elections/${election.id}/results`} className="vs-t-btn">
                    Results
                  </Link>
                ) : null}
                {showInvite ? (
                  <a href={getElectionJoinUrl(election.id)} className="vs-t-btn" target="_blank" rel="noreferrer">
                    Open join link
                  </a>
                ) : null}
              </div>
              {finalizeMessage ? (
                <p style={{ marginTop: 12, fontSize: 12, color: 'var(--vs-muted)' }}>{finalizeMessage}</p>
              ) : null}
            </div>
          </div>

          {showInvite ? (
            <ElectionQrInvitePanel electionId={election.id} electionTitle={election.title} />
          ) : (
            <div className="vs-panel">
              <div className="vs-panel-body">
                <p style={{ fontSize: 13, color: 'var(--vs-muted)' }}>
                  Publish this election to generate an invite link and QR code for voters.
                </p>
                <Link
                  to={`/creator/elections/${election.id}/edit`}
                  className="vs-panel-action"
                  style={{ display: 'inline-block', marginTop: 12 }}
                >
                  Open creation wizard
                </Link>
              </div>
            </div>
          )}

          {showRoll ? (
            <>
              <ElectionWaitlistPanel
                electionId={election.id}
                voterRollFinalized={election.voter_roll_finalized_at}
                onChanged={() => void load()}
              />
              <VoterRollLockPanel
                election={election}
                finalizingId={finalizingId}
                onFinalize={() => void handleFinalize()}
                onChanged={() => void load()}
              />
            </>
          ) : null}
        </div>
      ) : null}
    </>
  )
}
