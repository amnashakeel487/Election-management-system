import { CreateElectionWizard } from '@/components/election/CreateElectionWizard'
import { CreatorPageHeader } from '@/components/creator/layout/CreatorPageHeader'
import { CREATOR_PAGE_META } from '@/config/creatorNav'

const meta = CREATOR_PAGE_META.create

export function CreateElectionPage() {
  return (
    <>
      <CreatorPageHeader eyebrow={meta.eyebrow} title={meta.title} subtitle={meta.subtitle} />
      <CreateElectionWizard embedded />
    </>
  )
}
