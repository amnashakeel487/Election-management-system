# Multi-language support (i18n)

FortressVote uses **react-i18next** with locale files under `src/locales/`.

## Supported languages

| Code | Language | Direction |
|------|----------|-----------|
| `en` | English | LTR |
| `ur` | Urdu (اردو) | RTL |
| `ar` | Arabic (العربية) | RTL |
| `hi` | Hindi (हिन्दी) | LTR |

## Folder structure

```
src/locales/
  en/   common.json, nav.json, auth.json, dashboard.json, waitlist.json, settings.json, admin.json
  ur/
  ar/
  hi/
```

## Language switcher

- Public nav: **🌐 English | اردو | العربية | हिन्दी**
- Dashboard top bar and **Account → Security** settings
- Preference key: `localStorage` `fv-locale`

## Database

Migration `024_locale_preference.sql` adds `users.locale_preference` (`en` | `ur` | `ar` | `hi`). When signed in, the choice syncs to the profile (same pattern as theme).

## RTL

Urdu and Arabic set `document.documentElement.dir = 'rtl'` and class `rtl`. Helpers live in `src/styles/rtl.css`.

## Adding strings

1. Add the key to `src/locales/en/<namespace>.json`
2. Mirror in `ur/`, `ar/`, `hi/`
3. Use in components: `const { t } = useTranslation('nav')` then `t('elections')`

## Usage in code

```tsx
import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from '@/components/i18n/LanguageSwitcher'

const { t } = useTranslation(['nav', 'common'])
return <LanguageSwitcher variant="nav" />
```
