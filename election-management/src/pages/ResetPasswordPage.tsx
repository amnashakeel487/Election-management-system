import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { updatePassword } from '@/services/authService'

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      await updatePassword(password)
      navigate('/login', { replace: true, state: { message: 'Password updated. Please sign in.' } })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update password')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout>
      <div className="glass-card mx-auto max-w-md rounded-[32px] p-lg md:p-xl">
        <h2 className="mb-xs font-headline-lg text-headline-lg text-on-surface">Set New Password</h2>
        <p className="mb-lg font-body-sm text-body-sm text-on-surface-variant">
          Choose a new password (minimum 8 characters).
        </p>

        {error ? (
          <p className="mb-md rounded-xl border border-error/30 bg-error-container/20 px-md py-sm font-body-sm text-error">
            {error}
          </p>
        ) : null}

        <form className="flex flex-col gap-md" onSubmit={handleSubmit}>
          <input
            type="password"
            required
            minLength={8}
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border-outline-variant bg-surface-container-lowest px-md py-md text-on-surface outline-none focus:border-primary"
          />
          <input
            type="password"
            required
            minLength={8}
            placeholder="Confirm password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full rounded-xl border-outline-variant bg-surface-container-lowest px-md py-md text-on-surface outline-none focus:border-primary"
          />
          <button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-primary py-md font-headline-md text-on-primary disabled:opacity-60"
          >
            {submitting ? 'Saving…' : 'Update Password'}
          </button>
        </form>

        <Link to="/login" className="mt-lg block text-center font-label-md text-primary hover:underline">
          Back to login
        </Link>
      </div>
    </AuthLayout>
  )
}
