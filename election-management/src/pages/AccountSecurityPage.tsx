import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { useAuth } from '@/hooks/useAuth'
import {
  enrollTotpFactor,
  getVerifiedTotpFactor,
  unenrollMfaFactor,
  verifyTotpEnrollment,
} from '@/services/mfaService'
import type { Factor } from '@supabase/supabase-js'
import { AppearanceSettings } from '@/components/theme/AppearanceSettings'

export function AccountSecurityPage() {
  const { refreshSession, getDashboardPath } = useAuth()
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
      setError(err instanceof Error ? err.message : 'Could not start 2FA enrollment')
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
      setMessage('Two-factor authentication is now enabled.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid code')
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
      setMessage('Two-factor authentication has been disabled.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not disable 2FA')
    } finally {
      setBusy(false)
    }
  }

  const dashboard = getDashboardPath() ?? '/'

  return (
    <AuthLayout>
      <div className="glass-card rounded-[32px] p-lg md:p-xl">
        <div className="mb-lg flex items-center justify-between gap-md">
          <div>
            <h2 className="font-headline-lg text-headline-lg text-on-surface">Account Security</h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Optional TOTP authenticator (bonus 2FA) for an extra sign-in step.
            </p>
          </div>
          <Link to={dashboard} className="font-label-md text-primary hover:underline">
            Back
          </Link>
        </div>

        {message ? (
          <p className="mb-md rounded-xl border border-tertiary/30 bg-tertiary/10 px-md py-sm font-body-sm text-on-surface">
            {message}
          </p>
        ) : null}
        {error ? (
          <p className="mb-md rounded-xl border border-error/30 bg-error-container/20 px-md py-sm font-body-sm text-error">
            {error}
          </p>
        ) : null}

        <div className="mb-lg">
          <AppearanceSettings />
        </div>

        {factor ? (
          <div className="space-y-md">
            <p className="rounded-xl border border-primary/20 bg-primary/5 px-md py-sm font-body-sm text-on-surface">
              Authenticator app is <strong>enabled</strong> on this account.
            </p>
            <button
              type="button"
              disabled={busy}
              onClick={() => void disableMfa()}
              className="rounded-xl border border-error/40 px-lg py-md font-label-md text-error hover:bg-error/10 disabled:opacity-60"
            >
              Disable 2FA
            </button>
          </div>
        ) : enrolling && qrUri ? (
          <form className="space-y-md" onSubmit={confirmEnroll}>
            <p className="font-body-sm text-on-surface-variant">
              Scan this QR code with Google Authenticator, Authy, or a compatible app, then enter the 6-digit code.
            </p>
            <img src={qrUri} alt="TOTP QR code" className="mx-auto h-48 w-48 rounded-xl bg-white p-sm" />
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              required
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="w-full rounded-xl border-outline-variant bg-surface-container-lowest px-md py-md text-center tracking-[0.4em] text-on-surface outline-none focus:border-primary"
            />
            <button
              type="submit"
              disabled={busy || code.length < 6}
              className="w-full rounded-xl bg-primary py-md font-headline-md text-on-primary disabled:opacity-60"
            >
              Confirm 2FA
            </button>
          </form>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={() => void startEnroll()}
            className="rounded-xl bg-primary px-lg py-md font-headline-md text-on-primary disabled:opacity-60"
          >
            Enable Authenticator 2FA
          </button>
        )}
      </div>
    </AuthLayout>
  )
}
