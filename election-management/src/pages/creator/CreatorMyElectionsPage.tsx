import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CreatorApprovalBanner } from '@/components/creator/CreatorApprovalBanner'
import { CreatorPageHeader } from '@/components/creator/layout/CreatorPageHeader'
import { useTranslation } from 'react-i18next'
import { useCreatorPageMeta } from '@/hooks/useCreatorI18n'
import { useCreatorElection } from '@/context/CreatorElectionContext'
import { fetchElectionRegistrationStats } from '@/services/voterRegistrationService'
import { canCreatorDeleteElection, deleteCreatorElection } from '@/services/electionService'
import { finalizeAndEmailSecretVoterIds } from '@/services/secretVoterIdService'
import { creatorPhaseBadge, electionShortCode } from '@/utils/creatorDisplay'
import { formatSubmissionDate } from '@/utils/formatDate'

export function CreatorMyElectionsPage() {
  const { t } = useTranslation('creator')
  const meta = useCreatorPageMeta('elections')
  const { elections, loading, refreshElections, setSelectedId } = useCreatorElection()
  const [tab, setTab] = useState<'all' | 'active' | 'draft' | 'completed'>('all')
  const [finalizingId, setFinalizingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const filtered = elections.filter((e) => {
    const badge = creatorPhaseBadge(e)
    if (tab === 'all') return true
    if (tab === 'active') return badge.live || badge.label === 'Upcoming'
    if (tab === 'draft') return badge.label === 'Draft'
    if (tab === 'completed') return badge.label === 'Completed'
    return true
  })

  async function handleDelete(electionId: string, title: string) {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return
    setDeletingId(electionId)
    setMessage(null)
    try {
      await deleteCreatorElection(electionId)
      setSelectedId(null)
      setMessage(`Deleted "${title}".`)
      await refreshElections()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to delete election')
    } finally {
      setDeletingId(null)
    }
  }

  async function handleFinalize(electionId: string, title: string) {
    const regStats = await fetchElectionRegistrationStats(electionId)
    const msg =
      regStats.registered_count === 0
        ? `No voters registered for "${title}" yet. Finalizing will close registration permanently. Continue?`
        : `Finalize voter roll for "${title}"? This emails secret IDs to ${regStats.registered_count} voter(s) and cannot be undone.`
    if (!window.confirm(msg)) return

    setFinalizingId(electionId)
    setMessage(null)
    try {
      const { finalize, email } = await finalizeAndEmailSecretVoterIds(electionId)
      setMessage(`Assigned ${finalize.assigned_count} ID(s). Emailed ${email.sent} voter(s).`)
      await refreshElections()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Finalization failed')
    } finally {
      setFinalizingId(null)
    }
  }

  return (
    <>
      <CreatorApprovalBanner />
      <CreatorPageHeader
        eyebrow={meta.eyebrow}
        title={meta.title}
        subtitle={meta.subtitle}
        actions={
          <Link to="/creator/elections/new" className="btn btn-sm btn-primary">
            {t('elections.createButton')}
          </Link>
        }
      />

      {message ? <div className="alert-banner alert-banner--success">{message}</div> : null}

      <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
        {(['all', 'active', 'draft', 'completed'] as const).map((tabKey) => (
          <button
            key={tabKey}
            type="button"
            className={`btn btn-sm${tab === tabKey ? ' btn-primary' : ' btn-ghost'}`}
            onClick={() => setTab(tabKey)}
          >
            {t(`elections.tabs.${tabKey}`)}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ color: 'var(--subtle)', fontSize: 13 }}>{t('elections.loading')}</p>
      ) : filtered.length === 0 ? (
        <div className="card-elevated">
          <div className="card-body">
            <p style={{ fontSize: 13, color: 'var(--subtle)' }}>
              {t('elections.emptyView')}{' '}
              <Link to="/creator/elections/new">{t('elections.createFirstLink')}</Link>.
            </p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 14 }}>
          {filtered.map((e) => {
            const badge = creatorPhaseBadge(e)
            const accent =
              badge.live ? '#10B981' : badge.label === 'Upcoming' ? '#3B82F6' : badge.label === 'Draft' ? '#94A3B8' : '#6C3FC5'
            return (
              <div key={e.id} className="el-card">
                <div className="el-accent" style={{ background: accent }} />
                <div className="el-body">
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                    <span className={badge.className}>
                      {badge.live ? <span className="b-dot" /> : null}
                      {badge.label}
                    </span>
                    <span style={{ fontSize: 10, fontFamily: 'IBM Plex Mono, monospace', color: 'var(--subtle)' }}>
                      {electionShortCode(e.id)}
                    </span>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 4 }}>{e.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--subtle)', marginBottom: 12 }}>
                    {formatSubmissionDate(e.start_date)} — {formatSubmissionDate(e.end_date)}
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <Link to={`/creator/elections/${e.id}`} className="btn btn-sm btn-primary">
                      Manage
                    </Link>
                    {e.status === 'draft' ? (
                      <Link to={`/creator/elections/${e.id}/edit`} className="btn btn-sm btn-ghost">
                        Edit
                      </Link>
                    ) : null}
                    {!e.voter_roll_finalized_at && e.status !== 'draft' ? (
                      <button
                        type="button"
                        className="btn btn-sm btn-cyan"
                        disabled={finalizingId === e.id || deletingId === e.id}
                        onClick={() => void handleFinalize(e.id, e.title)}
                      >
                        {finalizingId === e.id ? '…' : 'Finalize roll'}
                      </button>
                    ) : null}
                    {canCreatorDeleteElection(e.status) ? (
                      <button
                        type="button"
                        className="btn btn-sm btn-danger"
                        disabled={deletingId === e.id || finalizingId === e.id}
                        onClick={() => void handleDelete(e.id, e.title)}
                      >
                        {deletingId === e.id ? '…' : 'Delete'}
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}


