import '@/styles/creator-candidates.css'
import { CandidateManager } from '@/components/creator/CandidateManager'
import { CREATOR_PAGE_META } from '@/config/creatorNav'
import { useAuth } from '@/hooks/useAuth'

const meta = CREATOR_PAGE_META.candidates

export function CreatorCandidatesPage() {
  const { profile } = useAuth()

  return profile?.id ? (
    <CandidateManager creatorId={profile.id} eyebrow={meta.eyebrow} pageTitle={meta.title} />
  ) : null
}
