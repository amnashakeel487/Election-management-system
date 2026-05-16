import { supabase } from '@/lib/supabase'
import type {
  ElectionNotificationMilestone,
  NotificationLogRow,
  NotificationSummary,
  NotificationType,
  ProcessMilestonesResult,
  SendElectionNotificationResult,
  VerificationReminderResult,
} from '@/types/notification'

export async function fetchNotificationSummary(days = 30): Promise<NotificationSummary> {
  const { data, error } = await supabase.rpc('get_notification_summary', { p_days: days })
  if (error) throw new Error(error.message)
  const raw = (data ?? {}) as NotificationSummary
  return {
    total: raw.total ?? 0,
    sent: raw.sent ?? 0,
    failed: raw.failed ?? 0,
    by_type: raw.by_type ?? {},
  }
}

export interface FetchNotificationLogsParams {
  type?: NotificationType | 'all'
  status?: 'all' | 'sent' | 'failed'
  limit?: number
  offset?: number
}

export async function fetchNotificationLogs(
  params: FetchNotificationLogsParams = {},
): Promise<{ logs: NotificationLogRow[]; total: number }> {
  const limit = params.limit ?? 25
  const offset = params.offset ?? 0

  let query = supabase
    .from('notification_logs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (params.type && params.type !== 'all') {
    query = query.eq('notification_type', params.type)
  }
  if (params.status && params.status !== 'all') {
    query = query.eq('status', params.status)
  }

  const { data, error, count } = await query
  if (error) throw new Error(error.message)

  return {
    logs: (data ?? []) as NotificationLogRow[],
    total: count ?? 0,
  }
}

export async function sendElectionNotification(
  electionId: string,
  milestone: ElectionNotificationMilestone,
): Promise<SendElectionNotificationResult> {
  const { data, error } = await supabase.functions.invoke('send-election-notifications', {
    body: { election_id: electionId, milestone },
  })

  if (error) {
    return { sent: 0, error: error.message }
  }

  return (data ?? { sent: 0 }) as SendElectionNotificationResult
}

export async function processNotificationMilestones(): Promise<ProcessMilestonesResult> {
  const { data, error } = await supabase.functions.invoke('process-notification-milestones', {
    body: {},
  })

  if (error) {
    return { error: error.message }
  }

  return (data ?? {}) as ProcessMilestonesResult
}

export async function sendVerificationReminder(email: string): Promise<VerificationReminderResult> {
  const { data, error } = await supabase.functions.invoke('send-verification-reminder', {
    body: { email },
  })

  if (error) {
    return { sent: false, error: error.message }
  }

  return (data ?? { sent: false }) as VerificationReminderResult
}

/** After locking results, notify registered voters of the winner (non-blocking). */
export async function triggerWinnerNotification(electionId: string): Promise<SendElectionNotificationResult> {
  return sendElectionNotification(electionId, 'winner')
}
