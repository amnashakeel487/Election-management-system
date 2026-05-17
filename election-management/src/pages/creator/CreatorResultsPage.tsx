import { CreatorElectionPicker } from '@/components/creator/CreatorElectionPicker'
import { CreatorPageHeader } from '@/components/creator/layout/CreatorPageHeader'
import { CreatorResultsView } from '@/components/creator/results/CreatorResultsView'
import { shortElectionCode } from '@/components/creator/results/creatorResultsUtils'
import { CREATOR_PAGE_META } from '@/config/creatorNav'
import { useCreatorElection } from '@/context/CreatorElectionContext'
import { useElectionResults } from '@/hooks/useElectionResults'
import '@/styles/creator-results.css'

const meta = CREATOR_PAGE_META.results

export function CreatorResultsPage() {
  const { selectedId, selectedElection } = useCreatorElection()
  const { results, loading, error, isLive, refresh } = useElectionResults(selectedId ?? undefined)

  const subtitle =
    selectedElection && selectedId
      ? `Live vote counting — ${selectedElection.title} ${shortElectionCode(selectedId)}`
      : meta.subtitle

  return (
    <>
      <CreatorPageHeader
        eyebrow={meta.eyebrow}
        title={meta.title}
        subtitle={subtitle}
        actions={
          selectedId && results ? (
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => void refresh()}>
              Refresh
            </button>
          ) : null
        }
      />
      <CreatorElectionPicker className="mb-4" />

      {!selectedId ? (
        <p style={{ fontSize: 13, color: 'var(--subtle)' }}>Select an election to view results.</p>
      ) : loading ? (
        <p style={{ fontSize: 13, color: 'var(--subtle)' }}>Loading results…</p>
      ) : error || !results ? (
        <div className="card-elevated">
          <div className="card-body">
            <p style={{ color: 'var(--danger)' }}>{error ?? 'Results not available yet.'}</p>
            <p style={{ fontSize: 12, color: 'var(--subtle)', marginTop: 8 }}>
              Enable real-time results in election settings or wait until voting ends.
            </p>
          </div>
        </div>
      ) : (
        <CreatorResultsView
          electionId={selectedId}
          results={results}
          isLive={isLive}
          onRefresh={() => void refresh()}
        />
      )}
    </>
  )
}
