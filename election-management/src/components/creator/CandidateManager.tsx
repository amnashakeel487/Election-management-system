import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  CREATOR_CANDIDATE_CARD_THEMES,
  CreatorCandidateCard,
} from '@/components/creator/candidates/CreatorCandidateCard'
import { CandidateEditorModal } from '@/components/creator/candidates/CandidateEditorModal'
import { CandidateViewModal } from '@/components/creator/candidates/CandidateViewModal'
import { CANDIDATE_PLACEHOLDER_IMAGES } from '@/constants/electionDetailsAssets'
import { removeCandidatePortrait, uploadCandidatePortrait } from '@/services/candidatePhotoService'
import {
  addCandidate,
  fetchCreatorElections,
  fetchElectionById,
  removeCandidate,
  updateCandidate,
} from '@/services/electionService'
import { fetchElectionResults } from '@/services/resultsService'
import type { Candidate, Election, ElectionWithCandidates } from '@/types/election'
import type { ElectionResultsPayload } from '@/types/electionResults'
import { avatarGradient } from '@/utils/dashboardDisplay'
import { candidateInitial, candidatePortraitOrPlaceholder } from '@/utils/candidateDisplay'
import { formatElectionCode } from '@/utils/electionTime'

type EditorOpen = { mode: 'add' } | { mode: 'edit'; candidate: Candidate }

function electionTabLabel(ev: Election, index: number): string {
  const code = `E${String(index + 1).padStart(3, '0')}`
  const title = ev.title?.trim() || 'Untitled'
  const short = title.length > 18 ? `${title.slice(0, 16)}…` : title
  return `${code} — ${short}`
}

function clampBio(s: string, max = 160): string {
  const t = s.trim()
  if (!t) return 'No platform statement yet.'
  if (t.length <= max) return t
  return `${t.slice(0, max)}…`
}

interface CandidateManagerProps {
  creatorId: string
  eyebrow?: string
  pageTitle?: string
}

