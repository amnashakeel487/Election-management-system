import { useParams } from 'react-router-dom'
import { CreateElectionWizard } from '@/components/election/CreateElectionWizard'

export function EditElectionPage() {
  const { id } = useParams<{ id: string }>()
  if (!id) return null
  return <CreateElectionWizard electionId={id} />
}
