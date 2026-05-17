import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { parseOrThrow, passwordSchema } from '@/lib/validation/schemas'
import { updatePassword } from '@/services/authService'
import { z } from 'zod'

interface ChangePasswordSettingsProps {
  variant?: 'embedded' | 'standalone'
}

const changePasswordSchema = z.object({
  password: passwordSchema,
})

export function ChangePasswordSettings({ variant = 'embedded' }: ChangePasswordSettingsProps) {
  const { t } = useTranslation('settings')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setMessage(null)
    if (password !== confirm) {
      setError(t('passwordMismatch'))
      return
    }
    try {
      const parsed = parseOrThrow(changePasswordSchema, { password })
      setBusy(true)
      await updatePassword(parsed.password)
      setPassword('')
      setConfirm('')
      setMessage(t('passwordUpdated'))
    } catch (err) {
      setError(err instanceof Error ? err.message : t('passwordUpdateFailed'))
    } finally {
      setBusy(false)
    }
  }

  const shellClass =
    variant === 'standalone'
      ? 'appearance-settings'
      : 'appearance-settings appearance-settings--admin'

  return (
    <section className={shellClass} aria-labelledby="change-password-heading">
      <h3 id="change-password-heading" className="appearance-settings__title">
        {t('changePasswordTitle')}
      </h3>
      <p className="appearance-settings__desc">{t('changePasswordDescription')}</p>

      {message ? (
        <p className="appearance-settings__hint" style={{ color: 'var(--success, #16a34a)' }}>
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="appearance-settings__hint" style={{ color: 'var(--error, #dc2626)' }}>
          {error}
        </p>
      ) : null}

      <form onSubmit={onSubmit} className="form-row" style={{ marginTop: 12, flexDirection: 'column', gap: 10 }}>
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label" htmlFor="settings-new-password">
            {t('newPassword')}
          </label>
          <input
            id="settings-new-password"
            type="password"
            autoComplete="new-password"
            className="form-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
          />
        </div>
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label" htmlFor="settings-confirm-password">
            {t('confirmPassword')}
          </label>
          <input
            id="settings-confirm-password"
            type="password"
            autoComplete="new-password"
            className="form-input"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            minLength={8}
            required
          />
        </div>
        <button type="submit" disabled={busy} className="btn btn-primary btn-sm" style={{ alignSelf: 'flex-start' }}>
          {busy ? t('passwordSaving') : t('updatePassword')}
        </button>
      </form>
    </section>
  )
}
