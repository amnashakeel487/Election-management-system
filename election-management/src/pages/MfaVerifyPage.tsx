import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { safeReturnPathForRole } from '@/utils/safeReturnPath'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { useAuth } from '@/hooks/useAuth'
import { challengeAndVerifyMfa, getVerifiedTotpFactor } from '@/services/mfaService'

export function MfaVerifyPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { mfaRequired, refreshSession, profile, emailVerified } = useAuth()
  const returnFrom = (location.state as { from?: string } | null)?.from
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const factor = await getVerifiedTotpFactor()
      if (!factor) throw new Error('No authenticator enrolled on this account.')
      await challengeAndVerifyMfa(factor.id, code.trim())
      await refreshSession()
      if (!emailVerified) {
        navigate('/verify-email', { replace: true })
        return
      }
      const path = profile ? safeReturnPathForRole(returnFrom, profile.role) : '/'
      navigate(path, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid verification code')
    } finally {
      setSubmitting(false)
    }
  }

  if (!mfaRequired) {
    const path = profile ? safeReturnPathForRole(returnFrom, profile.role) : '/'
    return <Navigate to={path} replace />
  }

  return (
    <AuthLayout>
      <div className="glass-card rounded-[32px] p-lg md:p-xl">
        <h2 className="mb-xs font-headline-lg text-headline-lg text-on-surface">Two-Factor Verification</h2>
        <p className="mb-lg font-body-sm text-body-sm text-on-surface-variant">
          Enter the 6-digit code from your authenticator app to complete sign-in.
        </p>

        {error ? (
          <p className="mb-md rounded-xl border border-error/30 bg-error-container/20 px-md py-sm font-body-sm text-error">
            {error}
          </p>
        ) : null}

        <form className="flex flex-col gap-md" onSubmit={handleSubmit}>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            required
            autoComplete="one-time-code"
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            className="w-full rounded-xl border-outline-variant bg-surface-container-lowest px-md py-md text-center font-headline-lg tracking-[0.4em] text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <button
            type="submit"
            disabled={submitting || code.length < 6}
            className="rounded-xl bg-primary py-md font-headline-md text-on-primary disabled:opacity-60"
          >
            {submitting ? 'Verifying…' : 'Verify & Continue'}
          </button>
        </form>
      </div>
    </AuthLayout>
  )
}
