import type { AuditTimelinePoint } from '@/types/audit'

interface AuditTimelineChartProps {
  points: AuditTimelinePoint[]
  loading?: boolean
}

export function AuditTimelineChart({ points, loading }: AuditTimelineChartProps) {
  const max = Math.max(
    1,
    ...points.map((p) => p.login + p.vote + p.approval + p.edit + p.override),
  )

  if (loading) {
    return <p className="font-body-sm text-on-surface-variant">Loading activity timeline…</p>
  }

  if (points.length === 0) {
    return (
      <p className="flex h-[220px] items-center justify-center font-body-sm text-on-surface-variant">
        No audit events in this period.
      </p>
    )
  }

  return (
    <>
      <div className="relative flex h-[220px] w-full items-end justify-between gap-1 overflow-hidden px-1">
        <div className="pointer-events-none absolute inset-0 flex flex-col justify-between opacity-20">
          <div className="h-px w-full border-t border-line" />
          <div className="h-px w-full border-t border-line" />
          <div className="h-px w-full border-t border-line" />
        </div>
        {points.map((point) => {
          const total = point.login + point.vote + point.approval + point.edit + point.override
          const heightPct = Math.max(6, (total / max) * 100)
          const label = new Date(point.day).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
          })
          return (
            <div
              key={point.day}
              className="flex min-w-0 flex-1 flex-col items-center gap-1"
              title={`${label}: ${total} events`}
            >
              <div
                className="flex w-full max-w-[40px] flex-col justify-end overflow-hidden rounded-t-md"
                style={{ height: `${heightPct}%` }}
              >
                {point.override > 0 ? (
                  <div
                    className="w-full bg-amber-500/80"
                    style={{ flex: point.override }}
                    title={`${point.override} overrides`}
                  />
                ) : null}
                {point.vote > 0 ? (
                  <div className="w-full bg-tertiary/70" style={{ flex: point.vote }} />
                ) : null}
                {point.approval > 0 ? (
                  <div className="w-full bg-secondary/70" style={{ flex: point.approval }} />
                ) : null}
                {point.edit > 0 ? (
                  <div className="w-full bg-primary/50" style={{ flex: point.edit }} />
                ) : null}
                {point.login > 0 ? (
                  <div className="w-full bg-primary/30" style={{ flex: point.login }} />
                ) : null}
              </div>
            </div>
          )
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-4 font-label-sm text-label-sm text-on-surface-variant">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-sm bg-primary/30" /> Login
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-sm bg-primary/50" /> Edit
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-sm bg-secondary/70" /> Approval
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-sm bg-tertiary/70" /> Vote
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-sm bg-amber-500/80" /> Override
        </span>
      </div>
      <div className="mt-2 flex justify-between gap-1 overflow-x-auto font-label-sm text-label-sm text-on-surface-variant">
        {points.map((point) => (
          <span key={point.day} className="min-w-0 flex-1 truncate text-center text-[10px]">
            {new Date(point.day).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </span>
        ))}
      </div>
    </>
  )
}
