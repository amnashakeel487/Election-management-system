import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CreatorElectionPicker } from '@/components/creator/CreatorElectionPicker'
import { CreatorPageHeader } from '@/components/creator/layout/CreatorPageHeader'
import { ElectionWaitlistPanel } from '@/components/waitlist/ElectionWaitlistPanel'
import { CREATOR_PAGE_META } from '@/config/creatorNav'
import { useCreatorElection } from '@/context/CreatorElectionContext'
import { fetchElectionRegistrationStats } from '@/services/voterRegistrationService'
import type { ElectionRegistrationStats } from '@/types/voterRegistration'

const meta = CREATOR_PAGE_META.participants

export function CreatorParticipantsPage() {
  const { selectedElection, selectedId, refreshElections } = useCreatorElection()
  const [stats, setStats] = useState<ElectionRegistrationStats | null>(null)

  useEffect(() => {
    if (!selectedId || selectedElection?.status === 'draft') {
      setStats(null)
      return
    }
    void fetchElectionRegistrationStats(selectedId).then(setStats)
  }, [selectedId, selectedElection?.status])

  return (
    <>
      <CreatorPageHeader eyebrow={meta.eyebrow} title={meta.title} subtitle={meta.subtitle} />
      <CreatorElectionPicker className="mb-4" />

      {!selectedElection ? (
        <p style={{ fontSize: 13, color: 'var(--subtle)' }}>Select an election to manage participants.</p>
      ) : selectedElection.status === 'draft' ? (
        <div className="card-elevated">
          <div className="card-body">
            <p style={{ fontSize: 13 }}>Publish this election before managing voter registrations.</p>
            <Link to={`/creator/elections/${selectedElection.id}/edit`} className="btn btn-primary btn-sm" style={{ marginTop: 12 }}>
              Open wizard
            </Link>
          </div>
        </div>
      ) : (
        <>
          {stats ? (
            <div className="stat-grid" style={{ marginBottom: 18 }}>
              <div className="stat-card">
                <div className="stat-num">{stats.registered_count}</div>
                <div className="stat-label">Registered</div>
              </div>
              <div className="stat-card">
                <div className="stat-num">{stats.waitlist_count}</div>
                <div className="stat-label">Waitlisted</div>
              </div>
              <div className="stat-card">
                <div className="stat-num">{Math.max(0, stats.max_voters - stats.registered_count)}</div>
                <div className="stat-label">Spots left</div>
              </div>
            </div>
          ) : null}
          <ElectionWaitlistPanel
            electionId={selectedElection.id}
            voterRollFinalized={selectedElection.voter_roll_finalized_at}
            onChanged={() => {
              void refreshElections()
              if (selectedId) void fetchElectionRegistrationStats(selectedId).then(setStats)
            }}
          />
        </>
      )}
    </>
  )
}
