import { supabase } from '@/lib/supabase'
import type { NotificationLogRow } from '@/types/notification'

const VOTER_INBOX_TYPES = [
  'voter_registered',
  'secret_voter_id',
  'election_start',
  'election_end',
  'winner',
  'waitlist_joined',
  'waitlist_promoted',
] as const

/** Sent notifications for the signed-in voter (RLS-scoped). */
export async function fetchVoterNotificationLogs(userId: string): Promise<NotificationLogRow[]> {
  const { data, error } = await supabase
    .from('notification_logs')
    .select('*')
    .eq('recipient_user_id', userId)
    .eq('status', 'sent')
    .in('notification_type', [...VOTER_INBOX_TYPES])
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) throw new Error(error.message)
  return (data ?? []) as NotificationLogRow[]
}
