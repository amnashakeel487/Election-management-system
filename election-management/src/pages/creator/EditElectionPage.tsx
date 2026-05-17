import { useParams } from 'react-router-dom'
import { CreateElectionWizard } from '@/components/election/CreateElectionWizard'
import { CreatorPageHeader } from '@/components/creator/layout/CreatorPageHeader'
import { CREATOR_PAGE_META } from '@/config/creatorNav'

const meta = CREATOR_PAGE_META.create

export function EditElectionPage() {
  const { id } = useParams<{ id: string }>()
  if (!id) return null

  return (
    <>
      <CreatorPageHeader eyebrow={meta.eyebrow} title="Edit draft election" subtitle={meta.subtitle} />
      <CreateElectionWizard electionId={id} embedded />
    </>
  )
}
