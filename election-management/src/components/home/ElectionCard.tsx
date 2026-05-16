import { Link } from 'react-router-dom'

export type LandingElectionPhase = 'upcoming' | 'active' | 'completed'

export interface ElectionCardProps {
  title: string
  description: string | null
  category?: string | null
  phase: LandingElectionPhase
  detailPath: string
  /** Primary countdown label (e.g. "Voting ends") */
  timeLabel: string
  /** Human-readable remaining / until value */
  timeValue: string
  maxVoters: number
  registeredCount: number
  /** When false, ballot total is hidden (live election without real-time results). */
  showBallotCount: boolean
  ballotCount: number
}

function phaseBadge(phase: LandingElectionPhase) {
  if (phase === 'active') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-status-active-bg px-2.5 py-1 font-label-sm text-label-sm font-semibold uppercase tracking-wide text-status-active-fg ring-1 ring-status-active-fg/20">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-40" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
        </span>
        Active
      </span>
    )
  }
  if (phase === 'upcoming') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-status-info-bg px-2.5 py-1 font-label-sm text-label-sm font-semibold uppercase tracking-wide text-status-info-fg ring-1 ring-status-info-fg/20">
        Upcoming
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-status-done-bg px-2.5 py-1 font-label-sm text-label-sm font-semibold uppercase tracking-wide text-status-done-fg ring-1 ring-status-done-fg/20">
      Completed
    </span>
  )
}

export function ElectionCard({
  title,
  description,
  category,
  phase,
  detailPath,
  timeLabel,
  timeValue,
  maxVoters,
  registeredCount,
  showBallotCount,
  ballotCount,
}: ElectionCardProps) {
  const desc = description?.trim() || 'No description provided.'

  return (
    <article className="fv-card group flex h-full flex-col bg-surface">
      <div className="flex flex-1 flex-col p-4 sm:p-6">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">{phaseBadge(phase)}</div>
          {category?.trim() ? (
            <span className="max-w-[10rem] truncate rounded-lg bg-surface-container-high px-2.5 py-1 font-label-sm text-label-sm text-on-surface-variant ring-1 ring-line sm:max-w-[12rem]">
              {category.trim()}
            </span>
          ) : null}
        </div>

        <h3 className="mb-2 line-clamp-2 font-headline-md text-headline-md text-on-surface transition-colors group-hover:text-primary">
          {title}
        </h3>
        <p className="mb-5 line-clamp-3 flex-1 font-body-sm text-body-sm leading-relaxed text-on-surface-variant">{desc}</p>

        <div className="mb-5 grid grid-cols-1 gap-3 rounded-xl border border-line bg-surface-container/60 p-3 sm:grid-cols-3 sm:p-4">
          <div className="min-w-0 sm:border-r sm:border-line sm:pr-3">
            <p className="font-label-sm text-label-sm uppercase tracking-wide text-on-surface-variant">{timeLabel}</p>
            <p className="mt-1 truncate font-headline-sm text-headline-sm tabular-nums text-on-surface">{timeValue}</p>
          </div>
          <div className="min-w-0 sm:border-r sm:border-line sm:px-3">
            <p className="font-label-sm text-label-sm uppercase tracking-wide text-on-surface-variant">Ballots cast</p>
            <p className="mt-1 font-headline-sm text-headline-sm tabular-nums text-on-surface">
              {showBallotCount ? ballotCount.toLocaleString() : '—'}
            </p>
            {!showBallotCount && phase === 'active' ? (
              <p className="mt-0.5 text-[11px] leading-tight text-on-surface-variant">Tally after polls close</p>
            ) : null}
          </div>
          <div className="min-w-0 sm:pl-0">
            <p className="font-label-sm text-label-sm uppercase tracking-wide text-on-surface-variant">Registered</p>
            <p className="mt-1 font-headline-sm text-headline-sm tabular-nums text-on-surface">
              {registeredCount.toLocaleString()}
              <span className="font-body-sm font-normal text-on-surface-variant"> / {maxVoters.toLocaleString()}</span>
            </p>
          </div>
        </div>

        <Link to={detailPath} className="btn-gradient-primary mt-auto flex w-full items-center justify-center gap-2 py-3.5 text-center sm:py-4">
          Election details
          <span className="material-symbols-outlined text-[20px] transition-transform group-hover:translate-x-0.5">
            arrow_forward
          </span>
        </Link>
      </div>
    </article>
  )
}
