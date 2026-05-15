import { formatDistanceToNow, format } from 'date-fns'

export function formatSubmissionDate(iso: string): string {
  try {
    return format(new Date(iso), 'MMM d, yyyy · h:mm a')
  } catch {
    return iso
  }
}

export function formatRelativeTime(iso: string): string {
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true })
  } catch {
    return iso
  }
}
