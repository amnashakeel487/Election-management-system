import { useTranslation } from 'react-i18next'
import { waitlistUserMessage } from '@/utils/waitlistDisplay'

export function useWaitlistMessage() {
  const { t } = useTranslation('waitlist')
  return (position: number | null | undefined) => waitlistUserMessage(position, t)
}
