import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CreatorApprovalBanner } from '@/components/creator/CreatorApprovalBanner'
import { CreatorPageHeader } from '@/components/creator/layout/CreatorPageHeader'
import { useTranslation } from 'react-i18next'
import { useCreatorPageMeta } from '@/hooks/useCreatorI18n'
import { useCreatorElection } from '@/context/CreatorElectionContext'
import { fetchElectionRegistrationStats } from '@/services/voterRegistrationService'
import {
  canCreatorDeleteElection,
  canCreatorEditElectionDetails,
  deleteCreatorElection,
} from '@/services/electionService'
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
                  {(() => {
                    const showFinalize = !e.voter_roll_finalized_at && e.status !== 'draft'
                    const showDelete = canCreatorDeleteElection(e.status)
                    const editLabel =
                      e.status === 'draft' ? t('elections.editButton') : t('elections.editTimesButton')
                    return (
                      <div className="el-actions">
                        <div className="el-actions-primary">
                          <Link to={`/creator/elections/${e.id}`} className="btn btn-sm btn-primary el-btn-manage">
                            {t('elections.manageButton')}
                          </Link>
                          {canCreatorEditElectionDetails(e.status) ? (
                            <Link
                              to={`/creator/elections/${e.id}/edit`}
                              className="el-btn-icon"
                              title={editLabel}
                              aria-label={editLabel}
                            >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                            </Link>
                          ) : null}
                        </div>
                        {showFinalize || showDelete ? (
                          <div className="el-actions-secondary">
                            {showFinalize ? (
                              <button
                                type="button"
                                className="btn btn-sm btn-ghost el-btn-secondary"
                                disabled={finalizingId === e.id || deletingId === e.id}
                                onClick={() => void handleFinalize(e.id, e.title)}
                              >
                                {finalizingId === e.id ? '…' : t('elections.finalizeRollButton')}
                              </button>
                            ) : (
                              <span className="el-btn-secondary" style={{ flex: 1 }} aria-hidden />
                            )}
                            {showDelete ? (
                              <button
                                type="button"
                                className="el-btn-icon el-btn-icon--danger"
                                disabled={deletingId === e.id || finalizingId === e.id}
                                title={t('elections.deleteButton')}
                                aria-label={t('elections.deleteButton')}
                                onClick={() => void handleDelete(e.id, e.title)}
                              >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                                  <polyline points="3 6 5 6 21 6" />
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                </svg>
                              </button>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    )
                  })()}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}


