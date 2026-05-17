import { useParams } from 'react-router-dom'
import { LiveResultsDetailView } from '@/components/results/live/LiveResultsDetailView'

/** Public live / final results for a single election. */
export function ElectionResultsPage() {
  const { id } = useParams<{ id: string }>()

  return <LiveResultsDetailView electionId={id ?? ''} />
}
