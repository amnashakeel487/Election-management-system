import { type CSSProperties, type FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
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

const IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp,image/gif'

const CARD_THEMES = [
  { accent: '#2451a3', bar: 'linear-gradient(90deg,#2451A3,#1B3A6B)' },
  { accent: '#6c3fc5', bar: 'linear-gradient(90deg,#6C3FC5,#9333ea)' },
  { accent: '#0891b2', bar: 'linear-gradient(90deg,#06B6D4,#0891b2)' },
  { accent: '#059669', bar: 'linear-gradient(90deg,#10B981,#059669)' },
] as const

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
  const [formName, setFormName] = useState('')
  const [formDesignation, setFormDesignation] = useState('')
  const [formManifesto, setFormManifesto] = useState('')
  const [formFile, setFormFile] = useState<File | null>(null)
  const [removePhoto, setRemovePhoto] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

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

  const isDraftElection = electionDetail?.status === 'draft'
  const sortedCandidates = useMemo(
    () => (electionDetail?.candidates ?? []).slice().sort((a, b) => a.sort_order - b.sort_order),
    [electionDetail?.candidates],
  )

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
    setFormName('')
    setFormDesignation('')
    setFormManifesto('')
    setFormFile(null)
    setRemovePhoto(false)
    setEditor({ mode: 'add' })
  }

  function openEdit(candidate: Candidate) {
    setFormError(null)
    setFormName(candidate.name)
    setFormDesignation(candidate.designation ?? '')
    setFormManifesto(candidate.description ?? '')
    setFormFile(null)
    setRemovePhoto(false)
    setEditor({ mode: 'edit', candidate })
  }

  function closeEditor() {
    if (submitting) return
    setEditor(null)
  }

  async function handleSubmitModal(e: FormEvent) {
    e.preventDefault()
    if (!electionDetail) return
    const trimmedName = formName.trim()
    if (!trimmedName) {
      setFormError('Name is required.')
      return
    }
    const maxMb = 4
    if (formFile && formFile.size > maxMb * 1024 * 1024) {
      setFormError(`Photo must be ${maxMb} MB or smaller.`)
      return
    }
    const allowedMime = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (formFile && !allowedMime.includes(formFile.type)) {
      setFormError('Use JPEG, PNG, WebP, or GIF.')
      return
    }
    if (!isDraftElection) {
      setFormError('Candidates can only be changed while the election is a draft.')
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
          name: trimmedName,
          designation: formDesignation.trim() || undefined,
          description: formManifesto.trim() || undefined,
        })
        candidateId = inserted.id
        previousPhotoUrl = inserted.photo_url
      } else if (editor?.mode === 'edit') {
        const patch: Parameters<typeof updateCandidate>[1] = {
          name: trimmedName,
          designation: formDesignation.trim() || null,
          description: formManifesto.trim() || null,
        }
        if (removePhoto && !formFile && previousPhotoUrl) {
          await removeCandidatePortrait(previousPhotoUrl).catch(() => undefined)
          patch.photo_url = null
        }
        await updateCandidate(candidateId, patch)
      }

      if (formFile) {
        const url = await uploadCandidatePortrait(electionId, candidateId, formFile)
        await updateCandidate(candidateId, { photo_url: url })
      }

      await refreshDetail(electionDetail.id)
      await reloadList()
      setEditor(null)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Save failed')
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
    if (!electionDetail || !isDraftElection) return
    const ok = window.confirm(`Remove candidate "${candidate.name}" from this election?`)
    if (!ok) return
    setWorkspaceError(null)
    try {
      if (candidate.photo_url) await removeCandidatePortrait(candidate.photo_url).catch(() => undefined)
      await removeCandidate(candidate.id)
      await refreshDetail(electionDetail.id)
      await reloadList()
    } catch (err) {
      setWorkspaceError(err instanceof Error ? err.message : 'Remove failed')
    }
  }

  const subtitleElection = electionDetail?.title ?? 'your selected election'
  const electionCode = electionDetail ? formatElectionCode(electionDetail.id) : ''

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
          {!isDraftElection && electionDetail ? (
            <span className="ccm-view-badge">View only</span>
          ) : null}
        </p>
      </header>

      {workspaceError ? <div className="ccm-alert error">{workspaceError}</div> : null}

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
            {isDraftElection ? (
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
            <div className="ccm-grid">
              {sortedCandidates.length === 0 && !isDraftElection ? (
                <div className="ccm-empty">
                  <p>No candidates on this ballot yet.</p>
                </div>
              ) : null}

              {sortedCandidates.map((candidate, index) => {
                const theme = CARD_THEMES[index % CARD_THEMES.length]
                const { votes, pct } = voteStats(candidate.id)
                const photo = candidatePortraitOrPlaceholder(candidate, CANDIDATE_PLACEHOLDER_IMAGES)
                const hasPhoto = Boolean(candidate.photo_url?.trim())

                return (
                  <article
                    key={candidate.id}
                    className="ccm-card"
                    style={
                      {
                        '--ccm-accent': theme.accent,
                        '--ccm-bar': theme.bar,
                      } as CSSProperties
                    }
                  >
                    <div className="ccm-card-body">
                      {hasPhoto ? (
                        <img src={photo} alt="" className="ccm-avatar" />
                      ) : (
                        <div
                          className="ccm-avatar-fallback"
                          style={{ background: avatarGradient(candidate.name) }}
                        >
                          {candidateInitial(candidate.name)}
                        </div>
                      )}
                      <h3 className="ccm-name">{candidate.name}</h3>
                      <p className="ccm-party">{candidate.designation?.trim() || 'Candidate'}</p>

                      {totalVotes > 0 ? (
                        <>
                          <div className="ccm-votes">
                            {votes.toLocaleString()}
                            <span className="ccm-votes-label"> votes</span>
                          </div>
                          <div className="ccm-bar-track">
                            <div
                              className="ccm-bar-fill"
                              style={{ width: `${Math.min(100, pct)}%` }}
                            />
                          </div>
                          <p className="ccm-pct">{pct}% of total</p>
                        </>
                      ) : (
                        <p className="ccm-pct" style={{ marginBottom: 14 }}>
                          {isDraftElection ? 'Votes appear after publishing' : 'No votes cast yet'}
                        </p>
                      )}

                      <p className="ccm-bio">{clampBio(candidate.description ?? '')}</p>
                    </div>

                    {isDraftElection ? (
                      <footer className="ccm-card-footer">
                        <button type="button" className="ccm-edit-btn" onClick={() => openEdit(candidate)}>
                          — Edit
                        </button>
                        <button
                          type="button"
                          className="ccm-del-btn"
                          aria-label={`Delete ${candidate.name}`}
                          onClick={() => void handleDelete(candidate)}
                        >
                          <svg viewBox="0 0 24 24" aria-hidden>
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </footer>
                    ) : null}
                  </article>
                )
              })}

              {isDraftElection ? (
                <button type="button" className="ccm-add-card" onClick={openAdd}>
                  <span className="ccm-add-icon" aria-hidden>
                    +
                  </span>
                  <span className="ccm-add-label">Add Candidate</span>
                  <span className="ccm-add-hint">Click to add a new candidate</span>
                </button>
              ) : null}
            </div>
          ) : null}

          {isDraftElection && electionDetail ? (
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

      {editor && electionDetail && isDraftElection ? (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 p-4 sm:items-center"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeEditor()
          }}
        >
          <div
            role="dialog"
            aria-labelledby="candidate-editor-title"
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-line bg-surface-container p-6 shadow-2xl"
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 id="candidate-editor-title" className="font-headline-md text-headline-md text-on-surface">
                  {editor.mode === 'add' ? 'New candidate' : 'Edit candidate'}
                </h2>
                <p className="mt-1 font-body-sm text-on-surface-variant">Photo uploads use your Supabase storage bucket.</p>
              </div>
              <button
                type="button"
                onClick={closeEditor}
                disabled={submitting}
                className="rounded-full p-2 hover:bg-elevated/40"
              >
                <span className="material-symbols-outlined text-on-surface-variant">close</span>
              </button>
            </div>

            <form className="space-y-5" onSubmit={(ev) => void handleSubmitModal(ev)}>
              <div>
                <label className="ml-1 block font-label-md text-label-md text-on-surface-variant">Portrait</label>
                <input
                  type="file"
                  accept={IMAGE_ACCEPT}
                  onChange={(e) => setFormFile(e.target.files?.[0] ?? null)}
                  className="mt-2 block w-full text-sm text-on-surface-variant file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-4 file:py-2 file:font-semibold file:text-on-primary"
                />
                <p className="mt-1 text-xs text-on-surface-variant">JPEG · PNG · WebP · GIF · max 4 MB</p>
                {editor.mode === 'edit' && editor.candidate.photo_url ? (
                  <label className="mt-3 flex cursor-pointer items-center gap-2 font-body-sm text-on-surface">
                    <input type="checkbox" checked={removePhoto} onChange={(e) => setRemovePhoto(e.target.checked)} />
                    Remove saved photo
                  </label>
                ) : null}
              </div>
              <div>
                <label className="ml-1 block font-label-md text-label-md text-on-surface-variant">Full name</label>
                <input
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3 text-on-surface outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="ml-1 block font-label-md text-label-md text-on-surface-variant">Designation / role</label>
                <input
                  placeholder="e.g. Chairperson, Slate A"
                  value={formDesignation}
                  onChange={(e) => setFormDesignation(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3 text-on-surface outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="ml-1 block font-label-md text-label-md text-on-surface-variant">
                  Manifesto / description
                </label>
                <textarea
                  rows={5}
                  value={formManifesto}
                  onChange={(e) => setFormManifesto(e.target.value)}
                  className="mt-2 w-full resize-none rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3 text-on-surface outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {formError ? (
                <p className="rounded-xl border border-error/30 bg-error-container/10 px-4 py-3 font-body-sm text-error">
                  {formError}
                </p>
              ) : null}

              <div className="flex flex-wrap justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={submitting}
                  className="rounded-xl border border-line px-5 py-3 font-label-md text-on-surface hover:bg-elevated/40"
                  onClick={closeEditor}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-primary px-6 py-3 font-label-md font-bold text-on-primary disabled:opacity-50"
                >
                  {submitting ? 'Saving…' : editor.mode === 'add' ? 'Create candidate' : 'Save changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  )
}
