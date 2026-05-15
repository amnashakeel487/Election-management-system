import { Link } from 'react-router-dom'

type ElectionCardVariant = 'active' | 'upcoming' | 'completed'

export interface ElectionCardProps {
  variant: ElectionCardVariant
  title: string
  description: string
  detailPath?: string
  timeRemaining?: string
  startsIn?: string
  participationRate?: number
  votesLabel?: string
  eligibleVoters?: string
  idRequirements?: string
  hoverAccent?: 'primary' | 'tertiary'
}

export function ElectionCard({
  variant,
  title,
  description,
  detailPath,
  timeRemaining,
  startsIn,
  participationRate,
  votesLabel,
  eligibleVoters,
  idRequirements,
  hoverAccent = 'primary',
}: ElectionCardProps) {
  const hoverBorder = hoverAccent === 'tertiary' ? 'hover:border-tertiary/30' : 'hover:border-primary/30'
  const titleHover = hoverAccent === 'tertiary' ? 'group-hover:text-tertiary' : 'group-hover:text-primary'

  return (
    <div
      className={`group overflow-hidden rounded-[24px] border border-white/5 bg-[#161B26] transition-all ${hoverBorder}`}
    >
      <div className="p-6">
        <div className="mb-6 flex items-start justify-between">
          {variant === 'active' ? (
            <span className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-primary">
              <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
              <span className="font-label-sm text-label-sm uppercase tracking-wider">Live Now</span>
            </span>
          ) : variant === 'completed' ? (
            <span className="flex items-center gap-1.5 rounded-full bg-on-surface-variant/20 px-3 py-1 text-on-surface-variant">
              <span className="font-label-sm text-label-sm uppercase tracking-wider">Completed</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5 rounded-full bg-tertiary/10 px-3 py-1 text-tertiary">
              <span className="font-label-sm text-label-sm uppercase tracking-wider">{startsIn}</span>
            </span>
          )}
          {variant === 'active' && timeRemaining ? (
            <div className="flex flex-col items-end">
              <span className="font-label-sm text-label-sm uppercase text-on-surface-variant">Time Remaining</span>
              <span className="font-body-md text-body-md font-bold tracking-tight text-on-surface">
                {timeRemaining}
              </span>
            </div>
          ) : variant === 'upcoming' ? (
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-on-surface-variant">notifications</span>
            </div>
          ) : null}
        </div>
        <h3 className={`mb-2 font-headline-md text-headline-md text-on-surface transition-colors ${titleHover}`}>
          {title}
        </h3>
        <p className="mb-6 line-clamp-2 font-body-sm text-body-sm text-on-surface-variant">{description}</p>

        {(variant === 'active' || variant === 'completed') && participationRate !== undefined && votesLabel ? (
          <div className="mb-8 space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-label-md text-label-md text-on-surface-variant">Participation Rate</span>
              <span className="font-label-md text-label-md text-on-surface">{participationRate}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container">
              <div className="h-full rounded-full bg-primary" style={{ width: `${participationRate}%` }} />
            </div>
            <div className="flex justify-between text-on-surface-variant">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">group</span>
                <span className="font-label-sm text-label-sm">{votesLabel}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">verified</span>
                <span className="font-label-sm text-label-sm">Secured</span>
              </div>
            </div>
          </div>
        ) : null}

        {variant === 'upcoming' && eligibleVoters && idRequirements ? (
          <div className="mb-8 flex flex-col gap-3 rounded-xl bg-surface-container-low p-4">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-on-surface-variant">Eligible Voters</span>
              <span className="font-label-sm text-label-sm text-on-surface">{eligibleVoters}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-on-surface-variant">ID Requirements</span>
              <span className="font-label-sm text-label-sm text-on-surface">{idRequirements}</span>
            </div>
          </div>
        ) : null}

        {detailPath ? (
          <Link
            to={detailPath}
            className={
              variant === 'active'
                ? 'block w-full rounded-xl border border-primary/20 bg-primary/5 py-3 text-center font-label-md text-label-md text-primary transition-all hover:bg-primary hover:text-on-primary'
                : 'block w-full rounded-xl border border-outline/10 bg-surface-container-high py-3 text-center font-label-md text-label-md text-on-surface-variant transition-all hover:border-tertiary/20 hover:bg-tertiary/10 hover:text-tertiary'
            }
          >
            {variant === 'active' ? 'Join Election' : 'View Details'}
          </Link>
        ) : variant === 'active' ? (
          <button
            type="button"
            className="w-full rounded-xl border border-primary/20 bg-primary/5 py-3 font-label-md text-label-md text-primary transition-all hover:bg-primary hover:text-on-primary"
          >
            Cast Your Vote
          </button>
        ) : (
          <button
            type="button"
            className="w-full rounded-xl border border-outline/10 bg-surface-container-high py-3 font-label-md text-label-md text-on-surface-variant transition-all hover:border-tertiary/20 hover:bg-tertiary/10 hover:text-tertiary"
          >
            View Details
          </button>
        )}
      </div>
    </div>
  )
}