/** Creator workspace: card grid for candidates per election. */
export function CandidateManager({
  creatorId,
  eyebrow = 'Management',
  pageTitle = 'Candidate Management',
}: CandidateManagerProps) {
  const [searchParams, setSearchParams] = useSearchParams()
  const paramElectionId = searchParams.get('election')

  const [elections, setElections] = useState<Election[]>([])
  const [selectedElectionId, setSelectedElectionId] = useState('')
  const [electionDetail, setElectionDetail] = useState<ElectionWithCandidates | null>(null)
  const [results, setResults] = useState<ElectionResultsPayload | null>(null)
  const [loadingList, setLoadingList] = useState(true)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [workspaceError, setWorkspaceError] = useState<string | null>(null)

  const [editor, setEditor] = useState<EditorOpen | null>(null)
  const [viewCandidate, setViewCandidate] = useState<Candidate | null>(null)
  const [layout, setLayout] = useState<'grid' | 'list'>('grid')
  const [search, setSearch] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const reloadList = useCallback(async () => {
    const list = await fetchCreatorElections(creatorId)
    setElections(list)
    return list
  }, [creatorId])

  useEffect(() => {
    let cancelled = false
    async function boot() {
      setLoadingList(true)
      setWorkspaceError(null)
      try {
        const list = await fetchCreatorElections(creatorId)
        if (cancelled) return
        setElections(list)
      } catch (err) {
        if (!cancelled) setWorkspaceError(err instanceof Error ? err.message : 'Failed to load elections')
      } finally {
        if (!cancelled) setLoadingList(false)
      }
    }
    void boot()
    return () => {
      cancelled = true
    }
  }, [creatorId])

  useEffect(() => {
    if (elections.length === 0 || loadingList) return
    if (paramElectionId && elections.some((e) => e.id === paramElectionId)) {
      setSelectedElectionId(paramElectionId)
      return
    }
    setSelectedElectionId((prev) => {
      if (prev && elections.some((e) => e.id === prev)) return prev
      const draft = elections.find((e) => e.status === 'draft')
      return (draft ?? elections[0])!.id
    })
  }, [elections, loadingList, paramElectionId])

  useEffect(() => {
    if (!selectedElectionId) {
      setElectionDetail(null)
      setResults(null)
      return
    }
    let cancelled = false
    async function load() {
      setLoadingDetail(true)
      setWorkspaceError(null)
      setResults(null)
      try {
        const row = await fetchElectionById(selectedElectionId)
        if (cancelled) return
        if (!row || row.creator_id !== creatorId) {
          setElectionDetail(null)
          setWorkspaceError('Election not found.')
          return
        }
        setElectionDetail(row)
        if (row.status !== 'draft') {
          try {
            const res = await fetchElectionResults(selectedElectionId)
            if (!cancelled) setResults(res)
          } catch {
            if (!cancelled) setResults(null)
          }
        }
      } catch (err) {
        if (!cancelled) setWorkspaceError(err instanceof Error ? err.message : 'Failed to load election')
      } finally {
        if (!cancelled) setLoadingDetail(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [creatorId, selectedElectionId])

  useEffect(() => {
    if (!successMessage) return
    const t = window.setTimeout(() => setSuccessMessage(null), 4000)
    return () => window.clearTimeout(t)
  }, [successMessage])

  const canManageCandidates =
    electionDetail?.status === 'draft' || electionDetail?.status === 'published'
  const isLockedElection =
    electionDetail != null &&
    (electionDetail.status === 'active' || electionDetail.status === 'completed' || electionDetail.status === 'archived')

  const sortedCandidates = useMemo(
    () => (electionDetail?.candidates ?? []).slice().sort((a, b) => a.sort_order - b.sort_order),
    [electionDetail?.candidates],
  )

  const filteredCandidates = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return sortedCandidates
    return sortedCandidates.filter((c) => {
      const hay = [c.name, c.designation, c.description].filter(Boolean).join(' ').toLowerCase()
      return hay.includes(q)
    })
  }, [sortedCandidates, search])

  const totalVotes = results?.total_votes ?? 0

  function voteStats(candidateId: string): { votes: number; pct: number } {
    if (!results || totalVotes <= 0) return { votes: 0, pct: 0 }
    const row = results.candidates.find((c) => c.candidate_id === candidateId)
    const votes = row?.vote_count ?? 0
    return { votes, pct: Math.round((votes / totalVotes) * 1000) / 10 }
  }

  function syncElectionQuery(id: string) {
    const next = new URLSearchParams(searchParams)
    if (id) next.set('election', id)
    else next.delete('election')
    setSearchParams(next, { replace: true })
  }

  function handleSelectElection(id: string) {
    setSelectedElectionId(id)
    syncElectionQuery(id)
  }

  function openAdd() {
    setFormError(null)
    setViewCandidate(null)
    setEditor({ mode: 'add' })
  }

  function openEdit(candidate: Candidate) {
    setFormError(null)
    setViewCandidate(null)
    setEditor({ mode: 'edit', candidate })
  }

  function closeEditor() {
    if (submitting) return
    setEditor(null)
    setFormError(null)
  }

  async function handleSaveCandidate(payload: {
    name: string
    designation: string
    manifesto: string
    file: File | null
    removePhoto: boolean
  }) {
    if (!electionDetail) return
    if (!payload.name) {
      setFormError('Name is required.')
      return
    }
    if (!canManageCandidates) {
      setFormError('Candidates cannot be changed while voting is active or the election has ended.')
      return
    }

    setFormError(null)
    setSubmitting(true)
    try {
      const electionId = electionDetail.id
      let candidateId = editor?.mode === 'edit' ? editor.candidate.id : ''
      let previousPhotoUrl: string | null = editor?.mode === 'edit' ? editor.candidate.photo_url : null

      if (editor?.mode === 'add') {
        const inserted = await addCandidate(electionId, {
          name: payload.name,
          designation: payload.designation || undefined,
          description: payload.manifesto || undefined,
        })
        candidateId = inserted.id
        previousPhotoUrl = inserted.photo_url
      } else if (editor?.mode === 'edit') {
        const patch: Parameters<typeof updateCandidate>[1] = {
          name: payload.name,
          designation: payload.designation || null,
          description: payload.manifesto || null,
        }
        if (payload.removePhoto && !payload.file && previousPhotoUrl) {
          await removeCandidatePortrait(previousPhotoUrl).catch(() => undefined)
          patch.photo_url = null
        }
        await updateCandidate(candidateId, patch)
      }

      if (payload.file) {
        const url = await uploadCandidatePortrait(electionId, candidateId, payload.file)
        await updateCandidate(candidateId, { photo_url: url })
      }

      await refreshDetail(electionDetail.id)
      await reloadList()
      setEditor(null)
      setSuccessMessage(editor?.mode === 'add' ? 'Candidate added.' : 'Candidate updated.')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Save failed'
      if (msg.toLowerCase().includes('row-level security')) {
        setFormError(
          'Permission denied. Candidates can only be edited on draft or published elections. If this is a new deployment, apply Supabase migrations 028 and 029.',
        )
      } else {
        setFormError(msg)
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function refreshDetail(id: string) {
    const row = await fetchElectionById(id)
    setElectionDetail(row)
    if (row && row.status !== 'draft') {
      try {
        setResults(await fetchElectionResults(id))
      } catch {
        setResults(null)
      }
    } else {
      setResults(null)
    }
  }

  async function handleDelete(candidate: Candidate) {
    if (!electionDetail || !canManageCandidates) return
    const ok = window.confirm(`Remove candidate "${candidate.name}" from this election?`)
    if (!ok) return
    setWorkspaceError(null)
    try {
      if (candidate.photo_url) await removeCandidatePortrait(candidate.photo_url).catch(() => undefined)
      await removeCandidate(candidate.id)
      await refreshDetail(electionDetail.id)
      await reloadList()
      setViewCandidate(null)
      setSuccessMessage('Candidate removed.')
    } catch (err) {
      setWorkspaceError(err instanceof Error ? err.message : 'Remove failed')
    }
  }

  const subtitleElection = electionDetail?.title ?? 'your selected election'
  const electionCode = electionDetail ? formatElectionCode(electionDetail.id) : ''
  const viewStats = viewCandidate ? voteStats(viewCandidate.id) : { votes: 0, pct: 0 }

  return (
    <div className="creator-candidates-page">
      <header className="ccm-intro">
        <div className="ccm-eyebrow">{eyebrow}</div>
        <h2 className="ccm-title">{pageTitle}</h2>
        <p className="ccm-subtitle">
          Manage candidates for{' '}
          <strong style={{ color: '#0f172a', fontWeight: 700 }}>
            {subtitleElection}
            {electionCode ? ` (${electionCode})` : ''}
          </strong>
          {isLockedElection ? <span className="ccm-view-badge">View only</span> : null}
        </p>
      </header>

      {workspaceError ? <div className="ccm-alert error">{workspaceError}</div> : null}
      {successMessage ? (
        <div className="ccm-alert success" role="status">
          {successMessage}
        </div>
      ) : null}

      {!loadingList && elections.length === 0 ? (
        <div className="ccm-empty">
          <p>Create an election first, then return here to add candidates with photos and bios.</p>
          <Link to="/creator/elections/new" className="ccm-add-btn">
            New election
          </Link>
        </div>
      ) : null}

      {elections.length > 0 ? (
        <>
          <div className="ccm-toolbar">
            <div className="ccm-tabs" role="tablist" aria-label="Elections">
              {elections.map((ev, index) => (
                <button
                  key={ev.id}
                  type="button"
                  role="tab"
                  aria-selected={ev.id === selectedElectionId}
                  className={`ccm-tab${ev.id === selectedElectionId ? ' active' : ''}`}
                  onClick={() => handleSelectElection(ev.id)}
                >
                  {electionTabLabel(ev, index)}
                </button>
              ))}
            </div>
            {canManageCandidates ? (
              <button type="button" className="ccm-add-btn" onClick={openAdd}>
                <svg viewBox="0 0 24 24" aria-hidden>
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Add Candidate
              </button>
            ) : null}
          </div>

          {loadingDetail ? <p className="ccm-loading">Loading candidates…</p> : null}

          {electionDetail && !loadingDetail ? (
            <>
              {isLockedElection ? (
                <div className="ccm-banner warn">
                  This election is active or completed. You can view candidates but cannot add, edit, or delete
                  them.
                </div>
              ) : canManageCandidates ? (
                <div className="ccm-banner">Add members with photo, name, designation, and manifesto.</div>
              ) : null}

              <div className="ccm-subtoolbar">
                <label className="ccm-search">
                  <span aria-hidden>⌕</span>
                  <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search candidates…"
                    aria-label="Search candidates"
                  />
                </label>
                <span className="ccm-count">
                  {filteredCandidates.length} candidate{filteredCandidates.length === 1 ? '' : 's'}
                </span>
                <div className="ccm-view-toggle" role="group" aria-label="Layout">
                  <button type="button" className={layout === 'grid' ? 'active' : ''} onClick={() => setLayout('grid')}>
                    Grid
                  </button>
                  <button type="button" className={layout === 'list' ? 'active' : ''} onClick={() => setLayout('list')}>
                    List
                  </button>
                </div>
              </div>

              {filteredCandidates.length === 0 ? (
                <div className="ccm-empty">
                  <p>
                    {search.trim()
                      ? 'No candidates match your search.'
                      : canManageCandidates
                        ? 'No candidates yet. Add your first member.'
                        : 'No candidates on this ballot yet.'}
                  </p>
                  {canManageCandidates && !search.trim() ? (
                    <button type="button" className="ccm-add-btn" onClick={openAdd}>
                      Add candidate
                    </button>
                  ) : null}
                </div>
              ) : layout === 'list' ? (
                <div className="ccm-list-wrap">
                  <table className="ccm-list-table">
                    <thead>
                      <tr>
                        <th>Photo</th>
                        <th>Name</th>
                        <th>Designation</th>
                        <th>Manifesto</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCandidates.map((candidate) => {
                        const photo = candidatePortraitOrPlaceholder(candidate, CANDIDATE_PLACEHOLDER_IMAGES)
                        const hasPhoto = Boolean(candidate.photo_url?.trim())
                        return (
                          <tr key={candidate.id}>
                            <td>
                              {hasPhoto ? (
                                <img src={photo} alt="" className="ccm-list-photo" />
                              ) : (
                                <div
                                  className="ccm-list-photo-fallback"
                                  style={{ background: avatarGradient(candidate.name) }}
                                >
                                  {candidateInitial(candidate.name)}
                                </div>
                              )}
                            </td>
                            <td>
                              <strong>{candidate.name}</strong>
                            </td>
                            <td>{candidate.designation?.trim() || '—'}</td>
                            <td style={{ maxWidth: 280, color: '#64748b', fontSize: 12 }}>
                              {clampBio(candidate.description ?? '', 80)}
                            </td>
                            <td>
                              <div className="ccm-list-actions">
                                <button type="button" className="primary" onClick={() => setViewCandidate(candidate)}>
                                  View
                                </button>
                                {canManageCandidates ? (
                                  <>
                                    <button type="button" className="primary" onClick={() => openEdit(candidate)}>
                                      Edit
                                    </button>
                                    <button type="button" className="danger" onClick={() => void handleDelete(candidate)}>
                                      Delete
                                    </button>
                                  </>
                                ) : null}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="ccm-grid">
                  {filteredCandidates.map((candidate, index) => {
                    const theme = CREATOR_CANDIDATE_CARD_THEMES[index % CREATOR_CANDIDATE_CARD_THEMES.length]
                    const { votes, pct } = voteStats(candidate.id)
                    const pctLabel =
                      totalVotes > 0
                        ? `${pct}% of total`
                        : electionDetail.status === 'draft'
                          ? 'Votes appear after publishing'
                          : '0% of total'

                    return (
                      <CreatorCandidateCard
                        key={candidate.id}
                        candidate={candidate}
                        theme={theme}
                        votes={votes}
                        pct={pct}
                        pctLabel={pctLabel}
                        bio={clampBio(candidate.description ?? '')}
                        canManage={canManageCandidates}
                        onNameClick={() => setViewCandidate(candidate)}
                        onEdit={() => openEdit(candidate)}
                        onDelete={() => void handleDelete(candidate)}
                        onView={() => setViewCandidate(candidate)}
                      />
                    )
                  })}

                  {canManageCandidates ? (
                    <button type="button" className="ccm-add-card" onClick={openAdd}>
                      <span className="ccm-add-icon" aria-hidden>
                        +
                      </span>
                      <span className="ccm-add-label">Add Candidate</span>
                      <span className="ccm-add-hint">Click to add a new candidate</span>
                    </button>
                  ) : null}
                </div>
              )}
            </>
          ) : null}

          {canManageCandidates && electionDetail?.status === 'draft' ? (
            <p style={{ marginTop: 24, fontSize: 13 }}>
              <Link
                to={`/creator/elections/${electionDetail.id}/edit`}
                style={{ color: '#2451a3', fontWeight: 700, textDecoration: 'none' }}
              >
                Continue in creation wizard →
              </Link>
            </p>
          ) : null}
        </>
      ) : null}

      <CandidateEditorModal
        mode={editor?.mode ?? 'add'}
        candidate={editor?.mode === 'edit' ? editor.candidate : undefined}
        open={Boolean(editor && electionDetail && canManageCandidates)}
        submitting={submitting}
        error={formError}
        onClose={closeEditor}
        onSubmit={(payload) => void handleSaveCandidate(payload)}
      />

      <CandidateViewModal
        candidate={viewCandidate}
        voteCount={viewStats.votes}
        votePct={viewStats.pct}
        open={viewCandidate != null}
        canManage={canManageCandidates}
        onClose={() => setViewCandidate(null)}
        onEdit={() => {
          if (viewCandidate) openEdit(viewCandidate)
        }}
        onDelete={() => {
          if (viewCandidate) void handleDelete(viewCandidate)
        }}
      />
    </div>
  )
}
