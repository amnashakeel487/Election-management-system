import { CANDIDATE_PLACEHOLDER_IMAGES } from '@/constants/electionDetailsAssets'
import type { Candidate } from '@/types/election'
import { avatarGradient } from '@/utils/dashboardDisplay'
import { candidateInitial, candidatePortraitOrPlaceholder } from '@/utils/candidateDisplay'

export interface CandidateViewModalProps {
  candidate: Candidate | null
  voteCount?: number
  votePct?: number
  open: boolean
  canManage: boolean
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
}

export function CandidateViewModal({
  candidate,
  voteCount = 0,
  votePct = 0,
  open,
  canManage,
  onClose,
  onEdit,
  onDelete,
}: CandidateViewModalProps) {
  if (!open || !candidate) return null

  const photo = candidatePortraitOrPlaceholder(candidate, CANDIDATE_PLACEHOLDER_IMAGES)
  const hasPhoto = Boolean(candidate.photo_url?.trim())

  return (
    <div
      className="ccm-modal-backdrop"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div role="dialog" aria-labelledby="candidate-view-title" className="ccm-modal ccm-view-modal">
        <div className="ccm-modal-head">
          <div>
            <h2 id="candidate-view-title" className="ccm-modal-title">
              {candidate.name}
            </h2>
            <p className="ccm-modal-sub">{candidate.designation?.trim() || 'Candidate'}</p>
          </div>
          <button type="button" className="ccm-modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="ccm-view-body">
          {hasPhoto ? (
            <img src={photo} alt="" className="ccm-view-photo" />
          ) : (
            <div className="ccm-view-photo-fallback" style={{ background: avatarGradient(candidate.name) }}>
              {candidateInitial(candidate.name)}
            </div>
          )}

          {voteCount > 0 ? (
            <div className="ccm-view-stats">
              <span>
                <strong>{voteCount.toLocaleString()}</strong> votes
              </span>
              <span>{votePct}% of total</span>
            </div>
          ) : null}

          <div className="ccm-view-section">
            <div className="ccm-view-label">Manifesto / description</div>
            <p className="ccm-view-text">{candidate.description?.trim() || 'No manifesto provided.'}</p>
          </div>
        </div>

        <div className="ccm-modal-actions">
          <button type="button" className="ccm-btn-ghost" onClick={onClose}>
            Close
          </button>
          {canManage ? (
            <>
              <button type="button" className="ccm-edit-btn" style={{ flex: 1 }} onClick={onEdit}>
                Edit
              </button>
              <button type="button" className="ccm-del-btn" style={{ width: 48, height: 42 }} onClick={onDelete}>
                <svg viewBox="0 0 24 24" aria-hidden>
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}
