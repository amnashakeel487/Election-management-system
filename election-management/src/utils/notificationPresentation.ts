import type { NotificationStatus, NotificationType } from '@/types/notification'

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  email_verification: 'Email verification',
  creator_approval: 'Creator approval',
  creator_rejection: 'Creator rejection',
  secret_voter_id: 'Secret voter ID',
  election_start: 'Election start reminder',
  election_end: 'Election ended',
  winner: 'Winner announcement',
}

export const NOTIFICATION_STATUS_LABELS: Record<NotificationStatus, string> = {
  pending: 'Pending',
  sent: 'Sent',
  failed: 'Failed',
  skipped: 'Skipped',
}

export function notificationStatusClass(status: NotificationStatus): string {
  switch (status) {
    case 'sent':
      return 'badge badge-approved'
    case 'failed':
      return 'badge badge-rejected'
    case 'skipped':
      return 'badge badge-completed'
    default:
      return 'badge badge-pending'
  }
}
