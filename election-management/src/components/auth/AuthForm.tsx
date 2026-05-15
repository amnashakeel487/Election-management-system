import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AUTH_CAPTCHA_LOGO } from '@/constants/authAssets'
import { useAuth } from '@/hooks/useAuth'
import type { UserRole } from '@/types/auth'
import { RoleSelector } from './RoleSelector'

export type AuthFormMode = 'login' | 'register'

interface AuthFormProps {
  mode: AuthFormMode
}

export function AuthForm({ mode }: AuthFormProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { signIn, signUp } = useAuth()
  const returnTo = (location.state as { from?: string } | null)?.from

  const isLogin = mode === 'login'
  const [role, setRole] = useState<UserRole>('voter')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [organization, setOrganization] = useState('')
  const [electionPurpose, setElectionPurpose] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [botChecked, setBotChecked] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!botChecked) {
      setError('Please confirm you are not a bot.')
      return
    }

    if (!isLogin) {
      if (!fullName.trim()) {
        setError('Full name is required.')
        return
      }
      if (!phone.trim()) {
        setError('Phone number is required.')
        return
      }
      if (role === 'election_creator' && !electionPurpose.trim()) {
        setError('Election purpose is required for creator registration.')
        return
      }
    }

    setSubmitting(true)

    try {
      if (isLogin) {
        const dashboardPath = await signIn({ email, password })
        navigate(returnTo ?? dashboardPath, { replace: true })
      } else {
        await signUp({
          email,
          password,
          role,
          full_name: fullName.trim(),
          phone: phone.trim(),
          organization: organization.trim() || undefined,
          election_purpose: role === 'election_creator' ? electionPurpose.trim() : undefined,
        })
        navigate('/verify-email', { replace: true, state: { email } })
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Authentication failed'
      const lower = message.toLowerCase()
      if (lower.includes('rate limit') || lower.includes('email rate')) {
        setError(
          'Email sending limit reached. Configure Resend SMTP in Supabase (see docs/AUTH_SETUP.md), wait about an hour, then try again once.',
        )
      } else if (lower.includes('confirmation email') || lower.includes('sending email')) {
        setError(
          'Could not send verification email. In Supabase SMTP: sender email must be plain onboarding@resend.dev (name in Sender name field), password = Resend API key. Check resend.com/emails for the failed attempt. See docs/AUTH_SETUP.md §6.',
        )
      } else {
        setError(message)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
  <>
      <div className="mb-lg text-center">
        <h1 className="mb-base font-headline-xl text-headline-xl tracking-tighter text-primary">FortressVote</h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Secure Democracy Through Cryptographic Integrity
        </p>
      </div>

      <div className="glass-card rounded-[32px] p-lg md:p-xl">
        <div className="flex flex-col gap-lg">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="mb-xs font-headline-lg text-headline-lg text-on-surface">
                {isLogin ? 'Welcome Back' : 'Create Secure Account'}
              </h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                {isLogin
                  ? 'Please enter your credentials to access the terminal.'
                  : 'Register your credentials to join the secure election platform.'}
              </p>
            </div>
            <div className="flex items-center gap-xs rounded-full border border-primary/20 bg-primary/10 px-sm py-[4px]">
              <span
                className="material-symbols-outlined text-[14px] text-primary"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                verified_user
              </span>
              <span className="font-label-sm text-label-sm uppercase tracking-widest text-primary">
                Secure Authentication
              </span>
            </div>
          </div>

          {error ? (
            <p className="rounded-xl border border-error/30 bg-error-container/20 px-md py-sm font-body-sm text-body-sm text-error">
              {error}
            </p>
          ) : null}

          <form className="flex flex-col gap-md" onSubmit={handleSubmit}>
            {!isLogin ? (
              <>
                <RoleSelector value={role} onChange={setRole} disabled={submitting} />
                <div className="space-y-md">
                  <div className="space-y-sm">
                    <label className="ml-xs font-label-md text-label-md text-on-surface-variant" htmlFor="fullName">
                      Full Name
                    </label>
                    <input
                      id="fullName"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full rounded-xl border-outline-variant bg-surface-container-lowest px-md py-md text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div className="space-y-sm">
                    <label className="ml-xs font-label-md text-label-md text-on-surface-variant" htmlFor="phone">
                      Phone Number
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full rounded-xl border-outline-variant bg-surface-container-lowest px-md py-md text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  {role === 'election_creator' ? (
                    <>
                      <div className="space-y-sm">
                        <label className="ml-xs font-label-md text-label-md text-on-surface-variant" htmlFor="organization">
                          Organization
                        </label>
                        <input
                          id="organization"
                          value={organization}
                          onChange={(e) => setOrganization(e.target.value)}
                          className="w-full rounded-xl border-outline-variant bg-surface-container-lowest px-md py-md text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                      <div className="space-y-sm">
                        <label className="ml-xs font-label-md text-label-md text-on-surface-variant" htmlFor="purpose">
                          Election Purpose
                        </label>
                        <textarea
                          id="purpose"
                          required
                          rows={3}
                          value={electionPurpose}
                          onChange={(e) => setElectionPurpose(e.target.value)}
                          className="w-full rounded-xl border-outline-variant bg-surface-container-lowest px-md py-md text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                    </>
                  ) : null}
                </div>
              </>
            ) : (
              <p className="rounded-xl border border-outline-variant/50 bg-surface-container-highest/30 px-md py-sm font-body-sm text-body-sm text-on-surface-variant">
                Sign in with the email and password for your account. Your dashboard (Voter, Creator, or Admin) is
                set when you register.
              </p>
            )}

            <div className="space-y-md">
              <div className="space-y-sm">
                <label className="ml-xs font-label-md text-label-md text-on-surface-variant" htmlFor="email">
                  Email Address
                </label>
                <div className="group relative">
                  <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-on-surface-variant transition-colors group-focus-within:text-primary">
                    mail
                  </span>
                  <input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@fortressvote.gov"
                    className="w-full rounded-xl border-outline-variant bg-surface-container-lowest py-md pl-[48px] pr-md text-on-surface outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="space-y-sm">
                <div className="ml-xs flex items-center justify-between">
                  <label className="font-label-md text-label-md text-on-surface-variant" htmlFor="password">
                    Password
                  </label>
                  {isLogin ? (
                    <Link
                      to="/forgot-password"
                      className="font-label-sm text-label-sm text-primary hover:underline"
                    >
                      Forgot Access?
                    </Link>
                  ) : null}
                </div>
                <div className="group relative">
                  <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-on-surface-variant transition-colors group-focus-within:text-primary">
                    lock
                  </span>
                  <input
                    id="password"
                    type="password"
                    required
                    minLength={8}
                    autoComplete={isLogin ? 'current-password' : 'new-password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full rounded-xl border-outline-variant bg-surface-container-lowest py-md pl-[48px] pr-md text-on-surface outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-outline-variant/50 bg-surface-container-highest/30 p-md">
              <label className="flex cursor-pointer items-center gap-md">
                <input
                  type="checkbox"
                  checked={botChecked}
                  onChange={(e) => setBotChecked(e.target.checked)}
                  className="h-5 w-5 accent-primary"
                />
                <span className="font-body-sm text-body-sm text-on-surface">I am not a bot</span>
              </label>
              <div className="flex flex-col items-center">
                <img className="mb-base h-8 w-8 opacity-70" alt="" src={AUTH_CAPTCHA_LOGO} />
                <span className="font-label-sm text-[8px] uppercase tracking-tighter text-on-surface-variant">
                  Powered by FortressGuard
                </span>
              </div>
            </div>

            <div className="mt-md flex flex-col gap-sm">
              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-sm rounded-xl bg-primary px-lg py-md font-headline-md text-headline-md text-on-primary transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
              >
                {isLogin ? 'Access Terminal' : 'Create Secure Account'}
                <span className="material-symbols-outlined text-md">{isLogin ? 'login' : 'person_add'}</span>
              </button>

              <div className="flex items-center gap-md py-sm">
                <div className="h-[1px] flex-grow bg-outline-variant" />
                <span className="font-label-sm text-label-sm text-on-surface-variant">
                  {isLogin ? 'New to the platform?' : 'Already registered?'}
                </span>
                <div className="h-[1px] flex-grow bg-outline-variant" />
              </div>

              {isLogin ? (
                <Link
                  to="/register"
                  className="w-full rounded-xl border border-outline bg-transparent px-lg py-md text-center font-headline-md text-headline-md text-on-surface transition-all hover:bg-surface-variant"
                >
                  Create Secure Account
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="w-full rounded-xl border border-outline bg-transparent px-lg py-md text-center font-headline-md text-headline-md text-on-surface transition-all hover:bg-surface-variant"
                >
                  Access Terminal
                </Link>
              )}
            </div>
          </form>
        </div>
      </div>

      <div className="mt-lg flex flex-col items-center justify-between gap-md px-md md:flex-row">
        <div className="flex gap-lg">
          <a className="font-label-sm text-label-sm text-on-surface-variant transition-colors hover:text-primary" href="#">
            Privacy Policy
          </a>
          <a className="font-label-sm text-label-sm text-on-surface-variant transition-colors hover:text-primary" href="#">
            Security Audit
          </a>
          <a className="font-label-sm text-label-sm text-on-surface-variant transition-colors hover:text-primary" href="#">
            Voter Rights
          </a>
        </div>
        <p className="font-label-sm text-label-sm text-on-surface-variant opacity-50">
          © 2024 FortressVote Secure Systems
        </p>
      </div>
    </>
  )
}



