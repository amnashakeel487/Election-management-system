import { useCallback, useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import '@/styles/creator-election-detail.css'
import { CreatorElectionDetailView } from '@/components/creator/election-detail/CreatorElectionDetailView'
import { useCreatorElection } from '@/context/CreatorElectionContext'
import { useAuth } from '@/hooks/useAuth'
import { fetchFilteredAuditLogs } from '@/services/auditService'
import { fetchElectionById } from '@/services/electionService'
import { fetchElectionResults } from '@/services/resultsService'
import { fetchElectionRegistrationStats } from '@/services/voterRegistrationService'
import { finalizeAndEmailSecretVoterIds } from '@/services/secretVoterIdService'
import type { AuditLogEntry } from '@/types/auth'
import type { ElectionWithCandidates } from '@/types/election'
import type { ElectionResultsPayload } from '@/types/electionResults'
import type { ElectionRegistrationStats } from '@/types/voterRegistration'

export function CreatorElectionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { profile } = useAuth()
  const { setSelectedId } = useCreatorElection()
  const [election, setElection] = useState<ElectionWithCandidates | null>(null)
  const [stats, setStats] = useState<ElectionRegistrationStats | null>(null)
  const [results, setResults] = useState<ElectionResultsPayload | null>(null)
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [finalizingId, setFinalizingId] = useState<string | null>(null)
  const [finalizeMessage, setFinalizeMessage] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const data = await fetchElectionById(id)
      if (!data) {
        setError('Election not found')
        setElection(null)
        return
      }
      if (data.creator_id !== profile?.id && profile?.role !== 'admin') {
        setError('You do not have access to this election')
        setElection(null)
        return
      }
      setElection(data)
      setSelectedId(data.id)

      if (data.status !== 'draft') {
        const [regStats, auditPage] = await Promise.all([
          fetchElectionRegistrationStats(id),
          fetchFilteredAuditLogs({ limit: 80, offset: 0 }),
        ])
        setStats(regStats)
        setAuditLogs(auditPage.logs)

        try {
          const res = await fetchElectionResults(id)
          setResults(res)
        } catch {
          setResults(null)
        }
      } else {
        setStats(null)
        setResults(null)
        setAuditLogs([])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load election')
    } finally {
      setLoading(false)
    }
  }, [id, profile?.id, profile?.role, setSelectedId])

  useEffect(() => {
    void load()
  }, [load])

  async function handleFinalize() {
    if (!election) return
    setFinalizingId(election.id)
    setFinalizeMessage(null)
    try {
      const { finalize, email } = await finalizeAndEmailSecretVoterIds(election.id)
      setFinalizeMessage(`Assigned ${finalize.assigned_count} ID(s). Emailed ${email.sent} voter(s).`)
      await load()
    } catch (err) {
      setFinalizeMessage(err instanceof Error ? err.message : 'Finalization failed')
    } finally {
      setFinalizingId(null)
    }
  }

  if (!id) {
    return <Navigate to="/creator/dashboard" replace />
  }

  if (loading) {
    return (
      <div className="creator-election-detail">
        <p style={{ padding: 24, fontSize: 14, color: 'var(--ced-muted)' }}>Loading election details…</p>
      </div>
    )
  }

  if (error || !election) {
    return (
      <div className="creator-election-detail">
        <div className="panel">
          <div className="panel-body">
            <p style={{ color: 'var(--ced-danger)' }}>{error ?? 'Election not found'}</p>
            <Link to="/creator/elections" className="p-btn primary" style={{ marginTop: 12, display: 'inline-flex' }}>
              Back to elections
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <CreatorElectionDetailView
      election={election}
      stats={stats}
      results={results}
      auditLogs={auditLogs}
      finalizingId={finalizingId}
      finalizeMessage={finalizeMessage}
      onReload={() => void load()}
      onFinalize={() => void handleFinalize()}
    />
  )
}
