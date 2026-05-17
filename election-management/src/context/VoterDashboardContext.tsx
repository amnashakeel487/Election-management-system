import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { fetchUserRegistrations } from '@/services/voterRegistrationService'
import type { VoterRegistrationWithElection } from '@/types/voterRegistration'
import { buildVoterNotifications } from '@/utils/voterNotifications'
import { canVote } from '@/utils/voterElectionUi'

export interface VoterDashboardContextValue {
  registrations: VoterRegistrationWithElection[]
  loading: boolean
  error: string | null
  reload: () => Promise<void>
  registered: VoterRegistrationWithElection[]
  waitlisted: VoterRegistrationWithElection[]
  votedCount: number
  liveVoteCount: number
  pendingVoteCount: number
  notificationCount: number
}

export const VoterDashboardContext = createContext<VoterDashboardContextValue | null>(null)

export function VoterDashboardProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth()
  const [registrations, setRegistrations] = useState<VoterRegistrationWithElection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    const userId = session?.user.id
    if (!userId) {
      setRegistrations([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const data = await fetchUserRegistrations(userId)
      setRegistrations(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load registrations')
      setRegistrations([])
    } finally {
      setLoading(false)
    }
  }, [session?.user.id])

  useEffect(() => {
    void reload()
  }, [reload])

  const registered = useMemo(
    () => registrations.filter((r) => r.status === 'registered'),
    [registrations],
  )
  const waitlisted = useMemo(
    () => registrations.filter((r) => r.status === 'waitlisted'),
    [registrations],
  )

  const votedCount = useMemo(() => registered.filter((r) => r.voted_at).length, [registered])

  const liveVoteCount = useMemo(
    () => registered.filter((r) => canVote(r)).length,
    [registered],
  )

  const pendingVoteCount = useMemo(
    () =>
      registered.filter((r) => {
        if (!r.election || r.voted_at || !r.secret_voter_id) return false
        if (!['published', 'active'].includes(r.election.status)) return false
        return Date.now() < new Date(r.election.end_date).getTime()
      }).length,
    [registered],
  )

  const voterNotifications = useMemo(() => buildVoterNotifications(registrations), [registrations])

  const notificationCount = voterNotifications.length

  const value = useMemo(
    (): VoterDashboardContextValue => ({
      registrations,
      loading,
      error,
      reload,
      registered,
      waitlisted,
      votedCount,
      liveVoteCount,
      pendingVoteCount,
      notificationCount,
    }),
    [
      registrations,
      loading,
      error,
      reload,
      registered,
      waitlisted,
      votedCount,
      liveVoteCount,
      pendingVoteCount,
      notificationCount,
    ],
  )

  return <VoterDashboardContext.Provider value={value}>{children}</VoterDashboardContext.Provider>
}
