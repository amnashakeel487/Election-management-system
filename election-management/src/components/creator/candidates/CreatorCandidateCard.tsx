import type { CSSProperties, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { CANDIDATE_PLACEHOLDER_IMAGES } from '@/constants/electionDetailsAssets'
import type { Candidate } from '@/types/election'
import { candidateInitial, candidatePortraitOrPlaceholder } from '@/utils/candidateDisplay'
import { avatarGradient } from '@/utils/dashboardDisplay'

export const CREATOR_CANDIDATE_CARD_THEMES = [
  { accent: '#1b3a6b', bar: 'linear-gradient(90deg,#1b3a6b,#2451a3)', soft: '#f0f4fa' },
  { accent: '#6c3fc5', bar: 'linear-gradient(90deg,#6c3fc5,#7c3aed)', soft: '#f5f3ff' },
  { accent: '#0891b2', bar: 'linear-gradient(90deg,#06b6d4,#0891b2)', soft: '#ecfeff' },
  { accent: '#059669', bar: 'linear-gradient(90deg,#10b981,#059669)', soft: '#ecfdf5' },
] as const

export type CreatorCandidateCardTheme = (typeof CREATOR_CANDIDATE_CARD_THEMES)[number]

export interface CreatorCandidateCardProps {
  candidate: Candidate
  theme: CreatorCandidateCardTheme
  votes: number
  pct: number
  pctLabel: string
  bio: string
  canManage?: boolean
  onNameClick?: () => void
  onEdit?: () => void
  editHref?: string
  onDelete?: () => void
  deleteDisabled?: boolean
  onView?: () => void
  headerExtra?: ReactNode
}

function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}

function DeleteIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  )
}

export function CreatorCandidateCard({
  candidate,
  theme,
  votes,
  pct,
  pctLabel,
  bio,
  canManage = false,
  onNameClick,
  onEdit,
  editHref,
  onDelete,
  deleteDisabled = false,
  onView,
  headerExtra,
}: CreatorCandidateCardProps) {
  const photo = candidatePortraitOrPlaceholder(candidate, CANDIDATE_PLACEHOLDER_IMAGES)
  const hasPhoto = Boolean(candidate.photo_url?.trim())

  const cardStyle = {
    '--ccm-accent': theme.accent,
    '--ccm-bar': theme.bar,
    '--ccm-soft': theme.soft,
  } as CSSProperties

  const editControl =
    editHref != null ? (
      <Link to={editHref} className="ccm-edit-btn">
        <EditIcon />
        Edit
      </Link>
    ) : (
      <button type="button" className="ccm-edit-btn" onClick={onEdit}>
        <EditIcon />
        Edit
      </button>
    )

  return (
    <article className="ccm-card" style={cardStyle}>
      {headerExtra}
      <div className="ccm-card-body">
        <div className="ccm-avatar-wrap">
          {hasPhoto ? (
            <img src={photo} alt="" className="ccm-avatar" />
          ) : (
            <div className="ccm-avatar-fallback" style={{ background: avatarGradient(candidate.name) }}>
              {candidateInitial(candidate.name)}
            </div>
          )}
        </div>

        <div className="ccm-card-identity">
          {onNameClick ? (
            <button type="button" className="ccm-name" onClick={onNameClick}>
              {candidate.name}
            </button>
          ) : (
            <div className="ccm-name ccm-name--static">{candidate.name}</div>
          )}
          <p className="ccm-party">{candidate.designation?.trim() || 'Candidate'}</p>
        </div>

        <div className="ccm-stats">
          <div className="ccm-votes">
            {votes.toLocaleString()}
            <span className="ccm-votes-label"> votes</span>
          </div>
          <div className="ccm-bar-track">
            <div className="ccm-bar-fill" style={{ width: `${Math.min(100, pct)}%` }} />
          </div>
          <p className="ccm-pct">{pctLabel}</p>
        </div>

        {bio ? <p className="ccm-bio">{bio}</p> : null}

        <div className="ccm-card-actions">
          {canManage ? (
            <>
              {editControl}
              {onDelete ? (
                <button
                  type="button"
                  className="ccm-del-btn"
                  disabled={deleteDisabled}
                  aria-label={`Delete ${candidate.name}`}
                  onClick={onDelete}
                >
                  <DeleteIcon />
                </button>
              ) : null}
            </>
          ) : editHref != null ? (
            <Link to={editHref} className="ccm-edit-btn">
              View details
            </Link>
          ) : onView ? (
            <button type="button" className="ccm-edit-btn" onClick={onView}>
              View details
            </button>
          ) : null}
        </div>
      </div>
    </article>
  )
}
