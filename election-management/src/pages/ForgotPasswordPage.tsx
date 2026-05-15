import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { requestPasswordReset } from '@/services/authService'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await requestPasswordReset(email)
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send reset email')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout>
      <div className="glass-card mx-auto max-w-md rounded-[32px] p-lg md:p-xl">
        <h2 className="mb-xs font-headline-lg text-headline-lg text-on-surface">Reset Access</h2>
        <p className="mb-lg font-body-sm text-body-sm text-on-surface-variant">
          Enter your email and we will send a secure password reset link.
        </p>

        {error ? (
          <p className="mb-md rounded-xl border border-error/30 bg-error-container/20 px-md py-sm font-body-sm text-error">
            {error}
          </p>
        ) : null}

        {sent ? (
          <p className="mb-md rounded-xl border border-tertiary/30 bg-tertiary/10 px-md py-sm font-body-sm text-on-surface">
            If an account exists for {email}, you will receive a reset link shortly.
          </p>
        ) : (
          <form className="flex flex-col gap-md" onSubmit={handleSubmit}>
            <div className="space-y-sm">
              <label className="ml-xs font-label-md text-label-md text-on-surface-variant" htmlFor="email">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
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
              {submitting ? 'Sending…' : 'Send Reset Link'}
            </button>
          </form>
        )}

        <Link to="/login" className="mt-lg block text-center font-label-md text-primary hover:underline">
          Back to login
        </Link>
      </div>
    </AuthLayout>
  )
}
