import { useTranslation } from 'react-i18next'
import { AccountMfaSettings } from '@/components/account/AccountMfaSettings'
import { ChangePasswordSettings } from '@/components/account/ChangePasswordSettings'
import { CreatorPageHeader } from '@/components/creator/layout/CreatorPageHeader'
import { LanguageSettings } from '@/components/i18n/LanguageSettings'
import { AppearanceSettings } from '@/components/theme/AppearanceSettings'
import { useCreatorPageMeta } from '@/hooks/useCreatorI18n'
import { CREATOR_LOCALES } from '@/types/locale'

export function CreatorSettingsPage() {
  const { t } = useTranslation('creator')
  const meta = useCreatorPageMeta('settings')

  return (
    <>
      <CreatorPageHeader eyebrow={meta.eyebrow} title={meta.title} subtitle={meta.subtitle} />

      <LanguageSettings variant="admin" locales={CREATOR_LOCALES} />
      <div style={{ marginTop: 16 }}>
        <AppearanceSettings variant="admin" />
      </div>

      <div className="grid-2" style={{ marginTop: 16 }}>
        <div className="card-elevated">
          <div className="card-header">
            <div className="card-title">{t('pages.settings.accountSecurity')}</div>
          </div>
          <div className="card-body">
            <ChangePasswordSettings variant="embedded" />
            <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
              <AccountMfaSettings variant="embedded" />
            </div>
          </div>
        </div>
        <div className="card-elevated">
          <div className="card-header">
            <div className="card-title">{t('pages.settings.electionDefaults')}</div>
            <div className="card-subtitle">{t('pages.settings.comingSoon')}</div>
          </div>
          <div className="card-body">
            <p style={{ fontSize: 12, color: 'var(--subtle)' }}>{t('pages.settings.electionDefaultsDesc')}</p>
          </div>
        </div>
      </div>
    </>
  )
}
