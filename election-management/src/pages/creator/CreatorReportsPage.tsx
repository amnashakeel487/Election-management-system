import { Link } from 'react-router-dom'
import { CreatorElectionPicker } from '@/components/creator/CreatorElectionPicker'
import { CreatorPageHeader } from '@/components/creator/layout/CreatorPageHeader'
import { ResultsExportToolbar } from '@/components/results/ResultsExportToolbar'
import { useCreatorElection } from '@/context/CreatorElectionContext'
import { useCreatorPageMeta } from '@/hooks/useCreatorI18n'
import { useElectionResults } from '@/hooks/useElectionResults'

export function CreatorReportsPage() {
  const meta = useCreatorPageMeta('reports')
  const { selectedId, selectedElection } = useCreatorElection()
  const { results, loading } = useElectionResults(selectedId ?? undefined)

  return (
    <>
      <CreatorPageHeader eyebrow={meta.eyebrow} title={meta.title} subtitle={meta.subtitle} />
      <CreatorElectionPicker className="mb-4" />

      <div className="report-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="report-icon" style={{ background: '#DBEAFE', color: '#2563EB' }}>
            <svg viewBox="0 0 24 24" width={18} height={18} aria-hidden>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill="none" stroke="currentColor" strokeWidth="2" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>Participants & waitlist</div>
            <div style={{ fontSize: 11, color: 'var(--subtle)' }}>Manage from participants page</div>
          </div>
        </div>
        <Link to="/creator/participants" className="btn btn-sm btn-ghost">
          Open
        </Link>
      </div>

      <div className="report-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="report-icon" style={{ background: '#EDE9FE', color: '#6D28D9' }}>
            <svg viewBox="0 0 24 24" width={18} height={18} aria-hidden>
              <line x1="18" y1="20" x2="18" y2="10" stroke="currentColor" strokeWidth="2" />
              <line x1="12" y1="20" x2="12" y2="4" stroke="currentColor" strokeWidth="2" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>Election results export</div>
            <div style={{ fontSize: 11, color: 'var(--subtle)' }}>
              {selectedElection ? selectedElection.title : 'Select an election'}
            </div>
          </div>
        </div>
      </div>

      {selectedId && results && !loading ? (
        <div className="card-elevated" style={{ marginTop: 14 }}>
          <div className="card-body">
            <ResultsExportToolbar results={results} variant="admin" />
          </div>
        </div>
      ) : selectedId && loading ? (
        <p style={{ fontSize: 13, color: 'var(--subtle)', marginTop: 12 }}>Loading results for export…</p>
      ) : (
        <p style={{ fontSize: 13, color: 'var(--subtle)', marginTop: 12 }}>Select an election to export results.</p>
      )}
    </>
  )
}
