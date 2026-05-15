import { useCallback, useEffect, useState } from 'react'
import {
  approveCreatorRequest,
  fetchApprovedCreators,
  fetchPendingCreatorCount,
  fetchPendingCreatorRequests,
  fetchRecentAuditLogs,
  fetchRejectedCreators,
  rejectCreatorRequest,
} from '@/services/adminApprovalService'
import type { AuditLogEntry, PendingCreatorRequest } from '@/types/auth'

export function useAdminApproval(_actorId: string | undefined) {
  const [pendingCreators, setPendingCreators] = useState<PendingCreatorRequest[]>([])
  const [approvedCreators, setApprovedCreators] = useState<PendingCreatorRequest[]>([])
  const [rejectedCreators, setRejectedCreators] = useState<PendingCreatorRequest[]>([])
  const [pendingCount, setPendingCount] = useState(0)
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionNotice, setActionNotice] = useState<string | null>(null)
  const [actingOnId, setActingOnId] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setActionError(null)
    try {
      const [pending, approved, rejected, count, logs] = await Promise.all([
        fetchPendingCreatorRequests(),
        fetchApprovedCreators(),
        fetchRejectedCreators(),
        fetchPendingCreatorCount(),
        fetchRecentAuditLogs(),
      ])
      setPendingCreators(pending)
      setApprovedCreators(approved)
      setRejectedCreators(rejected)
      setPendingCount(count)
      setAuditLogs(logs)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to load admin data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  async function approve(targetUserId: string, targetEmail: string) {
    setActingOnId(targetUserId)
    setActionError(null)
    setActionNotice(null)
    try {
      const result = await approveCreatorRequest(targetUserId, targetEmail)
      setActionNotice(
        result.emailSent
          ? `Approved ${targetEmail}. Notification email sent.`
          : `Approved ${targetEmail}. ${result.emailWarning ?? 'Email not sent.'}`,
      )
      await refresh()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Approval failed')
    } finally {
      setActingOnId(null)
    }
  }

  async function reject(targetUserId: string, targetEmail: string, reason: string) {
    setActingOnId(targetUserId)
    setActionError(null)
    setActionNotice(null)
    try {
      const result = await rejectCreatorRequest(targetUserId, targetEmail, reason)
      setActionNotice(
        result.emailSent
          ? `Rejected ${targetEmail}. Notification email sent.`
          : `Rejected ${targetEmail}. ${result.emailWarning ?? 'Email not sent.'}`,
      )
      await refresh()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Rejection failed')
    } finally {
      setActingOnId(null)
    }
  }

  return {
    pendingCreators,
    approvedCreators,
    rejectedCreators,
    pendingCount,
    auditLogs,
    loading,
    actionError,
    actionNotice,
    actingOnId,
    approve,
    reject,
    refresh,
    clearNotice: () => setActionNotice(null),
  }
}
