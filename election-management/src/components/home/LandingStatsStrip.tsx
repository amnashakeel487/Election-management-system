import { useTranslation } from 'react-i18next'
import type { LandingLiveSnapshot } from '@/hooks/useLandingLiveData'
import { LandingAnimatedStat } from './LandingAnimatedStat'

export function LandingStatsStrip({
  snapshot,
  loading,
  formatCompact,
}: {
  snapshot: LandingLiveSnapshot
  loading: boolean
  formatCompact: (n: number) => string
}) {
  const { t } = useTranslation('landing')

  return (
    <div className="stats-strip">
      <div className="stats-inner">
        <div className="stat-col reveal">
          <LandingAnimatedStat
            value={snapshot.electionsConducted}
            format="number"
            formatCompact={formatCompact}
            className={`stat-num-big${loading ? ' stat-num-big--loading' : ''}`}
          />
          <div className="stat-label-big">{t('stats.electionsConducted')}</div>
          <div className="stat-delta">{t('stats.platformScale')}</div>
        </div>
        <div className="stat-col reveal" style={ { transitionDelay: '0.1s' } }>
          <LandingAnimatedStat
            value={snapshot.registeredVoters}
            format="compact"
            formatCompact={formatCompact}
            className={`stat-num-big${loading ? ' stat-num-big--loading' : ''}`}
          />
          <div className="stat-label-big">{t('stats.registeredVoters')}</div>
          <div className="stat-delta">{t('stats.growingCommunity')}</div>
        </div>
        <div className="stat-col reveal" style={ { transitionDelay: '0.2s' } }>
          <LandingAnimatedStat
            value={snapshot.totalVotes}
            format="compact"
            formatCompact={formatCompact}
            className={`stat-num-big${loading ? ' stat-num-big--loading' : ''}`}
          />
          <div className="stat-label-big">{t('stats.votesCast')}</div>
          <div className="stat-delta">{t('stats.votesCastDelta')}</div>
        </div>
        <div className="stat-col reveal" style={ { transitionDelay: '0.3s' } }>
          <LandingAnimatedStat
            value={snapshot.liveElections}
            format="number"
            formatCompact={formatCompact}
            className={`stat-num-big${loading ? ' stat-num-big--loading' : ''}`}
          />
          <div className="stat-label-big">{t('stats.liveElections')}</div>
          <div className="stat-delta stat-delta--live">{t('stats.liveElectionsDelta')}</div>
        </div>
      </div>
    </div>
  )
}
