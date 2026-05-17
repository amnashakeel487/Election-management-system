import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { fetchElectionsWithVisibleResults, type ResultsElectionListItem } from '@/services/resultsService'
import { formatSubmissionDate } from '@/utils/formatDate'
import '@/styles/fortressvote-results-light.css'

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
    <section className="fv-landing-results section" id="live-results">
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

        {loading ? (
          <p style={{ fontSize: 13, color: '#64748b' }}>{t('liveResults.loading')}</p>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: 14,
              marginBottom: 20,
            }}
          >
            {elections.map((e) => {
              const live = isLiveElection(e)
              return (
                <Link
                  key={e.id}
                  to={`/elections/${e.id}/results`}
                  style={{
                    display: 'block',
                    background: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 14,
                    padding: '16px 18px',
                    textDecoration: 'none',
                    color: 'inherit',
                    borderTop: live ? '3px solid #ef4444' : '3px solid #6c63ff',
                    transition: 'box-shadow 0.2s, border-color 0.2s',
                  }}
                >
                  {live ? (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        fontSize: 10,
                        fontWeight: 700,
                        color: '#dc2626',
                        background: '#fee2e2',
                        padding: '3px 8px',
                        borderRadius: 6,
                        marginBottom: 8,
                      }}
                    >
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          background: '#ef4444',
                          animation: 'fv-blink 1.2s ease-in-out infinite',
                        }}
                      />
                      {t('liveResults.liveNow')}
                    </span>
                  ) : (
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: '#6c63ff',
                        background: '#ede9fe',
                        padding: '3px 8px',
                        borderRadius: 6,
                        marginBottom: 8,
                        display: 'inline-block',
                      }}
                    >
                      {t('liveResults.results')}
                    </span>
                  )}
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: '#0f172a',
                      marginBottom: 6,
                      lineHeight: 1.3,
                    }}
                  >
                    {e.title}
                  </div>
                  <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>
                    {t('liveResults.ends', { date: formatSubmissionDate(e.end_date) })}
                  </p>
                </Link>
              )
            })}
          </div>
        )}

        <div className="reveal" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link
            to="/results"
            className="btn-hero-primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 22px',
              borderRadius: 10,
              textDecoration: 'none',
              fontSize: 13,
              fontWeight: 700,
            }}
          >
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
