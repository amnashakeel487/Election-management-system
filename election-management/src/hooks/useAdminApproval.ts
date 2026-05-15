import { useCallback, useEffect, useState } from 'react'
import {
  approveCreatorRequest,
  fetchPendingCreatorCount,
  fetchPendingCreatorRequests,
  fetchRecentAuditLogs,
  rejectCreatorRequest,
} from '@/services/adminApprovalService'
import type { AuditLogEntry, PendingCreatorRequest } from '@/types/auth'

export function useAdminApproval(actorId: string | undefined) {
  const [pendingCreators, setPendingCreators] = useState<PendingCreatorRequest[]>([])
  const [pendingCount, setPendingCount] = useState(0)
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actingOnId, setActingOnId] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setActionError(null)
    try {
      const [pending, count, logs] = await Promise.all([
        fetchPendingCreatorRequests(),
        fetchPendingCreatorCount(),
        fetchRecentAuditLogs(),
      ])
      setPendingCreators(pending)
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
    if (!actorId) return
    setActingOnId(targetUserId)
    setActionError(null)
    try {
      await approveCreatorRequest(targetUserId, targetEmail)
      await refresh()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Approval failed')
    } finally {
      setActingOnId(null)
    }
  }

  async function reject(targetUserId: string, targetEmail: string, reason: string) {
    if (!actorId) return
    setActingOnId(targetUserId)
    setActionError(null)
    try {
      await rejectCreatorRequest(targetUserId, targetEmail, reason)
      await refresh()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Rejection failed')
    } finally {
      setActingOnId(null)
    }
  }

  return {
    pendingCreators,
    pendingCount,
    auditLogs,
    loading,
    actionError,
    actingOnId,
    approve,
    reject,
    refresh,
  }
}
