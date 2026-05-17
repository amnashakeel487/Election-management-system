import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { CANDIDATE_PLACEHOLDER_IMAGES } from '@/constants/electionDetailsAssets'
import type { Candidate } from '@/types/election'
import { candidatePortraitOrPlaceholder } from '@/utils/candidateDisplay'

const IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp,image/gif'
const MAX_MB = 4

export interface CandidateEditorModalProps {
  mode: 'add' | 'edit'
  candidate?: Candidate
  open: boolean
  submitting: boolean
  error: string | null
  onClose: () => void
  onSubmit: (payload: {
    name: string
    designation: string
    manifesto: string
    file: File | null
    removePhoto: boolean
  }) => void
}

export function CandidateEditorModal({
  mode,
  candidate,
  open,
  submitting,
  error,
  onClose,
  onSubmit,
}: CandidateEditorModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [name, setName] = useState('')
  const [designation, setDesignation] = useState('')
  const [manifesto, setManifesto] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [removePhoto, setRemovePhoto] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setName(candidate?.name ?? '')
    setDesignation(candidate?.designation ?? '')
    setManifesto(candidate?.description ?? '')
    setFile(null)
    setRemovePhoto(false)
    setLocalError(null)
  }, [open, candidate])

  const previewUrl = useMemo(() => {
    if (file) return URL.createObjectURL(file)
    if (removePhoto) return null
    if (candidate?.photo_url?.trim()) return candidate.photo_url.trim()
    if (candidate) return candidatePortraitOrPlaceholder(candidate, CANDIDATE_PLACEHOLDER_IMAGES)
    return null
  }, [file, removePhoto, candidate])

  useEffect(() => {
    if (!file || !previewUrl?.startsWith('blob:')) return
    return () => URL.revokeObjectURL(previewUrl)
  }, [file, previewUrl])

  if (!open) return null

  function pickFile(next: File | null) {
    setLocalError(null)
    if (!next) {
      setFile(null)
      return
    }
    if (next.size > MAX_MB * 1024 * 1024) {
      setLocalError(`Photo must be ${MAX_MB} MB or smaller.`)
      return
    }
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowed.includes(next.type)) {
      setLocalError('Use JPEG, PNG, WebP, or GIF.')
      return
    }
    setFile(next)
    setRemovePhoto(false)
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      setLocalError('Name is required.')
      return
    }
    onSubmit({
      name: name.trim(),
      designation: designation.trim(),
      manifesto: manifesto.trim(),
      file,
      removePhoto,
    })
  }

  const displayError = error ?? localError

  return (
    <div
      className="ccm-modal-backdrop"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose()
      }}
    >
      <div
        role="dialog"
        aria-labelledby="candidate-editor-title"
        className="ccm-modal"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="ccm-modal-head">
          <div>
            <h2 id="candidate-editor-title" className="ccm-modal-title">
              {mode === 'add' ? 'Add candidate' : 'Edit candidate'}
            </h2>
            <p className="ccm-modal-sub">
              {mode === 'add'
                ? 'Upload a photo and enter ballot details for this member.'
                : 'Update photo, name, designation, or manifesto.'}
            </p>
          </div>
          <button type="button" className="ccm-modal-close" onClick={onClose} disabled={submitting} aria-label="Close">
            ×
          </button>
        </div>

        <form className="ccm-modal-form" onSubmit={handleSubmit}>
          <div
            className={`ccm-photo-zone${dragOver ? ' drag-over' : ''}`}
            onDragOver={(e) => {
              e.preventDefault()
              setDragOver(true)
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragOver(false)
              pickFile(e.dataTransfer.files?.[0] ?? null)
            }}
          >
            <button type="button" className="ccm-photo-zone-btn" onClick={() => fileInputRef.current?.click()}>
              {previewUrl ? (
                <img src={previewUrl} alt="" className="ccm-photo-preview" />
              ) : (
                <div className="ccm-photo-placeholder">
                  <span className="ccm-photo-icon">+</span>
                  <span>Upload candidate photo</span>
                  <span className="ccm-photo-hint">JPEG, PNG, WebP, GIF · max {MAX_MB} MB</span>
                </div>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept={IMAGE_ACCEPT}
              className="ccm-photo-input"
              onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
            />
            <button
              type="button"
              className="ccm-photo-change"
              onClick={() => fileInputRef.current?.click()}
            >
              {previewUrl ? 'Change photo' : 'Choose file'}
            </button>
          </div>

          {mode === 'edit' && candidate?.photo_url ? (
            <label className="ccm-check-row">
              <input type="checkbox" checked={removePhoto} onChange={(e) => setRemovePhoto(e.target.checked)} />
              Remove current photo
            </label>
          ) : null}

          <div className="ccm-field">
            <label htmlFor="cand-name">Full name *</label>
            <input
              id="cand-name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ayesha Kamran"
            />
          </div>

          <div className="ccm-field">
            <label htmlFor="cand-designation">Designation / role</label>
            <input
              id="cand-designation"
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              placeholder="e.g. President candidate, Slate A"
            />
          </div>

          <div className="ccm-field">
            <label htmlFor="cand-manifesto">Manifesto / description</label>
            <textarea
              id="cand-manifesto"
              rows={5}
              value={manifesto}
              onChange={(e) => setManifesto(e.target.value)}
              placeholder="Platform statement shown to voters…"
            />
          </div>

          {displayError ? <p className="ccm-form-error">{displayError}</p> : null}

          <div className="ccm-modal-actions">
            <button type="button" className="ccm-btn-ghost" disabled={submitting} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="ccm-add-btn" disabled={submitting || !name.trim()}>
              {submitting ? 'Saving…' : mode === 'add' ? 'Add candidate' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
