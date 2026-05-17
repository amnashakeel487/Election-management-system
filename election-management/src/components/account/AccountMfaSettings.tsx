import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'
import {
  enrollTotpFactor,
  getTotpFactorState,
  removeUnverifiedTotpFactors,
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
  const [incompleteCount, setIncompleteCount] = useState(0)
  const [enrolling, setEnrolling] = useState(false)
  const [qrUri, setQrUri] = useState<string | null>(null)
  const [enrollFactorId, setEnrollFactorId] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)

  const loadFactors = useCallback(async () => {
    setLoading(true)
    try {
      const { verified, unverified } = await getTotpFactorState()
      setFactor(verified)
      setIncompleteCount(unverified.length)
    } catch {
      setFactor(null)
      setIncompleteCount(0)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadFactors()
  }, [loadFactors])

  async function startEnroll() {
    setError(null)
    setMessage(null)
    setBusy(true)
    try {
      const data = await enrollTotpFactor()
      setEnrollFactorId(data.id)
      setQrUri(data.totp.qr_code)
      setEnrolling(true)
      setIncompleteCount(0)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('mfaEnrollFailed'))
    } finally {
      setBusy(false)
    }
  }

  async function cancelIncompleteSetup() {
    setBusy(true)
    setError(null)
    setMessage(null)
    try {
      const removed = await removeUnverifiedTotpFactors()
      setIncompleteCount(0)
      setEnrolling(false)
      setQrUri(null)
      setEnrollFactorId(null)
      setCode('')
      if (removed > 0) {
        setMessage(t('mfaIncompleteRemoved'))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('mfaDisableFailed'))
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
      await loadFactors()
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
      await loadFactors()
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

      {loading ? (
        <p className="appearance-settings__hint" style={{ marginTop: 12 }}>
          {t('mfaLoading')}
        </p>
      ) : factor ? (
        <div className="space-y-3" style={{ marginTop: 12 }}>
          <p className="appearance-settings__hint">
            <strong>{t('mfaStatusOn')}</strong> — {t('mfaStatusOnHint')}
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={() => void disableMfa()}
            className={
              variant === 'embedded'
                ? 'btn btn-outline btn-sm'
                : 'rounded-xl border border-error/40 px-lg py-md font-label-md text-error hover:bg-error/10 disabled:opacity-60'
            }
            style={
              variant === 'embedded'
                ? { color: 'var(--error, #dc2626)', borderColor: 'var(--error, #dc2626)' }
                : undefined
            }
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
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="submit" disabled={busy || code.length < 6} className="btn btn-primary btn-sm">
              {t('mfaConfirm')}
            </button>
            <button
              type="button"
              disabled={busy}
              className="btn btn-ghost btn-sm"
              onClick={() => void cancelIncompleteSetup()}
            >
              {t('mfaCancelSetup')}
            </button>
          </div>
        </form>
      ) : incompleteCount > 0 ? (
        <div className="space-y-3" style={{ marginTop: 12 }}>
          <p className="appearance-settings__hint">{t('mfaIncompleteHint')}</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" disabled={busy} className="btn btn-primary btn-sm" onClick={() => void startEnroll()}>
              {t('mfaContinueSetup')}
            </button>
            <button type="button" disabled={busy} className="btn btn-ghost btn-sm" onClick={() => void cancelIncompleteSetup()}>
              {t('mfaRemoveIncomplete')}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={() => void startEnroll()}
          className={
            variant === 'embedded'
              ? 'btn btn-primary btn-sm'
              : 'mt-3 rounded-xl bg-primary px-lg py-md font-headline-md text-on-primary disabled:opacity-60'
          }
          style={{ marginTop: variant === 'embedded' ? 12 : undefined }}
        >
          {t('mfaEnable')}
        </button>
      )}
    </section>
  )
}
