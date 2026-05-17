import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { fetchElectionsWithVisibleResults, type ResultsElectionListItem } from '@/services/resultsService'
import { formatSubmissionDate } from '@/utils/formatDate'
import '@/styles/live-results.css'

function isLiveElection(e: ResultsElectionListItem): boolean {
  if (e.results_locked_at) return false
  if (!e.real_time_results) return false
  return new Date(e.end_date).getTime() > Date.now()
}

/** Landing teaser: elections with public live or final results. */
export function LandingLiveResultsSection() {
  const { t } = useTranslation('landing')
  const [elections, setElections] = useState<ResultsElectionListItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    void fetchElectionsWithVisibleResults()
      .then((data) => {
        if (!cancelled) setElections(data.slice(0, 3))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (!loading && elections.length === 0) {
    return null
  }

  return (
    <section className="section" id="live-results">
      <div className="section-inner">
        <div className="reveal" style={{ maxWidth: 560, marginBottom: 28 }}>
          <div className="section-eyebrow" style={{ color: '#6C63FF' }}>
            {t('liveResults.eyebrow')}
          </div>
          <h2 className="section-title">
            {t('liveResults.title')} <span className="accent">{t('liveResults.titleAccent')}</span>
          </h2>
          <p className="section-sub">{t('liveResults.sub')}</p>
        </div>

        <div className="lr-root" style={{ minHeight: 'auto', background: 'transparent' }}>
          {loading ? (
            <p style={{ fontSize: 13, color: '#64748b' }}>{t('liveResults.loading')}</p>
          ) : (
            <div className="rankings-list" style={{ marginBottom: 20 }}>
              {elections.map((e) => {
                const live = isLiveElection(e)
                return (
                  <Link
                    key={e.id}
                    to={`/elections/${e.id}/results`}
                    className={`rank-card${live ? ' leader' : ''}`}
                    style={{ textDecoration: 'none', color: 'inherit' }}
                  >
                    <div className="rank-row">
                      <div className="rank-info" style={{ flex: 1 }}>
                        <div className="rank-name">
                          {e.title}
                          {live ? (
                            <span
                              className="leader-badge"
                              style={{
                                color: '#FCA5A5',
                                borderColor: 'rgba(239,68,68,0.3)',
                                background: 'rgba(239,68,68,0.1)',
                              }}
                            >
                              {t('liveResults.liveNow')}
                            </span>
                          ) : (
                            <span className="leader-badge">{t('liveResults.results')}</span>
                          )}
                        </div>
                        <p className="rank-party" style={{ margin: 0 }}>
                          {t('liveResults.ends', { date: formatSubmissionDate(e.end_date) })}
                        </p>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        <div className="reveal" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link to="/results" className="btn-hero-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 22px', borderRadius: 10, textDecoration: 'none', fontSize: 13, fontWeight: 700 }}>
            {t('liveResults.viewAll')}
          </Link>
          <Link
            to="/browse-elections"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '12px 18px',
              borderRadius: 10,
              border: '1.5px solid #e2e8f0',
              textDecoration: 'none',
              fontSize: 13,
              fontWeight: 600,
              color: '#475569',
            }}
          >
            {t('liveResults.browseElections')}
          </Link>
        </div>
      </div>
    </section>
  )
}
