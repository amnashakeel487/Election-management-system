import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from '@/components/i18n/LanguageSwitcher'
import { useLocale } from '@/context/LocaleContext'
import { LOCALE_OPTIONS, type AppLocale } from '@/types/locale'

interface LanguageSettingsProps {
  variant?: 'admin' | 'default'
  locales?: readonly AppLocale[]
}

export function LanguageSettings({ variant = 'default', locales }: LanguageSettingsProps) {
  const { t } = useTranslation('settings')
  const { locale } = useLocale()
  const active = LOCALE_OPTIONS.find((o) => o.code === locale)

  const shellClass =
    variant === 'admin' ? 'appearance-settings appearance-settings--admin' : 'appearance-settings'

  return (
    <section className={shellClass} aria-labelledby="language-settings-heading">
      <h3 id="language-settings-heading" className="appearance-settings__title">
        {t('languageTitle')}
      </h3>
      <p className="appearance-settings__desc">{t('languageDescription')}</p>
      <LanguageSwitcher variant="settings" locales={locales} />
      <p className="appearance-settings__hint">
        {t('activeLanguage')}: <strong>{active?.label ?? locale}</strong>. {t('savedOnDevice')}{' '}
        {t('savedToAccount')}
      </p>
    </section>
  )
}
