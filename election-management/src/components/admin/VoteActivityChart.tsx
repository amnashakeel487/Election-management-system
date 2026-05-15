import { useEffect, useState } from 'react'
import {
  fetchVoteActivity,
  type VoteActivityRange,
} from '@/services/adminDashboardService'

const RANGES: { days: VoteActivityRange; label: string }[] = [
  { days: 1, label: '1D' },
  { days: 7, label: '7D' },
  { days: 30, label: '30D' },
]

export function VoteActivityChart() {
  const [range, setRange] = useState<VoteActivityRange>(7)
  const [points, setPoints] = useState<{ label: string; count: number }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    void fetchVoteActivity(range)
      .then((data) => {
        if (!cancelled) setPoints(data)
      })
      .catch(() => {
        if (!cancelled) setPoints([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [range])

  const max = Math.max(1, ...points.map((p) => p.count))

  return (
    <div className="col-span-12 overflow-hidden rounded-[24px] border border-white/5 bg-surface-container p-lg lg:col-span-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h3 className="font-headline-md text-headline-md text-on-surface">Vote Activity Trends</h3>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Votes recorded in the audit trail
          </p>
        </div>
        <div className="flex gap-2">
          {RANGES.map(({ days, label }) => (
            <button
              key={days}
              type="button"
              onClick={() => setRange(days)}
              className={
                range === days
                  ? 'rounded-lg bg-primary px-4 py-2 font-label-sm text-label-sm text-on-primary transition-all'
                  : 'rounded-lg border border-white/5 bg-surface-container-high px-4 py-2 font-label-sm text-label-sm transition-all hover:bg-surface-container-highest'
              }
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      {loading ? (
        <p className="font-body-sm text-on-surface-variant">Loading vote activity…</p>
      ) : points.every((p) => p.count === 0) ? (
        <p className="flex h-[300px] items-center justify-center font-body-sm text-on-surface-variant">
          No votes in this period yet.
        </p>
      ) : (
        <>
          <div className="relative flex h-[300px] w-full items-end justify-between gap-2 overflow-hidden px-2">
            <div className="pointer-events-none absolute inset-0 flex flex-col justify-between opacity-20">
              <div className="h-px w-full border-t border-white/20" />
              <div className="h-px w-full border-t border-white/20" />
              <div className="h-px w-full border-t border-white/20" />
              <div className="h-px w-full border-t border-white/20" />
            </div>
            {points.map((point) => (
              <div key={point.label} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                <span className="font-label-sm text-label-sm text-on-surface-variant">{point.count}</span>
                <div
                  className="w-full max-w-[48px] rounded-t-lg bg-gradient-to-t from-primary/40 to-primary transition-all"
                  style={{ height: `${Math.max(8, (point.count / max) * 100)}%` }}
                  title={`${point.label}: ${point.count} votes`}
                />
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-between gap-1 overflow-x-auto px-2 font-label-sm text-label-sm text-on-surface-variant">
            {points.map((point) => (
              <span key={point.label} className="min-w-0 flex-1 truncate text-center">
                {point.label}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
