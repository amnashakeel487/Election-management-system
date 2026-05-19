import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { fetchVoterNotificationLogs } from '@/services/voterNotificationService'
import { fetchUserRegistrations } from '@/services/voterRegistrationService'
import type { NotificationLogRow } from '@/types/notification'
import type { VoterRegistrationWithElection } from '@/types/voterRegistration'
import {
  countUnreadNotifications,
  mergeVoterInbox,
  type VoterNotificationItem,
} from '@/utils/voterNotifications'
import { useEnsureDueElectionsPrepared } from '@/hooks/useEnsureVotingReadyWhenDue'
import { canVote } from '@/utils/voterElectionUi'

const INBOX_POLL_MS = 45_000

export interface VoterDashboardContextValue {
  registrations: VoterRegistrationWithElection[]
  notificationLogs: NotificationLogRow[]
  notifications: VoterNotificationItem[]
  loading: boolean
  notificationsLoading: boolean
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
  const [notificationLogs, setNotificationLogs] = useState<NotificationLogRow[]>([])
  const [loading, setLoading] = useState(true)
  const [notificationsLoading, setNotificationsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    const userId = session?.user.id
    if (!userId) {
      setRegistrations([])
      setNotificationLogs([])
      setLoading(false)
      return
    }
    setLoading(true)
    setNotificationsLoading(true)
    setError(null)
    try {
      const [regData, logs] = await Promise.all([
        fetchUserRegistrations(userId),
        fetchVoterNotificationLogs(userId).catch(() => [] as NotificationLogRow[]),
      ])
      setRegistrations(regData)
      setNotificationLogs(logs)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load voter dashboard')
      setRegistrations([])
      setNotificationLogs([])
    } finally {
      setLoading(false)
      setNotificationsLoading(false)
    }
  }, [session?.user.id])

  useEffect(() => {
    void reload()
  }, [reload])

  useEnsureDueElectionsPrepared(registrations, reload, 15_000)

  useEffect(() => {
    const userId = session?.user.id
    if (!userId) return

    const poll = window.setInterval(() => {
      void reload()
    }, INBOX_POLL_MS)

    const onFocus = () => {
      void reload()
    }
    const onInboxRefresh = () => {
      void reload()
    }
    window.addEventListener('focus', onFocus)
    window.addEventListener('voter-inbox-refresh', onInboxRefresh)

    return () => {
      window.clearInterval(poll)
      window.removeEventListener('focus', onFocus)
      window.removeEventListener('voter-inbox-refresh', onInboxRefresh)
    }
  }, [session?.user.id, reload])

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

  const notifications = useMemo(
    () => mergeVoterInbox(registrations, notificationLogs),
    [registrations, notificationLogs],
  )

  const notificationCount = useMemo(() => countUnreadNotifications(notifications), [notifications])

  const value = useMemo(
    (): VoterDashboardContextValue => ({
      registrations,
      notificationLogs,
      notifications,
      loading,
      notificationsLoading,
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
      notificationLogs,
      notifications,
      loading,
      notificationsLoading,
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
