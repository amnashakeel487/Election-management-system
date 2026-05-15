import { supabase } from '@/lib/supabase'

export interface CreatorNotificationResult {
  sent: boolean
  dev_mode?: boolean
  email?: string
  message?: string
  error?: string
}

export async function sendCreatorApprovalNotification(
  targetUserId: string,
  decision: 'approved' | 'rejected',
  rejectionReason?: string,
): Promise<CreatorNotificationResult> {
  const { data, error } = await supabase.functions.invoke('send-creator-approval-notification', {
    body: {
      target_user_id: targetUserId,
      decision,
      rejection_reason: rejectionReason,
    },
  })

  if (error) {
    return { sent: false, error: error.message }
  }

  return (data ?? { sent: false }) as CreatorNotificationResult
}
