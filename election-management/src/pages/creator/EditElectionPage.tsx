import { useParams } from 'react-router-dom'
import { CreateElectionWizard } from '@/components/election/CreateElectionWizard'
import { CreatorPageHeader } from '@/components/creator/layout/CreatorPageHeader'
import { useTranslation } from 'react-i18next'
import { useCreatorPageMeta } from '@/hooks/useCreatorI18n'

export function EditElectionPage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation('creator')
  const meta = useCreatorPageMeta('create')
  if (!id) return null

  return (
    <>
      <CreatorPageHeader eyebrow={meta.eyebrow} title={t('pages.create.editTitle')} subtitle={meta.subtitle} />
      <CreateElectionWizard electionId={id} embedded />
    </>
  )
}
