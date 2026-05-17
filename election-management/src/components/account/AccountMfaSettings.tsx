import { useEffect, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'
import {
  enrollTotpFactor,
  getVerifiedTotpFactor,
  unenrollMfaFactor,
  verifyTotpEnrollment,
} from '@/services/mfaService'
import type { Factor } from '@supabase/supabase-js'

interface AccountMfaSettingsProps {
  /** `embedded` fits dashboard settings cards; `standalone` for /account/security */
  variant?: 'embedded' | 'standalone'
}

export function AccountMfaSettings({ variant = 'embedded' }: AccountMfaSettingsProps) {
  const { t } = useTranslation('settings')
  const { refreshSession } = useAuth()
  const [factor, setFactor] = useState<Factor | null>(null)
  const [enrolling, setEnrolling] = useState(false)
  const [qrUri, setQrUri] = useState<string | null>(null)
  const [enrollFactorId, setEnrollFactorId] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    void getVerifiedTotpFactor().then(setFactor)
  }, [])

  async function startEnroll() {
    setError(null)
    setMessage(null)
    setBusy(true)
    try {
      const data = await enrollTotpFactor()
      setEnrollFactorId(data.id)
      setQrUri(data.totp.qr_code)
      setEnrolling(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('mfaEnrollFailed'))
    } finally {
      setBusy(false)
    }
  }

  async function confirmEnroll(e: FormEvent) {
    e.preventDefault()
    if (!enrollFactorId) return
    setBusy(true)
    setError(null)
    try {
      await verifyTotpEnrollment(enrollFactorId, code.trim())
      await refreshSession()
      const verified = await getVerifiedTotpFactor()
      setFactor(verified)
      setEnrolling(false)
      setQrUri(null)
      setCode('')
      setMessage(t('mfaEnabledSuccess'))
    } catch (err) {
      setError(err instanceof Error ? err.message : t('mfaInvalidCode'))
    } finally {
      setBusy(false)
    }
  }

  async function disableMfa() {
    if (!factor) return
    setBusy(true)
    setError(null)
    try {
      await unenrollMfaFactor(factor.id)
      setFactor(null)
      await refreshSession()
      setMessage(t('mfaDisabledSuccess'))
    } catch (err) {
      setError(err instanceof Error ? err.message : t('mfaDisableFailed'))
    } finally {
      setBusy(false)
    }
  }

  const shellClass =
    variant === 'standalone'
      ? 'appearance-settings'
      : 'appearance-settings appearance-settings--admin'

  return (
    <section className={shellClass} aria-labelledby="mfa-settings-heading">
      <h3 id="mfa-settings-heading" className="appearance-settings__title">
        {t('mfaTitle')}
      </h3>
      <p className="appearance-settings__desc">{t('mfaDescription')}</p>

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

      {factor ? (
        <div className="space-y-3" style={{ marginTop: 12 }}>
          <p className="appearance-settings__hint">
            <strong>{t('mfaStatusOn')}</strong> — {t('mfaStatusOnHint')}
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={() => void disableMfa()}
            className={variant === 'embedded' ? 'btn btn-outline btn-sm' : 'rounded-xl border border-error/40 px-lg py-md font-label-md text-error hover:bg-error/10 disabled:opacity-60'}
            style={variant === 'embedded' ? { color: 'var(--error, #dc2626)', borderColor: 'var(--error, #dc2626)' } : undefined}
          >
            {t('mfaDisable')}
          </button>
        </div>
      ) : enrolling && qrUri ? (
        <form className="space-y-3" style={{ marginTop: 12 }} onSubmit={confirmEnroll}>
          <p className="appearance-settings__hint">{t('mfaScanHint')}</p>
          <img src={qrUri} alt="" className="mx-auto h-40 w-40 rounded-xl bg-white p-2" />
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            required
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            placeholder="000000"
            className="form-input"
            style={{ textAlign: 'center', letterSpacing: '0.35em' }}
          />
          <button type="submit" disabled={busy || code.length < 6} className="btn btn-primary btn-sm">
            {t('mfaConfirm')}
          </button>
        </form>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={() => void startEnroll()}
          className={variant === 'embedded' ? 'btn btn-primary btn-sm' : 'mt-3 rounded-xl bg-primary px-lg py-md font-headline-md text-on-primary disabled:opacity-60'}
          style={{ marginTop: variant === 'embedded' ? 12 : undefined }}
        >
          {t('mfaEnable')}
        </button>
      )}
    </section>
  )
}
