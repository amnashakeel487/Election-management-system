import { CreatorPageHeader } from '@/components/creator/layout/CreatorPageHeader'
import { CandidateManager } from '@/components/creator/CandidateManager'
import { CREATOR_PAGE_META } from '@/config/creatorNav'
import { useAuth } from '@/hooks/useAuth'

const meta = CREATOR_PAGE_META.candidates

export function CreatorCandidatesPage() {
  const { profile } = useAuth()

  return (
    <>
      <CreatorPageHeader eyebrow={meta.eyebrow} title={meta.title} subtitle={meta.subtitle} />
      {profile?.id ? <CandidateManager creatorId={profile.id} /> : null}
    </>
  )
}
