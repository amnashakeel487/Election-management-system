import { useCallback, useEffect, useState } from 'react'
import {
  fetchAuditTransparencySummary,
  fetchFilteredAuditLogs,
  type AuditLogFilters,
} from '@/services/auditService'
import type { AuditCategory, AuditTransparencySummary } from '@/types/audit'
import type { AuditLogEntry } from '@/types/auth'

const PAGE_SIZE = 50

export function useAuditTransparency() {
  const [summary, setSummary] = useState<AuditTransparencySummary | null>(null)
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [category, setCategory] = useState<AuditCategory>('all')
  const [overrideOnly, setOverrideOnly] = useState(false)
  const [rangeDays, setRangeDays] = useState(30)
  const [offset, setOffset] = useState(0)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const since = new Date()
      since.setDate(since.getDate() - (rangeDays - 1))
      since.setHours(0, 0, 0, 0)

      const filters: AuditLogFilters = {
        category,
        overrideOnly,
        from: since.toISOString(),
        limit: PAGE_SIZE,
        offset,
      }

      const [summaryData, page] = await Promise.all([
        fetchAuditTransparencySummary(rangeDays),
        fetchFilteredAuditLogs(filters),
      ])

      setSummary(summaryData)
      setLogs(page.logs)
      setTotal(page.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audit data')
    } finally {
      setLoading(false)
    }
  }, [category, overrideOnly, rangeDays, offset])

  useEffect(() => {
    void load()
  }, [load])

  const refresh = useCallback(() => {
    void load()
  }, [load])

  const setCategoryFilter = useCallback((next: AuditCategory) => {
    setOffset(0)
    setCategory(next)
    if (next !== 'override') setOverrideOnly(false)
  }, [])

  const toggleOverrideOnly = useCallback(() => {
    setOffset(0)
    setOverrideOnly((v) => !v)
    setCategory('all')
  }, [])

  const changeRange = useCallback((days: number) => {
    setOffset(0)
    setRangeDays(days)
  }, [])

  const nextPage = useCallback(() => {
    setOffset((o) => o + PAGE_SIZE)
  }, [])

  const prevPage = useCallback(() => {
    setOffset((o) => Math.max(0, o - PAGE_SIZE))
  }, [])

  return {
    summary,
    logs,
    total,
    loading,
    error,
    category,
    overrideOnly,
    rangeDays,
    offset,
    pageSize: PAGE_SIZE,
    setCategoryFilter,
    toggleOverrideOnly,
    changeRange,
    nextPage,
    prevPage,
    refresh,
  }
}
