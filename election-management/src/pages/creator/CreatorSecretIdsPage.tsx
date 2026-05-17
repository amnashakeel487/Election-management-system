import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CreatorElectionPicker } from '@/components/creator/CreatorElectionPicker'
import { CreatorPageHeader } from '@/components/creator/layout/CreatorPageHeader'
import { CREATOR_PAGE_META } from '@/config/creatorNav'
import { useCreatorElection } from '@/context/CreatorElectionContext'
import { fetchElectionRegistrationStats } from '@/services/voterRegistrationService'
import { finalizeAndEmailSecretVoterIds } from '@/services/secretVoterIdService'
import { DEFAULT_SECRET_VOTER_ID_PREFIX, exampleSecretVoterIds } from '@/utils/secretVoterId'

const meta = CREATOR_PAGE_META.secretIds

export function CreatorSecretIdsPage() {
  const { selectedElection, refreshElections } = useCreatorElection()
  const [finalizing, setFinalizing] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function handleFinalize() {
    if (!selectedElection) return
    const regStats = await fetchElectionRegistrationStats(selectedElection.id)
    const confirmMsg =
      regStats.registered_count === 0
        ? `No voters registered yet. Finalizing will close registration permanently. Continue?`
        : `Finalize and email secret IDs to ${regStats.registered_count} voter(s)? This cannot be undone.`
    if (!window.confirm(confirmMsg)) return

    setFinalizing(true)
    setMessage(null)
    try {
      const { finalize, email } = await finalizeAndEmailSecretVoterIds(selectedElection.id)
      setMessage(`Assigned ${finalize.assigned_count} ID(s). Emailed ${email.sent} voter(s).`)
      await refreshElections()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Finalization failed')
    } finally {
      setFinalizing(false)
    }
  }

  const prefix = selectedElection?.secret_voter_id_prefix?.trim() || DEFAULT_SECRET_VOTER_ID_PREFIX
  const examples = exampleSecretVoterIds(prefix)

  return (
    <>
      <CreatorPageHeader eyebrow={meta.eyebrow} title={meta.title} subtitle={meta.subtitle} />
      <CreatorElectionPicker className="mb-4" />

      {message ? <div className="alert-banner alert-banner--success">{message}</div> : null}

      {!selectedElection ? (
        <p style={{ fontSize: 13, color: 'var(--subtle)' }}>Select an election.</p>
      ) : (
        <div className="grid-2">
          <div className="card-elevated">
            <div className="card-header">
              <div className="card-title">Voter roll</div>
            </div>
            <div className="card-body">
              <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 14 }}>
                Status:{' '}
                <strong>{selectedElection.voter_roll_finalized_at ? 'Finalized' : 'Open for registration'}</strong>
              </p>
              {!selectedElection.voter_roll_finalized_at ? (
                <button type="button" className="btn btn-primary" disabled={finalizing} onClick={() => void handleFinalize()}>
                  {finalizing ? 'Finalizing…' : 'Finalize roll & email IDs'}
                </button>
              ) : (
                <p style={{ fontSize: 12, color: 'var(--subtle)' }}>
                  Finalized {selectedElection.voter_roll_finalized_at ? new Date(selectedElection.voter_roll_finalized_at).toLocaleString() : ''}
                </p>
              )}
              <Link to={`/creator/elections/${selectedElection.id}`} className="btn btn-sm btn-ghost" style={{ marginTop: 12 }}>
                Election details
              </Link>
            </div>
          </div>

          <div className="card-elevated">
            <div className="card-header">
              <div className="card-title">ID format preview</div>
            </div>
            <div className="card-body">
              <p style={{ fontSize: 11, color: 'var(--subtle)', marginBottom: 12 }}>
                Prefix: <code>{prefix}</code>
              </p>
              <div className="sid-box" style={{ marginBottom: 8 }}>
                {examples.first}
              </div>
              <div className="sid-box" style={{ marginBottom: 8, opacity: 0.85 }}>
                {examples.masked}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
