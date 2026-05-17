import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { CREATOR_PAGE_KEYS, type CreatorNavItem } from '@/config/creatorNav'

export interface CreatorPageMeta {
  topTitle: string
  topSub?: string
  eyebrow?: string
  title: string
  subtitle?: string
}

export function useCreatorPageMeta(pageKey: string): CreatorPageMeta {
  const { t } = useTranslation('creator')

  return useMemo(() => {
    const keys = CREATOR_PAGE_KEYS[pageKey] ?? CREATOR_PAGE_KEYS.dashboard
    return {
      topTitle: t(keys.topTitle),
      topSub: keys.topSub ? t(keys.topSub) : undefined,
      eyebrow: keys.eyebrow ? t(keys.eyebrow) : undefined,
      title: t(keys.title),
      subtitle: keys.subtitle ? t(keys.subtitle) : undefined,
    }
  }, [t, pageKey])
}

export function useCreatorNavLabel(item: CreatorNavItem): string {
  const { t } = useTranslation('creator')
  return t(item.labelKey)
}

export function useCreatorNavSection(sectionKey: string | undefined): string | undefined {
  const { t } = useTranslation('creator')
  if (!sectionKey) return undefined
  return t(sectionKey)
}
