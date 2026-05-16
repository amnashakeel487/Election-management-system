import { ElectionDetailsPage } from '@/pages/ElectionDetailsPage'

/**
 * Voter entry point from QR / invite links (`/elections/:id/join`).
 * Reuses the public election details + registration flow.
 */
export function ElectionJoinPage() {
  return <ElectionDetailsPage />
}
