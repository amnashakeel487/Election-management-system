import { useCallback, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'
import { isRoleMismatchError } from '@/lib/errors/roleMismatch'
import { parseOrThrow, signInSchema } from '@/lib/validation/schemas'
import { TurnstileCaptcha } from '@/components/security/TurnstileCaptcha'
import { turnstileConfigured, verifyCaptchaToken } from '@/services/securityService'
import { safeReturnPathForRole } from '@/utils/safeReturnPath'
import { AuthSplitChrome } from './AuthSplitChrome'
import { AUTH_CAPTCHA_LOGO } from '@/constants/authAssets'

const inputClass =
  'sp-input w-full rounded-[10px] border-[1.5px] border-[#E2E8F0] bg-white pl-9 pr-3 text-[13px] text-slate-900 outline-none transition-all placeholder:text-slate-300 focus:border-[#2451A3] focus:shadow-[0_0_0_3px_rgba(36,81,163,0.1)]'

export function AdminLoginPageView() {
  const { t } = useTranslation('auth')
  const navigate = useNavigate()
  const location = useLocation()
  const { signIn } = useAuth()
  const returnTo = (location.state as { from?: string } | null)?.from
  const flashMessage = (location.state as { message?: string } | null)?.message

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [botChecked, setBotChecked] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const footerItems = [
    { icon: 'lock', label: t('loginForm.footerSsl') },
    { icon: 'shield', label: t('adminLogin.footerRestricted') },
    { icon: 'verified', label: t('loginForm.footerMfa') },
  ]

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault()
      setError(null)

      try {
        const credentials = parseOrThrow(signInSchema, { email, password })
        const captchaOk = turnstileConfigured
          ? Boolean(captchaToken) && (await verifyCaptchaToken(captchaToken!, 'login')).ok
          : botChecked
        if (!captchaOk) {
          setError(turnstileConfigured ? t('captchaRequired') : t('botConfirm'))
          return
        }
        if (!turnstileConfigured) {
          await verifyCaptchaToken('checkbox-fallback', 'login')
        }

        setSubmitting(true)
        const dashboardPath = await signIn({ ...credentials, loginAsRole: 'admin' })
        navigate(safeReturnPathForRole(returnTo ?? dashboardPath, 'admin'), { replace: true })
      } catch (err) {
        if (isRoleMismatchError(err)) {
          setError(t('adminLogin.notAdminAccount'))
          return
        }
        const message = err instanceof Error ? err.message : t('signInFailed')
        const lower = message.toLowerCase()
        if (lower.includes('rate limit') || lower.includes('email rate')) {
          setError(t('errors.rateLimit'))
        } else if (lower.includes('confirmation email') || lower.includes('sending email')) {
          setError(t('errors.emailSend'))
        } else {
          setError(message)
        }
      } finally {
        setSubmitting(false)
      }
    },
    [botChecked, captchaToken, email, password, signIn, navigate, returnTo, t],
  )

  return (
    <AuthSplitChrome variant="login">
      <div className="sp-form-card">
        <div className="sp-form-card-header sp-form-card-header--compact relative overflow-hidden bg-gradient-to-br from-[#1a0a2e] via-[#2D1B69] to-[#0F2347]">
          <div className="pointer-events-none absolute -right-10 -top-16 h-[100px] w-[100px] rounded-full bg-amber-500/20 blur-[30px]" />
          <div className="relative z-[1]">
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-200">
              <span className="material-symbols-outlined text-[14px]">admin_panel_settings</span>
              {t('adminLogin.badge')}
            </div>
            <h2 className="mb-0.5 text-lg font-extrabold tracking-tight text-white">{t('adminLogin.title')}</h2>
            <p className="text-[12px] text-white/50">{t('adminLogin.subtitle')}</p>
          </div>
        </div>

        <div className="sp-form-card-scroll">
          <form onSubmit={handleSubmit}>
            {flashMessage ? (
              <p className="sp-mb-section rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-3 py-1.5 text-center text-[12px] text-slate-700">
                {flashMessage}
              </p>
            ) : null}
            {error ? (
              <p className="sp-mb-section rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-center text-[12px] text-red-700">
                {error}
              </p>
            ) : null}

            <p className="sp-form-hint sp-mb-section rounded-lg border border-amber-200/80 bg-amber-50/90 px-2.5 py-1.5 text-[11px] leading-snug text-amber-950">
              {t('adminLogin.hint')}
            </p>

            <div className="sp-mb-field">
              <label className="sp-label flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.07em] text-slate-500">
                {t('loginForm.emailLabel')}
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <span className="material-symbols-outlined text-[14px]">mail</span>
                </span>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('loginForm.emailPlaceholder')}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="sp-mb-field">
              <div className="sp-label mb-0.5 flex items-center justify-between">
                <label className="text-[10px] font-bold uppercase tracking-[0.07em] text-slate-500">
                  {t('loginForm.passwordLabel')}
                </label>
                <Link to="/forgot-password" className="text-[10px] font-bold text-[#2451A3] no-underline hover:underline">
                  {t('loginForm.forgotShort')}
                </Link>
              </div>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <span className="material-symbols-outlined text-[14px]">lock</span>
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`${inputClass} pr-9`}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? t('hidePassword') : t('showPassword')}
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {turnstileConfigured ? (
              <div className="sp-mb-section flex justify-center rounded-lg border border-[#E2E8F0] bg-slate-50/80 px-2.5 py-3">
                <TurnstileCaptcha onToken={setCaptchaToken} theme="light" />
              </div>
            ) : (
              <label className="sp-mb-section flex cursor-pointer items-center justify-between gap-2 rounded-lg border border-[#E2E8F0] bg-slate-50/80 px-2.5 py-2">
                <span className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={botChecked}
                    onChange={(e) => setBotChecked(e.target.checked)}
                    className="h-3.5 w-3.5 accent-[#2451A3]"
                  />
                  <span className="text-[11px] font-medium text-slate-600">{t('loginForm.notBot')}</span>
                </span>
                <img className="h-6 w-6 opacity-70" alt="" src={AUTH_CAPTCHA_LOGO} />
              </label>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="sp-btn-submit relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl border-0 bg-gradient-to-br from-[#1a0a2e] to-[#6C3FC5] py-3 text-[13px] font-bold text-white transition-all hover:-translate-y-0.5 disabled:opacity-60"
            >
              <span className="sp-submit-shimmer" />
              <span className="material-symbols-outlined text-[16px]">admin_panel_settings</span>
              {submitting ? t('signingIn') : t('adminLogin.submit')}
            </button>

            <p className="mt-3 text-center text-[11px] text-slate-400">
              <Link to="/login" className="font-bold text-[#2451A3] no-underline hover:underline">
                {t('adminLogin.backToPublicLogin')}
              </Link>
            </p>
          </form>
        </div>

        <div className="sp-form-card-footer flex flex-wrap justify-center gap-3">
          {footerItems.map((c) => (
            <div key={c.label} className="flex items-center gap-1 text-[9px] font-semibold text-slate-400">
              <span className="material-symbols-outlined text-[11px] text-emerald-500">{c.icon}</span>
              {c.label}
            </div>
          ))}
        </div>
      </div>
    </AuthSplitChrome>
  )
}

