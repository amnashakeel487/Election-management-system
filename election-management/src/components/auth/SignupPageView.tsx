import { useCallback, useMemo, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { parseOrThrow, signUpSchema } from '@/lib/validation/schemas'
import { TurnstileCaptcha } from '@/components/security/TurnstileCaptcha'
import { turnstileConfigured, verifyCaptchaToken } from '@/services/securityService'
import type { RegisterableRole } from '@/types/auth'
import { AuthSplitChrome } from './AuthSplitChrome'

function passwordStrength(password: string): { score: number; label: string; cls: '' | 'w' | 'm' | 's' } {
  if (!password.trim()) return { score: 0, label: 'Enter a password to check strength', cls: '' }
  let score = 0
  if (password.length >= 8) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++
  if (score <= 1) return { score, label: 'Weak — add uppercase & numbers', cls: 'w' }
  if (score <= 2) return { score, label: 'Medium — add symbols to improve', cls: 'm' }
  return { score, label: 'Strong password — great!', cls: 's' }
}

export function SignupPageView() {
  const navigate = useNavigate()
  const location = useLocation()
  const { signUp } = useAuth()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [phone, setPhone] = useState('')
  const [organization, setOrganization] = useState('')
  const [electionPurpose, setElectionPurpose] = useState('')
  const [role, setRole] = useState<RegisterableRole>('voter')
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [botChecked, setBotChecked] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pw = useMemo(() => passwordStrength(password), [password])

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault()
      setError(null)

      if (!termsAccepted) {
        setError('Please accept the Terms of Service and Privacy Policy.')
        return
      }
      const captchaOk = turnstileConfigured
        ? Boolean(captchaToken) && (await verifyCaptchaToken(captchaToken!, 'signup')).ok
        : botChecked
      if (!captchaOk) {
        setError(
          turnstileConfigured ? 'Complete the CAPTCHA verification.' : 'Please confirm you are not a bot.',
        )
        return
      }
      if (!turnstileConfigured) {
        await verifyCaptchaToken('checkbox-fallback', 'signup')
      }
      if (!firstName.trim() || !lastName.trim()) {
        setError('First and last name are required.')
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
      if (password !== confirmPassword) {
        setError('Passwords do not match.')
        return
      }

      const full_name = `${firstName.trim()} ${lastName.trim()}`.trim()
      parseOrThrow(signUpSchema, {
        email,
        password,
        full_name,
        phone,
        organization: organization.trim() || undefined,
        election_purpose: role === 'election_creator' ? electionPurpose.trim() : undefined,
      })

      setSubmitting(true)
      try {
        await signUp({
          email: email.trim(),
          password,
          role,
          full_name,
          phone: phone.trim(),
          organization: organization.trim() || undefined,
          election_purpose: role === 'election_creator' ? electionPurpose.trim() : undefined,
        })
        navigate('/verify-email', { replace: true, state: { email: email.trim() } })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Registration failed'
        const lower = message.toLowerCase()
        if (lower.includes('rate limit') || lower.includes('email rate')) {
          setError(
            'Email sending limit reached. Configure SMTP in Supabase (see docs/AUTH_SETUP.md), wait, then try again.',
          )
        } else if (lower.includes('confirmation email') || lower.includes('sending email')) {
          setError(
            'Could not send verification email. Check Supabase Auth → SMTP and sender settings. See docs/AUTH_SETUP.md.',
          )
        } else {
          setError(message)
        }
      } finally {
        setSubmitting(false)
      }
    },
    [
      termsAccepted,
      botChecked,
      captchaToken,
      firstName,
      lastName,
      phone,
      role,
      electionPurpose,
      password,
      confirmPassword,
      email,
      organization,
      signUp,
      navigate,
    ],
  )

  const flashMessage = (location.state as { message?: string } | null)?.message

  return (
    <AuthSplitChrome variant="register">
      <div className="sp-form-card sp-form-card--register">
        <div className="sp-form-card-header sp-form-card-header--compact relative overflow-hidden bg-gradient-to-br from-[#0F2347] via-[#1B3A6B] to-[#2D1B69]">
              <div className="pointer-events-none absolute -right-10 -top-16 h-[180px] w-[180px] rounded-full bg-purple-500/30 blur-[30px]" />
              <div className="pointer-events-none absolute bottom-[-40px] left-5 h-[120px] w-[120px] rounded-full bg-cyan-400/20 blur-[30px]" />
              <div className="relative z-[1]">
                <div className="mb-5 flex rounded-[10px] bg-black/20 p-1">
                  <Link
                    to="/login"
                    className="flex-1 rounded-lg py-2 text-center text-[13px] font-semibold text-white/45 transition-all hover:text-white/80"
                  >
                    Sign in
                  </Link>
                  <span className="flex-1 rounded-lg bg-white/[0.14] py-2 text-center text-[13px] font-semibold text-white shadow-md">
                    Create account
                  </span>
                </div>
                <h2 className="mb-1 text-[22px] font-extrabold tracking-tight text-white">Create your account</h2>
                <p className="text-[13px] text-white/50">Join FortressVote — verify your email after signup.</p>
                <div className="sp-form-stepper mt-2.5">
                  <div className="flex gap-1">
                    <div className="h-0.5 flex-1 overflow-hidden rounded-sm bg-white/15">
                      <div className="h-full w-full rounded-sm bg-cyan-400" />
                    </div>
                    <div className="h-0.5 flex-1 overflow-hidden rounded-sm bg-white/15">
                      <div className="h-full w-[60%] rounded-sm bg-cyan-400" />
                    </div>
                    <div className="h-0.5 flex-1 overflow-hidden rounded-sm bg-white/15">
                      <div className="h-0 w-full rounded-sm bg-cyan-400" />
                    </div>
                  </div>
                  <div className="mt-1.5 flex justify-between text-[9px] font-semibold uppercase tracking-wide text-white/30">
                    <span className="text-cyan-400">Account</span>
                    <span className="text-cyan-400">Details</span>
                    <span>Verify</span>
                  </div>
                </div>
              </div>
            </div>

        <div className="sp-form-card-scroll">
            <form onSubmit={handleSubmit}>
              {flashMessage ? (
                <p className="mb-4 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-3 py-2 text-center text-[13px] text-slate-700">
                  {flashMessage}
                </p>
              ) : null}
              {error ? (
                <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-center text-[13px] text-red-700">
                  {error}
                </p>
              ) : null}

              <div className="sp-form-social sp-mb-section grid grid-cols-2 gap-2">
                <button
                  type="button"
                  className="flex items-center justify-center gap-2 rounded-[11px] border-[1.5px] border-[#E2E8F0] bg-white py-2.5 text-[12px] font-semibold text-slate-500 transition-all hover:-translate-y-px hover:border-[#2451A3] hover:bg-[#F0F4F9] hover:text-[#1B3A6B]"
                  disabled
                  title="Coming soon"
                >
                  <span className="flex h-[18px] w-[18px] items-center justify-center rounded bg-[#E8F0FE] text-[12px] font-black text-[#1a73e8]">
                    G
                  </span>
                  Google
                </button>
                <button
                  type="button"
                  className="flex items-center justify-center gap-2 rounded-[11px] border-[1.5px] border-[#E2E8F0] bg-white py-2.5 text-[12px] font-semibold text-slate-500 transition-all hover:-translate-y-px hover:border-[#2451A3] hover:bg-[#F0F4F9] hover:text-[#1B3A6B]"
                  disabled
                  title="Coming soon"
                >
                  <span className="flex h-[18px] w-[18px] items-center justify-center rounded bg-[#E7F3FF] text-[#0A66C2]">in</span>
                  LinkedIn
                </button>
              </div>

              <div className="sp-form-divider sp-mb-section flex items-center gap-2">
                <div className="h-px flex-1 bg-[#E2E8F0]" />
                <span className="text-[10px] font-medium text-slate-400">or email</span>
                <div className="h-px flex-1 bg-[#E2E8F0]" />
              </div>

              <div className="mb-3.5 grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.07em] text-slate-500">
                    <span className="material-symbols-outlined text-[12px] text-slate-400">person</span>
                    First name
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <span className="material-symbols-outlined text-[15px]">person</span>
                    </span>
                    <input
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Jane"
                      className="w-full rounded-[10px] border-[1.5px] border-[#E2E8F0] bg-white py-2.5 pl-9 pr-3 text-[13px] text-slate-900 outline-none transition-all placeholder:text-slate-300 focus:border-[#2451A3] focus:shadow-[0_0_0_3px_rgba(36,81,163,0.1)]"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.07em] text-slate-500">
                    <span className="material-symbols-outlined text-[12px] text-slate-400">person</span>
                    Last name
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <span className="material-symbols-outlined text-[15px]">person</span>
                    </span>
                    <input
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Doe"
                      className="w-full rounded-[10px] border-[1.5px] border-[#E2E8F0] bg-white py-2.5 pl-9 pr-3 text-[13px] text-slate-900 outline-none transition-all placeholder:text-slate-300 focus:border-[#2451A3] focus:shadow-[0_0_0_3px_rgba(36,81,163,0.1)]"
                    />
                  </div>
                </div>
              </div>

              <div className="mb-3.5">
                <label className="mb-1.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.07em] text-slate-500">
                  <span className="material-symbols-outlined text-[12px] text-slate-400">mail</span>
                  Email address
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <span className="material-symbols-outlined text-[15px]">mail</span>
                  </span>
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@organisation.com"
                    className="w-full rounded-[10px] border-[1.5px] border-[#E2E8F0] bg-white py-2.5 pl-9 pr-3 text-[13px] text-slate-900 outline-none transition-all placeholder:text-slate-300 focus:border-[#2451A3] focus:shadow-[0_0_0_3px_rgba(36,81,163,0.1)]"
                  />
                </div>
              </div>

              <div className="mb-3.5">
                <label className="mb-1.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.07em] text-slate-500">
                  <span className="material-symbols-outlined text-[12px] text-slate-400">lock</span>
                  Password
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <span className="material-symbols-outlined text-[15px]">lock</span>
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    className="w-full rounded-[10px] border-[1.5px] border-[#E2E8F0] bg-white py-2.5 pl-9 pr-10 text-[13px] text-slate-900 outline-none transition-all placeholder:text-slate-300 focus:border-[#2451A3] focus:shadow-[0_0_0_3px_rgba(36,81,163,0.1)]"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <span className="material-symbols-outlined text-[18px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
                <div className="mt-1.5">
                  <div className="flex gap-0.5">
                    {[0, 1, 2, 3].map((i) => (
                      <div key={i} className="h-0.5 flex-1 overflow-hidden rounded-sm bg-[#E2E8F0]">
                        <div
                          className={`h-full rounded-sm transition-colors ${
                            i < pw.score
                              ? pw.cls === 'w'
                                ? 'w-full bg-red-500'
                                : pw.cls === 'm'
                                  ? 'w-full bg-amber-500'
                                  : 'w-full bg-emerald-500'
                              : 'w-0'
                          }`}
                        />
                      </div>
                    ))}
                  </div>
                  <p
                    className={`mt-1 text-[10px] ${
                      pw.cls === 'w' ? 'text-red-500' : pw.cls === 'm' ? 'text-amber-600' : pw.cls === 's' ? 'text-emerald-600' : 'text-slate-400'
                    }`}
                  >
                    {pw.label}
                  </p>
                </div>
              </div>

              <div className="mb-3.5">
                <label className="mb-1.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.07em] text-slate-500">
                  <span className="material-symbols-outlined text-[12px] text-slate-400">lock</span>
                  Confirm password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat password"
                  className="w-full rounded-[10px] border-[1.5px] border-[#E2E8F0] bg-white py-2.5 px-3 text-[13px] text-slate-900 outline-none transition-all placeholder:text-slate-300 focus:border-[#2451A3] focus:shadow-[0_0_0_3px_rgba(36,81,163,0.1)]"
                />
              </div>

              <div className="mb-3.5">
                <label className="mb-1.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.07em] text-slate-500">
                  <span className="material-symbols-outlined text-[12px] text-slate-400">call</span>
                  Phone number
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 …"
                  className="w-full rounded-[10px] border-[1.5px] border-[#E2E8F0] bg-white py-2.5 px-3 text-[13px] text-slate-900 outline-none transition-all placeholder:text-slate-300 focus:border-[#2451A3] focus:shadow-[0_0_0_3px_rgba(36,81,163,0.1)]"
                />
              </div>

              {role === 'election_creator' ? (
                <div className="mb-3.5 space-y-3">
                  <div>
                    <label className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.07em] text-slate-500">Organization</label>
                    <input
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                      placeholder="Company or institution"
                      className="w-full rounded-[10px] border-[1.5px] border-[#E2E8F0] bg-white py-2.5 px-3 text-[13px] text-slate-900 outline-none focus:border-[#2451A3] focus:shadow-[0_0_0_3px_rgba(36,81,163,0.1)]"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.07em] text-slate-500">Election purpose</label>
                    <textarea
                      required
                      rows={2}
                      value={electionPurpose}
                      onChange={(e) => setElectionPurpose(e.target.value)}
                      placeholder="Describe how you plan to use FortressVote"
                      className="w-full resize-none rounded-[10px] border-[1.5px] border-[#E2E8F0] bg-white px-3 py-2.5 text-[13px] text-slate-900 outline-none focus:border-[#2451A3] focus:shadow-[0_0_0_3px_rgba(36,81,163,0.1)]"
                    />
                  </div>
                </div>
              ) : null}

              <div className="mb-2">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.07em] text-slate-500">I am signing up as</p>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      { value: 'voter' as const, title: 'Voter', sub: 'Participate', icon: 'groups' },
                      {
                        value: 'election_creator' as const,
                        title: 'Creator',
                        sub: 'Run elections',
                        icon: 'edit_square',
                      },
                    ] as const
                  ).map((opt) => {
                    const sel = role === opt.value
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setRole(opt.value)}
                        className={`rounded-[11px] border-[1.5px] px-2 py-3 text-center transition-all hover:-translate-y-0.5 hover:border-[#2451A3] hover:shadow-[0_6px_20px_rgba(36,81,163,0.12)] ${
                          sel
                            ? 'border-[#1B3A6B] bg-gradient-to-br from-[#EFF4FF] to-[#F5F0FF]'
                            : 'border-[#E2E8F0] bg-white'
                        }`}
                      >
                        <div
                          className={`mx-auto mb-2 flex h-[34px] w-[34px] items-center justify-center rounded-md border ${
                            sel ? 'border-blue-200 bg-blue-100 text-[#2451A3]' : 'border-[#E2E8F0] bg-slate-50 text-slate-400'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[17px]">{opt.icon}</span>
                        </div>
                        <div className={`text-[12px] font-bold ${sel ? 'text-[#1B3A6B]' : 'text-slate-500'}`}>{opt.title}</div>
                        <div className="mt-0.5 text-[10px] text-slate-300">{opt.sub}</div>
                      </button>
                    )
                  })}
                </div>
                <p className="mt-2 text-[10px] text-slate-400">Super Admin accounts are created by the platform operator.</p>
              </div>

              <label className="mb-4 flex cursor-pointer items-start gap-2.5">
                <input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-[#2451A3] text-[#2451A3] accent-[#2451A3]" />
                <span className="text-[11px] leading-relaxed text-slate-400">
                  I agree to the{' '}
                  <a href="#" className="font-semibold text-[#2451A3] no-underline hover:underline">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="#" className="font-semibold text-[#2451A3] no-underline hover:underline">
                    Privacy Policy
                  </a>
                  .
                </span>
              </label>

              {turnstileConfigured ? (
                <div className="mb-5 flex justify-center rounded-xl border border-[#E2E8F0] bg-slate-50/80 px-3 py-3">
                  <TurnstileCaptcha onToken={setCaptchaToken} theme="light" />
                </div>
              ) : (
                <label className="mb-5 flex cursor-pointer items-center gap-2.5 rounded-xl border border-[#E2E8F0] bg-slate-50/80 px-3 py-2.5">
                  <input type="checkbox" checked={botChecked} onChange={(e) => setBotChecked(e.target.checked)} className="h-4 w-4 accent-[#2451A3]" />
                  <span className="text-[12px] font-medium text-slate-600">I am not a bot</span>
                </label>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl border-0 bg-gradient-to-br from-[#1B3A6B] to-[#6C3FC5] py-3.5 text-[14px] font-bold tracking-wide text-white transition-all hover:-translate-y-0.5 hover:shadow-[0_14px_36px_rgba(27,58,107,0.45)] active:translate-y-0 disabled:opacity-60"
              >
                <span className="sp-submit-shimmer" />
                <span className="material-symbols-outlined text-[18px]">lock</span>
                {submitting ? 'Creating account…' : 'Create secure account'}
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>

              <p className="mt-3.5 text-center text-[12px] text-slate-400">
                Already have an account?{' '}
                <Link to="/login" className="font-bold text-[#2451A3] no-underline hover:underline">
                  Sign in instead
                </Link>
              </p>
            </form>
        </div>

        <div className="sp-form-card-footer flex flex-wrap justify-center gap-3">
              {[
                { icon: 'lock', label: 'SSL secured' },
                { icon: 'shield', label: 'Role-based access' },
                { icon: 'verified', label: 'Email verification' },
              ].map((c) => (
                <div key={c.label} className="flex items-center gap-1.5 text-[10px] font-semibold tracking-wide text-slate-400">
                  <span className="material-symbols-outlined text-[12px] text-emerald-500">{c.icon}</span>
                  {c.label}
                </div>
              ))}
            </div>
          </div>
    </AuthSplitChrome>
  )
}
