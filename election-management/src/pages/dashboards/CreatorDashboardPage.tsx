import { useTranslation } from 'react-i18next'
import { CreatorApprovalBanner } from '@/components/creator/CreatorApprovalBanner'
import { CreatorDashboardLiveSection } from '@/components/creator/CreatorDashboardLiveSection'
import { CreatorDashboardStatsGrid } from '@/components/creator/CreatorDashboardStatsGrid'
import { CreatorPageHeader } from '@/components/creator/layout/CreatorPageHeader'
import { useCreatorDashboardStats } from '@/hooks/useCreatorDashboardStats'
import { useCreatorPageMeta } from '@/hooks/useCreatorI18n'
import { useAuth } from '@/hooks/useAuth'
import { useCreatorElection } from '@/context/CreatorElectionContext'
import { formatSubmissionDate } from '@/utils/formatDate'

export function CreatorDashboardPage() {
  const { profile } = useAuth()
  const { elections, loading } = useCreatorElection()
  const { t } = useTranslation('creator')
  const meta = useCreatorPageMeta('dashboard')

  const isApproved = profile?.approval_status === 'approved'
  const { stats: dashboardStats, loading: statsLoading, error: statsError } = useCreatorDashboardStats(
    profile?.id,
    isApproved,
  )

  return (
    <>
      <CreatorApprovalBanner />
      <CreatorPageHeader eyebrow={meta.eyebrow} title={meta.title} subtitle={meta.subtitle} />

      {statsError ? (
        <p style={{ fontSize: 12, color: 'var(--danger)', marginBottom: 12 }}>
          {t('errors.statsMigration', { error: statsError })}
        </p>
      ) : null}

      {isApproved ? (
        <>
          <CreatorDashboardStatsGrid stats={dashboardStats} loading={statsLoading} />

          <CreatorDashboardLiveSection creatorId={profile?.id} elections={elections} enabled={isApproved} />

          <div className="card-elevated">
            <div className="card-header">
              <div className="card-title">{t('activity.recent')}</div>
            </div>
            <div className="card-body" style={{ padding: '16px 20px' }}>
              <div className="timeline">
                {loading ? (
                  <p style={{ fontSize: 12, color: 'var(--subtle)' }}>{t('activity.loading')}</p>
                ) : elections.length === 0 ? (
                  <p style={{ fontSize: 12, color: 'var(--subtle)' }}>{t('activity.none')}</p>
                ) : (
                  elections.slice(0, 5).map((e) => (
                    <div key={e.id} className="tl-item">
                      <div className="tl-dot" style={{ background: '#EFF4FF' }}>
                        <div className="tl-dot-inner" style={{ background: '#2451A3' }} />
                      </div>
                      <div className="tl-title">{e.title}</div>
                      <div className="tl-sub">
                        {t('activity.updated', {
                          status: e.status,
                          date: formatSubmissionDate(e.updated_at ?? e.start_date),
                        })}
                      </div>
                      <div className="tl-time">{formatSubmissionDate(e.updated_at ?? e.start_date)}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      ) : null}
    </>
  )
}
