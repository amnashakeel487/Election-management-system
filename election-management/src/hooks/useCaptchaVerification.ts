import { useCallback, useState } from 'react'
import { turnstileConfigured, verifyCaptchaToken } from '@/services/securityService'

export function useCaptchaVerification() {
  const [botChecked, setBotChecked] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)

  const validateBeforeSubmit = useCallback(async (): Promise<boolean> => {
    if (turnstileConfigured) {
      if (!captchaToken) return false
      const result = await verifyCaptchaToken(captchaToken, 'auth')
      return result.ok
    }
    return botChecked
  }, [botChecked, captchaToken])

  const getTokenForServer = useCallback((): string => {
    if (turnstileConfigured && captchaToken) return captchaToken
    return 'checkbox-fallback'
  }, [captchaToken])

  const captchaErrorMessage = turnstileConfigured
    ? 'Complete the CAPTCHA verification.'
    : 'Please confirm you are not a bot.'

  return {
    botChecked,
    setBotChecked,
    captchaToken,
    setCaptchaToken,
    validateBeforeSubmit,
    getTokenForServer,
    captchaErrorMessage,
    turnstileConfigured,
  }
}
