import { useParams } from 'react-router-dom'
import { FortressLiveResultsView } from '@/components/results/public/FortressLiveResultsView'

/** Public live / final results for a single election. */
export function ElectionResultsPage() {
  const { id } = useParams<{ id: string }>()

  if (!id) {
    return <FortressLiveResultsView electionId="" />
  }

  return <FortressLiveResultsView electionId={id} />
}
