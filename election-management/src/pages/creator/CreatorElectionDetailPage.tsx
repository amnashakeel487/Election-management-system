import { useCallback, useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import '@/styles/creator-election-detail.css'
import '@/styles/creator-candidates.css'
import { CreatorElectionDetailView } from '@/components/creator/election-detail/CreatorElectionDetailView'
import { useCreatorElection } from '@/context/CreatorElectionContext'
import { useAuth } from '@/hooks/useAuth'
import { fetchCreatorElectionAuditLogs } from '@/services/auditService'
import { removeCandidatePortrait } from '@/services/candidatePhotoService'
import { deleteCreatorElection, fetchElectionById, removeCandidate } from '@/services/electionService'
import { fetchElectionResults } from '@/services/resultsService'
import { fetchElectionRegistrationStats } from '@/services/voterRegistrationService'
import type { AuditLogEntry } from '@/types/auth'
import type { Candidate, ElectionWithCandidates } from '@/types/election'
import type { ElectionResultsPayload } from '@/types/electionResults'
import type { ElectionRegistrationStats } from '@/types/voterRegistration'

export function CreatorElectionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { profile } = useAuth()
  const navigate = useNavigate()
  const { setSelectedId, refreshElections } = useCreatorElection()
  const [election, setElection] = useState<ElectionWithCandidates | null>(null)
  const [stats, setStats] = useState<ElectionRegistrationStats | null>(null)
  const [results, setResults] = useState<ElectionResultsPayload | null>(null)
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingCandidateId, setDeletingCandidateId] = useState<string | null>(null)
  const [deletingElection, setDeletingElection] = useState(false)

  const load = useCallback(async (options?: { silent?: boolean }) => {
    if (!id) return
    if (!options?.silent) {
      setLoading(true)
    }
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
        const [regStatsResult, auditResult, resultsResult] = await Promise.allSettled([
          fetchElectionRegistrationStats(id),
          fetchCreatorElectionAuditLogs(id, { limit: 80, offset: 0 }),
          fetchElectionResults(id),
        ])

        if (regStatsResult.status === 'fulfilled') {
          setStats(regStatsResult.value)
        } else {
          setStats(null)
        }

        if (auditResult.status === 'fulfilled') {
          setAuditLogs(auditResult.value.logs)
        } else {
          setAuditLogs([])
        }

        if (resultsResult.status === 'fulfilled') {
          setResults(resultsResult.value)
        } else {
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

  async function handleDeleteCandidate(candidate: Candidate) {
    if (!election) return
    const canManage = election.status === 'draft' || election.status === 'published'
    if (!canManage) return
    if (!window.confirm(`Remove candidate "${candidate.name}" from this election?`)) return
    setDeletingCandidateId(candidate.id)
    try {
      if (candidate.photo_url) {
        await removeCandidatePortrait(candidate.photo_url).catch(() => undefined)
      }
      await removeCandidate(candidate.id)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove candidate')
    } finally {
      setDeletingCandidateId(null)
    }
  }

  async function handleDeleteElection() {
    if (!election) return
    const registered = stats?.registered_count ?? 0
    const warn =
      registered > 0
        ? `\n\nThis election has ${registered} registered voter(s). All data will be permanently removed.`
        : ''
    if (
      !window.confirm(
        `Delete "${election.title}"? This cannot be undone.${warn}`,
      )
    ) {
      return
    }
    setDeletingElection(true)
    setError(null)
    try {
      await deleteCreatorElection(election.id)
      setSelectedId(null)
      await refreshElections()
      navigate('/creator/elections', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete election')
      setDeletingElection(false)
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
      onReload={() => void load()}
      onDeleteCandidate={(c) => void handleDeleteCandidate(c)}
      deletingCandidateId={deletingCandidateId}
      onDeleteElection={() => void handleDeleteElection()}
      deletingElection={deletingElection}
    />
  )
}
