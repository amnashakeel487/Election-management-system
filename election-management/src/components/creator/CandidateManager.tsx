import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
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
import type { Candidate, Election, ElectionWithCandidates } from '@/types/election'
import { candidatePortraitOrPlaceholder } from '@/utils/candidateDisplay'

type EditorOpen = { mode: 'add' } | { mode: 'edit'; candidate: Candidate }

const IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp,image/gif'

function clampText(s: string, max = 140): string {
  const t = s.trim()
  if (t.length <= max) return t
  return `${t.slice(0, max)}…`
}

interface CandidateManagerProps {
  creatorId: string
}

/** Creator workspace: manage candidates per election (draft = full CRUD). */
export function CandidateManager({ creatorId }: CandidateManagerProps) {
  const [searchParams, setSearchParams] = useSearchParams()
  const paramElectionId = searchParams.get('election')

  const [elections, setElections] = useState<Election[]>([])
  const [selectedElectionId, setSelectedElectionId] = useState('')
  const [electionDetail, setElectionDetail] = useState<ElectionWithCandidates | null>(null)
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
      const next = (draft ?? elections[0])!.id
      return next
    })
  }, [elections, loadingList, paramElectionId])

  useEffect(() => {
    if (!selectedElectionId) {
      setElectionDetail(null)
      return
    }
    let cancelled = false
    async function load() {
      setLoadingDetail(true)
      setWorkspaceError(null)
      try {
        const row = await fetchElectionById(selectedElectionId)
        if (cancelled) return
        if (!row || row.creator_id !== creatorId) {
          setElectionDetail(null)
          setWorkspaceError('Election not found.')
          return
        }
        setElectionDetail(row)
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

  return (
    <div className="space-y-gutter font-body-md">
      <div className="flex flex-col gap-4 rounded-[24px] border border-line bg-surface-container-low p-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h3 className="font-headline-md text-headline-md text-on-surface">Election</h3>
          <p className="mt-1 max-w-xl font-body-sm text-body-sm text-on-surface-variant">
            Select a draft poll to add, edit, or remove candidates—including photos and bios. For published or active
            elections this page is <strong className="text-on-surface">view only</strong>.
          </p>
        </div>
        <div className="flex min-w-[240px] flex-col gap-2">
          <label className="font-label-sm text-label-sm text-on-surface-variant">Active election</label>
          <select
            value={selectedElectionId}
            onChange={(e) => handleSelectElection(e.target.value)}
            disabled={loadingList || elections.length === 0}
            className="rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3 font-body-md text-on-surface outline-none focus:ring-2 focus:ring-primary"
          >
            {elections.length === 0 ? (
              <option value="">No elections yet</option>
            ) : null}
            {elections.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.title || 'Untitled'} · {ev.status}
              </option>
            ))}
          </select>
        </div>
      </div>

      {workspaceError ? (
        <p className="rounded-xl border border-error/30 bg-error-container/10 px-4 py-3 font-body-sm text-error">
          {workspaceError}
        </p>
      ) : null}

      {!loadingList && elections.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-line p-12 text-center">
          <p className="font-body-md text-on-surface-variant">
            Create an election first, then return here to add candidates with photos.
          </p>
          <Link
            className="mt-4 inline-block font-label-md font-bold text-primary hover:underline"
            to="/creator/elections/new"
          >
            New election →
          </Link>
        </div>
      ) : null}

      {selectedElectionId && electionDetail ? (
        <div className="rounded-[24px] border border-line bg-surface-container-low p-6">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="font-headline-md text-headline-md text-on-surface">{electionDetail.title}</h3>
              <p className="mt-1 font-label-sm uppercase tracking-wide text-on-surface-variant">
                Status: {electionDetail.status}
                {!isDraftElection ? ' · view only' : ''}
              </p>
              {loadingDetail ? <p className="mt-2 font-body-sm text-on-surface-variant">Refreshing…</p> : null}
            </div>
            {isDraftElection ? (
              <button
                type="button"
                onClick={openAdd}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 font-label-md font-bold text-on-primary shadow-lg shadow-primary/20"
              >
                <span className="material-symbols-outlined text-[20px]">person_add</span>
                Add candidate
              </button>
            ) : null}
          </div>

          {sortedCandidates.length === 0 ? (
            <p className="font-body-md text-on-surface-variant">
              No candidates yet.
              {isDraftElection ? ' Use “Add candidate” to create your ballot options.' : ''}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-line font-label-md text-label-sm uppercase tracking-wide text-on-surface-variant">
                    <th className="py-3 pr-4 font-medium">Photo</th>
                    <th className="py-3 pr-4 font-medium">Name</th>
                    <th className="py-3 pr-4 font-medium">Designation</th>
                    <th className="py-3 pr-4 font-medium">Manifesto</th>
                    {isDraftElection ? <th className="py-3 pl-4 text-right font-medium">Actions</th> : null}
                  </tr>
                </thead>
                <tbody>
                  {sortedCandidates.map((c) => (
                    <tr key={c.id} className="border-b border-line last:border-none">
                      <td className="py-4 pr-4 align-middle">
                        <img
                          src={candidatePortraitOrPlaceholder(c, CANDIDATE_PLACEHOLDER_IMAGES)}
                          alt=""
                          className="h-14 w-14 rounded-xl object-cover"
                        />
                      </td>
                      <td className="py-4 pr-4 align-middle font-body-md text-on-surface">{c.name}</td>
                      <td className="max-w-[200px] py-4 pr-4 align-middle font-body-sm text-on-surface-variant">
                        {c.designation?.trim() || '—'}
                      </td>
                      <td className="py-4 pr-4 align-middle font-body-sm text-on-surface-variant">
                        {clampText(c.description ?? '') || '—'}
                      </td>
                      {isDraftElection ? (
                        <td className="flex justify-end gap-3 py-4 pl-4 align-middle">
                          <button
                            type="button"
                            className="font-label-sm font-bold text-primary hover:underline"
                            onClick={() => openEdit(c)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="font-label-sm font-bold text-error hover:underline"
                            onClick={() => void handleDelete(c)}
                          >
                            Delete
                          </button>
                        </td>
                      ) : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {isDraftElection ? (
            <div className="mt-8 flex flex-wrap gap-4 border-t border-line pt-6">
              <Link
                to={`/creator/elections/${electionDetail.id}/edit`}
                className="inline-flex items-center gap-2 font-label-md font-bold text-primary hover:underline"
              >
                <span className="material-symbols-outlined text-[18px]">edit_calendar</span>
                Continuation wizard (timing & publish)
              </Link>
            </div>
          ) : null}
        </div>
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
