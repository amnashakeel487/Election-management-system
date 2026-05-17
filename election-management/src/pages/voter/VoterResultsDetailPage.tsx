import { useParams } from 'react-router-dom'
import { LiveResultsDetailView } from '@/components/results/live/LiveResultsDetailView'

/** Voter dashboard: full live results experience (same as public /elections/:id/results). */
export function VoterResultsDetailPage() {
  const { id } = useParams<{ id: string }>()
  if (!id) return null

  return <LiveResultsDetailView electionId={id} embeddedIn="voter" />
}
