import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CreateElectionWizard } from '@/components/election/CreateElectionWizard'
import { CreatorElectionEditForm } from '@/components/creator/CreatorElectionEditForm'
import { CreatorPageHeader } from '@/components/creator/layout/CreatorPageHeader'
import { useCreatorPageMeta } from '@/hooks/useCreatorI18n'
import { fetchElectionById } from '@/services/electionService'

export function EditElectionPage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation('creator')
  const meta = useCreatorPageMeta('create')
  const [status, setStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) {
      setLoading(false)
      return
    }
    void fetchElectionById(id)
      .then((e) => setStatus(e?.status ?? null))
      .finally(() => setLoading(false))
  }, [id])

  if (!id) return null

  const isDraft = status === 'draft'
  const pageTitle = loading
    ? t('pages.create.editTitle')
    : isDraft
      ? t('pages.create.editTitle')
      : t('pages.create.editPublishedTitle')

  return (
    <>
      <CreatorPageHeader eyebrow={meta.eyebrow} title={pageTitle} subtitle={t('pages.create.editPublishedSubtitle')} />
      {loading ? (
        <p style={{ fontSize: 13, color: 'var(--subtle)' }}>{t('elections.loading')}</p>
      ) : isDraft ? (
        <CreateElectionWizard electionId={id} embedded />
      ) : (
        <CreatorElectionEditForm electionId={id} />
      )}
    </>
  )
}
