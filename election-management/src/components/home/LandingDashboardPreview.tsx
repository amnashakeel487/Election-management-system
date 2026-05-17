import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { LandingLiveSnapshot } from '@/hooks/useLandingLiveData'
import { formatCompactNum } from '@/utils/browseElectionUi'

const CHART_COLORS = ['#E0E7FF', '#C7D2FE', '#A5B4FC', '#818CF8', '#6366F1', '#4F46E5', '#4338CA']

export function LandingDashboardPreview({
  snapshot,
  loading,
  barsReady,
}: {
  snapshot: LandingLiveSnapshot
  loading: boolean
  barsReady: boolean
}) {
  const { t } = useTranslation('landing')

  const activeCount = snapshot.liveElections
  const votersLabel = formatCompactNum(snapshot.registeredVoters)
  const votesLabel = formatCompactNum(snapshot.totalVotes)

  return (
    <div className={`dashboard-preview${loading ? ' dashboard-preview--loading' : ''}`}>
      <div className="dp-topbar">
        <div className="dp-dots">
          <div className="dp-dot" style={ { background: '#EF4444' } } />
          <div className="dp-dot" style={ { background: '#F59E0B' } } />
          <div className="dp-dot" style={ { background: '#10B981' } } />
        </div>
        <span className="dp-title">{t('preview.title')}</span>
        <div className="dp-live">
          <div className="dp-live-dot" />
          {snapshot.liveElections > 0 ? t('preview.live') : t('preview.synced')}
        </div>
      </div>
      <div className="dp-body">
        <div className="dp-stat-row">
          <div className="dp-stat">
            <div className="dp-stat-num">{loading ? '—' : activeCount}</div>
            <div className="dp-stat-label">{t('preview.active')}</div>
          </div>
          <div className="dp-stat">
            <div className="dp-stat-num">{loading ? '—' : votersLabel}</div>
            <div className="dp-stat-label">{t('preview.voters')}</div>
          </div>
          <div className="dp-stat">
            <div className="dp-stat-num">{loading ? '—' : votesLabel}</div>
            <div className="dp-stat-label">{t('preview.votes')}</div>
          </div>
        </div>

        {snapshot.featured.length === 0 && !loading ? (
          <div className="dp-election dp-election--empty">
            <span className="dp-el-title">{t('preview.noElections')}</span>
            <span className="dp-bar-meta">
              <Link to="/browse-elections">{t('preview.browseLink')}</Link>
            </span>
          </div>
        ) : (
          snapshot.featured.map((item, index) => (
            <Link
              key={item.id}
              to={`/elections/${item.id}`}
              className="dp-election dp-election--link"
              style={ { borderLeftColor: item.borderColor } }
            >
              <div className="dp-el-top">
                <span className="dp-el-title">{item.title}</span>
                <span className={`dp-badge ${item.phase === 'active' ? 'active' : 'upcoming'}`}>
                  {item.phase === 'active' ? t('preview.statusActive') : t('preview.statusUpcoming')}
                </span>
              </div>
              <div className="dp-bar-wrap">
                <div
                  className="dp-bar-fill"
                  style={{
                    width: barsReady ? `${item.progressPct}%` : 0,
                    background: item.barGradient,
                    transitionDelay: `${0.15 + index * 0.15}s`,
                  }}
                />
              </div>
              <div className="dp-bar-meta">
                <span>{item.metaLeft}</span>
                <span>{item.metaRight}</span>
              </div>
            </Link>
          ))
        )}

        <div className="dp-chart-row">
          {CHART_COLORS.map((bg, i) => (
            <div
              key={bg}
              className="dp-chart-bar"
              style={{
                height: barsReady ? snapshot.chartHeights[i] ?? '18%' : '18%',
                background: bg,
                ['--delay' as string]: `${0.2 + i * 0.1}s`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
