import type { AuditTransparencySummary } from '@/types/audit'
import { formatRelativeTime } from '@/utils/formatDate'

interface AuditTransparencyStatsProps {
  summary: AuditTransparencySummary | null
  loading: boolean
}

const ACCENT_CLASS: Record<string, string> = {
  blue: 'vs-stat-card--blue',
  green: 'vs-stat-card--green',
  purple: 'vs-stat-card--purple',
  amber: 'vs-stat-card--cyan',
  red: 'vs-stat-card--purple',
}

function StatCard({
  label,
  value,
  sub,
  accent = 'blue',
}: {
  label: string
  value: number | string
  sub?: string
  accent?: keyof typeof ACCENT_CLASS
}) {
  return (
    <div className={`vs-stat-card ${ACCENT_CLASS[accent] ?? ''}`}>
      <div className="vs-stat-num">{value}</div>
      <div className="vs-stat-label">{label}</div>
      {sub ? <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">{sub}</p> : null}
    </div>
  )
}

export function AuditTransparencyStats({ summary, loading }: AuditTransparencyStatsProps) {
  if (loading && !summary) {
    return (
      <div className="vs-stat-grid">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="vs-stat-card">
            <p className="vs-stat-label">Loading…</p>
          </div>
        ))}
      </div>
    )
  }

  const s = summary
  return (
    <div className="vs-stat-grid">
      <StatCard
        label="Events in range"
        value={s?.total_in_range ?? 0}
        sub={`${s?.total_24h ?? 0} in last 24h`}
        accent="blue"
      />
      <StatCard label="Logins" value={s?.logins ?? 0} accent="blue" />
      <StatCard label="Votes" value={s?.votes ?? 0} accent="green" />
      <StatCard label="Approvals" value={s?.approvals ?? 0} accent="purple" />
      <StatCard label="Edits" value={s?.edits ?? 0} accent="amber" />
      <StatCard
        label="Admin overrides"
        value={s?.overrides ?? 0}
        sub={
          s?.last_event_at
            ? `Last event ${formatRelativeTime(s.last_event_at)}`
            : 'No events yet'
        }
        accent="red"
      />
    </div>
  )
}
