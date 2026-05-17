import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { updatePassword } from '@/services/authService'
import { useAuth } from '@/hooks/useAuth'
import { establishRecoverySession, hasRecoveryParamsInUrl } from '@/utils/recoverySession'

export function ResetPasswordPage() {
  const { t } = useTranslation('auth')
  const navigate = useNavigate()
  const { authReady, session, isRecoverySession, clearRecoverySession, signOut, refreshSession } = useAuth()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sessionReady, setSessionReady] = useState(false)
  const [establishing, setEstablishing] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function initRecovery() {
      if (!authReady) return

      try {
        if (hasRecoveryParamsInUrl()) {
          const recoverySession = await establishRecoverySession()
          if (cancelled) return
          if (recoverySession) {
            await refreshSession()
            setSessionReady(true)
          } else {
            setError(t('passwordReset.linkExpired'))
          }
          return
        }

        if (session && (isRecoverySession || session)) {
          if (!cancelled) setSessionReady(true)
          return
        }

        if (!cancelled) {
          setError(t('passwordReset.needCode'))
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : t('passwordReset.verifyFailed'))
        }
      } finally {
        if (!cancelled) setEstablishing(false)
      }
    }

    void initRecovery()
    return () => {
      cancelled = true
    }
  }, [authReady, session, isRecoverySession, refreshSession, t])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      setError(t('signupForm.passwordMismatch'))
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      await updatePassword(password)
      clearRecoverySession()
      await signOut()
      navigate('/login', {
        replace: true,
        state: { message: t('passwordReset.success') },
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : t('passwordReset.updateFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  if (!authReady || establishing) {
    return (
      <AuthLayout>
        <div className="glass-card mx-auto max-w-md rounded-[32px] p-lg text-center md:p-xl">
          <p className="font-body-md text-on-surface-variant">{t('passwordReset.preparing')}</p>
        </div>
      </AuthLayout>
    )
  }

  if (!sessionReady) {
    return (
      <AuthLayout>
        <div className="glass-card mx-auto max-w-md rounded-[32px] p-lg md:p-xl">
          {error ? (
            <p className="mb-md rounded-xl border border-error/30 bg-error-container/20 px-md py-sm font-body-sm text-error">
              {error}
            </p>
          ) : null}
          <Link to="/forgot-password" className="block text-center font-label-md text-primary hover:underline">
            {t('passwordReset.backToForgot')}
          </Link>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <div className="glass-card mx-auto max-w-md rounded-[32px] p-lg md:p-xl">
        <h2 className="mb-xs font-headline-lg text-headline-lg text-on-surface">{t('passwordReset.newPasswordTitle')}</h2>
        <p className="mb-lg font-body-sm text-body-sm text-on-surface-variant">{t('passwordReset.newPasswordSub')}</p>

        {error ? (
          <p className="mb-md rounded-xl border border-error/30 bg-error-container/20 px-md py-sm font-body-sm text-error">
            {error}
          </p>
        ) : null}

        <form className="flex flex-col gap-md" onSubmit={handleSubmit}>
          <div className="space-y-sm">
            <label className="ml-xs font-label-md text-label-md text-on-surface-variant" htmlFor="password">
              {t('passwordReset.newPassword')}
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border-outline-variant bg-surface-container-lowest px-md py-md text-on-surface outline-none focus:border-primary"
            />
          </div>
          <div className="space-y-sm">
            <label className="ml-xs font-label-md text-label-md text-on-surface-variant" htmlFor="confirm">
              {t('signupForm.confirmPassword')}
            </label>
            <input
              id="confirm"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full rounded-xl border-outline-variant bg-surface-container-lowest px-md py-md text-on-surface outline-none focus:border-primary"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-primary py-md font-headline-md text-on-primary disabled:opacity-60"
          >
            {submitting ? t('passwordReset.saving') : t('passwordReset.updatePassword')}
          </button>
        </form>

        <Link to="/login" className="mt-lg block text-center font-label-md text-primary hover:underline">
          {t('signInLink')}
        </Link>
      </div>
    </AuthLayout>
  )
}
