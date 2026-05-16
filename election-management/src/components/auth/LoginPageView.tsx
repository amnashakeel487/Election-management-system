import { useCallback, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AUTH_CAPTCHA_LOGO } from '@/constants/authAssets'
import { useAuth } from '@/hooks/useAuth'
import { AuthSplitChrome } from './AuthSplitChrome'

export function LoginPageView() {
  const navigate = useNavigate()
  const location = useLocation()
  const { signIn } = useAuth()
  const returnTo = (location.state as { from?: string; message?: string } | null)?.from
  const flashMessage = (location.state as { message?: string } | null)?.message

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [botChecked, setBotChecked] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault()
      setError(null)

      if (!botChecked) {
        setError('Please confirm you are not a bot.')
        return
      }

      setSubmitting(true)
      try {
        const dashboardPath = await signIn({ email: email.trim(), password })
        navigate(returnTo ?? dashboardPath, { replace: true })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Sign in failed'
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
    [botChecked, email, password, signIn, navigate, returnTo],
  )

  return (
    <AuthSplitChrome variant="login">
      <div className="sp-form-card">
        <div className="relative overflow-hidden bg-gradient-to-br from-[#0F2347] via-[#1B3A6B] to-[#2D1B69] px-8 pb-6 pt-7">
          <div className="pointer-events-none absolute -right-10 -top-16 h-[180px] w-[180px] rounded-full bg-purple-500/30 blur-[30px]" />
          <div className="pointer-events-none absolute bottom-[-40px] left-5 h-[120px] w-[120px] rounded-full bg-cyan-400/20 blur-[30px]" />
          <div className="relative z-[1]">
            <div className="mb-5 flex rounded-[10px] bg-black/20 p-1">
              <span className="flex-1 rounded-lg bg-white/[0.14] py-2 text-center text-[13px] font-semibold text-white shadow-md">
                Sign in
              </span>
              <Link
                to="/register"
                className="flex-1 rounded-lg py-2 text-center text-[13px] font-semibold text-white/45 transition-all hover:text-white/80"
              >
                Create account
              </Link>
            </div>
            <h2 className="mb-1 text-[22px] font-extrabold tracking-tight text-white">Welcome back</h2>
            <p className="text-[13px] text-white/50">Sign in with your email and password to continue.</p>
            <div className="mt-5">
              <div className="flex gap-1">
                <div className="h-0.5 flex-1 overflow-hidden rounded-sm bg-white/15">
                  <div className="h-full w-full rounded-sm bg-cyan-400" />
                </div>
                <div className="h-0.5 flex-1 overflow-hidden rounded-sm bg-white/15">
                  <div className="h-full w-[40%] rounded-sm bg-cyan-400" />
                </div>
              </div>
              <div className="mt-1.5 flex justify-between text-[9px] font-semibold uppercase tracking-wide text-white/30">
                <span className="text-cyan-400">Credentials</span>
                <span>Dashboard</span>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-8 pb-6 pt-7">
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

          <div className="mb-5 grid grid-cols-2 gap-2.5">
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

          <div className="mb-5 flex items-center gap-2.5">
            <div className="h-px flex-1 bg-[#E2E8F0]" />
            <span className="text-[11px] font-medium text-slate-400">or continue with email</span>
            <div className="h-px flex-1 bg-[#E2E8F0]" />
          </div>

          <p className="mb-4 rounded-xl border border-[#E2E8F0] bg-slate-50/90 px-3 py-2.5 text-[12px] leading-relaxed text-slate-600">
            Use the email and password for your account. Your dashboard (Voter, Creator, or Admin) is set when you
            register.
          </p>

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
            <div className="mb-1.5 flex items-center justify-between">
              <label className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.07em] text-slate-500">
                <span className="material-symbols-outlined text-[12px] text-slate-400">lock</span>
                Password
              </label>
              <Link to="/forgot-password" className="text-[11px] font-bold text-[#2451A3] no-underline hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <span className="material-symbols-outlined text-[15px]">lock</span>
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
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
          </div>

          <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-[#E2E8F0] bg-slate-50/80 px-3 py-2.5">
            <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5">
              <input
                type="checkbox"
                checked={botChecked}
                onChange={(e) => setBotChecked(e.target.checked)}
                className="h-4 w-4 shrink-0 accent-[#2451A3]"
              />
              <span className="text-[12px] font-medium text-slate-600">I am not a bot</span>
            </label>
            <div className="flex shrink-0 flex-col items-center">
              <img className="mb-0.5 h-7 w-7 opacity-70" alt="" src={AUTH_CAPTCHA_LOGO} />
              <span className="text-[8px] font-semibold uppercase tracking-tighter text-slate-400">FortressGuard</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl border-0 bg-gradient-to-br from-[#1B3A6B] to-[#6C3FC5] py-3.5 text-[14px] font-bold tracking-wide text-white transition-all hover:-translate-y-0.5 hover:shadow-[0_14px_36px_rgba(27,58,107,0.45)] active:translate-y-0 disabled:opacity-60"
          >
            <span className="sp-submit-shimmer" />
            <span className="material-symbols-outlined text-[18px]">login</span>
            {submitting ? 'Signing in…' : 'Secure sign in'}
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>

          <p className="mt-3.5 text-center text-[12px] text-slate-400">
            New here?{' '}
            <Link to="/register" className="font-bold text-[#2451A3] no-underline hover:underline">
              Create an account
            </Link>
          </p>
        </form>

        <div className="flex flex-wrap justify-center gap-3.5 border-t border-[#E2E8F0] px-8 py-3">
          {[
            { icon: 'lock', label: 'SSL secured' },
            { icon: 'shield', label: 'Role-based access' },
            { icon: 'verified', label: 'MFA optional' },
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
