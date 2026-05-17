import { useCreatorElection } from '@/context/CreatorElectionContext'
import { electionShortCode } from '@/utils/creatorDisplay'

export function CreatorElectionPicker({ className = '' }: { className?: string }) {
  const { elections, loading, selectedId, setSelectedId } = useCreatorElection()

  if (loading || elections.length === 0) return null

  return (
    <label className={className} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span className="form-label" style={{ marginBottom: 0 }}>
        Active election
      </span>
      <select
        className="form-input form-select"
        value={selectedId ?? ''}
        onChange={(e) => setSelectedId(e.target.value || null)}
        style={{ minWidth: 220 }}
      >
        {elections.map((e) => (
          <option key={e.id} value={e.id}>
            {electionShortCode(e.id)} — {e.title}
          </option>
        ))}
      </select>
    </label>
  )
}
