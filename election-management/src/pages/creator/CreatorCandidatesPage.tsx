import '@/styles/creator-candidates.css'
import { CandidateManager } from '@/components/creator/CandidateManager'
import { useAuth } from '@/hooks/useAuth'
import { useCreatorPageMeta } from '@/hooks/useCreatorI18n'

export function CreatorCandidatesPage() {
  const { profile } = useAuth()
  const meta = useCreatorPageMeta('candidates')

  return profile?.id ? (
    <CandidateManager creatorId={profile.id} eyebrow={meta.eyebrow} pageTitle={meta.title} />
  ) : null
}
