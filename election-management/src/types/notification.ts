export type NotificationType =
  | 'email_verification'
  | 'creator_approval'
  | 'creator_rejection'
  | 'secret_voter_id'
  | 'election_start'
  | 'election_end'
  | 'winner'

export type NotificationStatus = 'pending' | 'sent' | 'failed' | 'skipped'

export interface NotificationLogRow {
  id: string
  notification_type: NotificationType
  recipient_email: string
  recipient_user_id: string | null
  election_id: string | null
  subject: string | null
  status: NotificationStatus
  error_message: string | null
  metadata: Record<string, unknown>
  created_at: string
  sent_at: string | null
}

export interface NotificationSummary {
  total: number
  sent: number
  failed: number
  by_type: Partial<Record<NotificationType, number>>
}

export type ElectionNotificationMilestone = 'election_start' | 'election_end' | 'winner'

export interface SendElectionNotificationResult {
  sent: number
  errors?: string[]
  dev_mode?: boolean
  milestone?: ElectionNotificationMilestone
  error?: string
}

export interface ProcessMilestonesResult {
  processed?: Record<string, unknown>
  error?: string
}

export interface VerificationReminderResult {
  sent: boolean
  dev_mode?: boolean
  note?: string
  error?: string
}
