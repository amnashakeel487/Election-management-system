import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { requestPasswordReset, verifyPasswordResetOtp } from '@/services/authService'
import { useAuth } from '@/hooks/useAuth'

type Step = 'email' | 'code'

export function ForgotPasswordPage() {
  const { t } = useTranslation('auth')
  const navigate = useNavigate()
  const { refreshSession } = useAuth()
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSendEmail(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await requestPasswordReset(email)
      setStep('code')
    } catch (err) {
      setError(err instanceof Error ? err.message : t('passwordReset.sendFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleVerifyCode(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await verifyPasswordResetOtp(email, code)
      await refreshSession()
      navigate('/reset-password', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : t('passwordReset.codeFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleResend() {
    setError(null)
    setSubmitting(true)
    try {
      await requestPasswordReset(email)
      setCode('')
    } catch (err) {
      setError(err instanceof Error ? err.message : t('passwordReset.sendFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout>
      <div className="glass-card mx-auto max-w-md rounded-[32px] p-lg md:p-xl">
        <h2 className="mb-xs font-headline-lg text-headline-lg text-on-surface">{t('passwordReset.title')}</h2>
        <p className="mb-lg font-body-sm text-body-sm text-on-surface-variant">
          {step === 'email' ? t('passwordReset.subEmail') : t('passwordReset.subCode')}
        </p>

        {error ? (
          <p className="mb-md rounded-xl border border-error/30 bg-error-container/20 px-md py-sm font-body-sm text-error">
            {error}
          </p>
        ) : null}

        {step === 'email' ? (
          <form className="flex flex-col gap-md" onSubmit={handleSendEmail}>
            <div className="space-y-sm">
              <label className="ml-xs font-label-md text-label-md text-on-surface-variant" htmlFor="email">
                {t('email')}
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border-outline-variant bg-surface-container-lowest px-md py-md text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-primary py-md font-headline-md text-on-primary disabled:opacity-60"
            >
              {submitting ? t('passwordReset.sending') : t('passwordReset.sendCode')}
            </button>
          </form>
        ) : (
          <form className="flex flex-col gap-md" onSubmit={handleVerifyCode}>
            <p className="rounded-xl border border-tertiary/30 bg-tertiary/10 px-md py-sm font-body-sm text-on-surface">
              {t('passwordReset.codeSent', { email })}
            </p>
            <div className="space-y-sm">
              <label className="ml-xs font-label-md text-label-md text-on-surface-variant" htmlFor="code">
                {t('passwordReset.codeLabel')}
              </label>
              <input
                id="code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                minLength={6}
                maxLength={8}
                pattern="[0-9\s]{6,8}"
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/[^\d\s]/g, ''))}
                className="w-full rounded-xl border-outline-variant bg-surface-container-lowest px-md py-md text-center font-mono text-lg tracking-[0.35em] text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <button
              type="submit"
              disabled={submitting || code.replace(/\s/g, '').length < 6}
              className="rounded-xl bg-primary py-md font-headline-md text-on-primary disabled:opacity-60"
            >
              {submitting ? t('passwordReset.verifying') : t('passwordReset.verifyCode')}
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={() => void handleResend()}
              className="font-label-md text-primary hover:underline disabled:opacity-60"
            >
              {t('passwordReset.resend')}
            </button>
            <button
              type="button"
              className="font-label-md text-on-surface-variant hover:underline"
              onClick={() => {
                setStep('email')
                setCode('')
                setError(null)
              }}
            >
              {t('passwordReset.changeEmail')}
            </button>
          </form>
        )}

        <Link to="/login" className="mt-lg block text-center font-label-md text-primary hover:underline">
          {t('signInLink')}
        </Link>
      </div>
    </AuthLayout>
  )
}
