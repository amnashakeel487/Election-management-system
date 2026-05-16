import { AUTH_CAPTCHA_LOGO } from '@/constants/authAssets'
import { turnstileConfigured } from '@/services/securityService'
import { TurnstileCaptcha } from './TurnstileCaptcha'

interface CaptchaGateProps {
  botChecked: boolean
  onBotCheckedChange: (checked: boolean) => void
  captchaToken: string | null
  onCaptchaToken: (token: string | null) => void
}

/** Turnstile when configured; otherwise checkbox fallback (validated server-side). */
export function CaptchaGate({
  botChecked,
  onBotCheckedChange,
  captchaToken,
  onCaptchaToken,
}: CaptchaGateProps) {
  if (turnstileConfigured) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-outline-variant/50 bg-surface-container-highest/30 p-md">
        <TurnstileCaptcha onToken={onCaptchaToken} />
        {!captchaToken ? (
          <span className="font-body-sm text-body-sm text-on-surface-variant">Complete the CAPTCHA to continue</span>
        ) : null}
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between rounded-xl border border-outline-variant/50 bg-surface-container-highest/30 p-md">
      <label className="flex cursor-pointer items-center gap-md">
        <input
          type="checkbox"
          checked={botChecked}
          onChange={(e) => onBotCheckedChange(e.target.checked)}
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
  )
}
