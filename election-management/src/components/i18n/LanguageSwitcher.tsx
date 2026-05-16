import { useTranslation } from 'react-i18next'
import { useLocale } from '@/context/LocaleContext'
import { LOCALE_OPTIONS, type AppLocale } from '@/types/locale'

export interface LanguageSwitcherProps {
  variant?: 'nav' | 'compact' | 'settings'
  className?: string
}

export function LanguageSwitcher({ variant = 'nav', className = '' }: LanguageSwitcherProps) {
  const { t } = useTranslation('nav')
  const { locale, setLocale } = useLocale()

  const baseClass =
    variant === 'settings'
      ? 'language-switcher language-switcher--settings'
      : variant === 'compact'
        ? 'language-switcher language-switcher--compact'
        : 'language-switcher language-switcher--nav'

  return (
    <div
      className={`${baseClass} ${className}`.trim()}
      role="group"
      aria-label={t('languageSwitcherLabel')}
    >
      {variant !== 'settings' ? (
        <span className="language-switcher__icon" aria-hidden>
          🌐
        </span>
      ) : null}
      <div className="language-switcher__options">
        {LOCALE_OPTIONS.map((opt, index) => (
          <span key={opt.code} className="language-switcher__item">
            {index > 0 ? <span className="language-switcher__sep" aria-hidden>|</span> : null}
            <button
              type="button"
              className={`language-switcher__btn${locale === opt.code ? ' language-switcher__btn--active' : ''}`}
              onClick={() => setLocale(opt.code as AppLocale)}
              aria-current={locale === opt.code ? 'true' : undefined}
              title={opt.englishName}
              lang={opt.code}
            >
              {opt.label}
            </button>
          </span>
        ))}
      </div>
    </div>
  )
}
