import { useContext } from 'react'
import { VoterDashboardContext } from '@/context/VoterDashboardContext'

export function useVoterDashboard() {
  const ctx = useContext(VoterDashboardContext)
  if (!ctx) {
    throw new Error('useVoterDashboard must be used within VoterDashboardProvider')
  }
  return ctx
}
