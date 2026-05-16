import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { resendVerificationEmail } from '@/services/authService'
import { useAuth } from '@/hooks/useAuth'

type VerifyEmailLocationState = {
  email?: string
}

/** design/email_verification/code.html */
export function VerifyEmailPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const pendingEmail = (location.state as VerifyEmailLocationState | null)?.email
  const { user, emailVerified, authReady, getDashboardPath, refreshProfile, refreshSession } = useAuth()
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [resending, setResending] = useState(false)

  const displayEmail = user?.email ?? pendingEmail ?? ''

  useEffect(() => {
    void refreshSession().catch(() => {
      /* session refresh from email link */
    })
  }, [refreshSession])

  useEffect(() => {
    if (authReady && !user && !pendingEmail) {
      navigate('/login', { replace: true })
    }
  }, [authReady, user, pendingEmail, navigate])

  async function handleResend() {
    if (!displayEmail) return
    setError(null)
    setMessage(null)
    setResending(true)
    try {
      await resendVerificationEmail(displayEmail)
      setMessage('Verification email sent. Check your inbox.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend email')
    } finally {
      setResending(false)
    }
  }

  async function handleGoToDashboard() {
    await refreshSession()
    await refreshProfile()
    const path = getDashboardPath()
    if (path) navigate(path, { replace: true })
  }

  if (!authReady || (!user && !pendingEmail)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-on-background">
        <span className="font-body-md text-body-md text-on-surface-variant">Verifying session…</span>
      </div>
    )
  }

  const verified = emailVerified && Boolean(user)

  return (
    <div className="flex min-h-screen flex-col items-center bg-background text-on-background">
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-margin py-xl">
        <div className="font-headline-md text-headline-md font-bold tracking-tight text-primary">FortressVote</div>
        <div className="flex items-center space-x-md text-on-surface-variant">
          <span className="material-symbols-outlined text-[20px]">lock</span>
          <span className="font-label-md">Secure Session Active</span>
        </div>
      </header>

      <main className="flex w-full flex-grow flex-col items-center justify-center px-gutter py-2xl">
        <div className="mb-xl flex w-full max-w-[560px] flex-col items-center space-y-xl">
          <div className="relative mb-md flex h-32 w-32 items-center justify-center">
            <div className="absolute inset-0 animate-pulse rounded-full bg-primary/10 blur-2xl" />
            <div className="absolute inset-4 animate-[spin_10s_linear_infinite] rounded-full border-2 border-dashed border-primary/30" />
            <div className="glass-panel success-glow relative flex h-24 w-24 items-center justify-center rounded-full border-primary/20">
              <span
                className="material-symbols-outlined text-[56px] text-primary"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                verified_user
              </span>
            </div>
          </div>

          <section className="glass-panel w-full space-y-xl rounded-[40px] p-2xl text-center shadow-2xl">
            <div className="space-y-md">
              <h1 className="font-headline-xl text-headline-xl text-on-surface">
                {verified ? 'Verification Successful' : 'Verify Your Email'}
              </h1>
              <p className="mx-auto max-w-sm font-body-lg text-body-lg text-on-surface-variant">
                {verified
                  ? 'Your identity has been cryptographically confirmed. You now have full access to the election portal.'
                  : `We sent a secure verification link to ${displayEmail}. Confirm your email to access your dashboard.`}
              </p>
            </div>

            {message ? <p className="font-body-sm text-body-sm text-tertiary">{message}</p> : null}
            {error ? <p className="font-body-sm text-body-sm text-error">{error}</p> : null}

            {verified ? (
              <div className="pt-md">
                <button
                  type="button"
                  onClick={() => void handleGoToDashboard()}
                  className="mx-auto w-full max-w-xs rounded-xl bg-primary py-lg font-semibold text-on-primary-container shadow-lg shadow-primary/20 transition-all hover:opacity-90 active:scale-[0.98]"
                >
                  Go to Dashboard
                </button>
              </div>
            ) : null}
          </section>

          {!verified ? (
            <section className="w-full space-y-xl">
              <div className="flex items-center justify-center space-x-md">
                <div className="h-[1px] max-w-[80px] flex-grow bg-outline-variant" />
                <span className="font-label-md text-label-md uppercase tracking-[0.2em] text-outline">
                  Security Audit
                </span>
                <div className="h-[1px] max-w-[80px] flex-grow bg-outline-variant" />
              </div>
              <div className="grid grid-cols-1 items-stretch gap-lg md:grid-cols-2">
                <div className="flex flex-col items-center space-y-md rounded-2xl border border-line bg-surface-container-low p-lg text-center">
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Didn&apos;t receive the secure link?
                  </p>
                  <button
                    type="button"
                    disabled={resending || !displayEmail}
                    onClick={() => void handleResend()}
                    className="w-full rounded-xl border border-primary/30 px-lg py-md font-label-md text-label-md text-primary transition-colors hover:bg-primary/5 disabled:opacity-60"
                  >
                    Resend Verification
                  </button>
                </div>
                <div className="flex items-start space-x-md rounded-2xl border border-line bg-surface-container-low p-lg text-left">
                  <span className="material-symbols-outlined mt-1 text-[24px] text-tertiary">shield_lock</span>
                  <p className="font-label-sm text-label-sm leading-relaxed text-on-surface-variant">
                    Encryption check: AES-256 GCM verified. Connection is secure and end-to-end encrypted for your
                    protection.
                  </p>
                </div>
              </div>
            </section>
          ) : null}
        </div>
      </main>

      <footer className="mx-auto w-full max-w-7xl border-t border-line px-margin py-xl">
        <div className="flex flex-col items-center justify-between space-y-md md:flex-row md:space-y-0">
          <p className="font-body-sm text-body-sm text-outline">
            © 2024 FortressVote Secure Systems. Part of the Federal Election Infrastructure.
          </p>
          <div className="flex space-x-xl">
            <a className="font-label-md text-label-md text-on-surface-variant transition-colors hover:text-primary" href="#">
              Security Protocol
            </a>
            <a className="font-label-md text-label-md text-on-surface-variant transition-colors hover:text-primary" href="#">
              Voter Rights
            </a>
            <a className="font-label-md text-label-md text-on-surface-variant transition-colors hover:text-primary" href="#">
              Support
            </a>
          </div>
        </div>
      </footer>

      <div className="fixed -bottom-48 -left-48 -z-10 h-96 w-96 animate-pulse rounded-full bg-primary/5 blur-[120px]" />
      <div className="fixed -right-48 top-1/4 -z-10 h-96 w-96 rounded-full bg-tertiary/5 blur-[120px]" />
      <div className="fixed -top-48 left-1/2 -z-10 h-96 w-full max-w-4xl -translate-x-1/2 rounded-full bg-primary/[0.03] blur-[150px]" />
    </div>
  )
}
