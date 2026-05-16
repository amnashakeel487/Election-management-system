import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { VoteTrendPoint } from '@/types/electionResults'

interface ResultsVoteTrendChartProps {
  voteTrend: VoteTrendPoint[]
}

export function ResultsVoteTrendChart({ voteTrend }: ResultsVoteTrendChartProps) {
  const data = voteTrend.map((p) => ({
    label: new Date(p.hour).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
    }),
    votes: p.votes,
  }))

  if (data.length === 0) {
    return (
      <div className="glass-panel flex h-[280px] items-center justify-center rounded-[24px] p-6">
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Vote trend appears as ballots are cast
        </p>
      </div>
    )
  }

  return (
    <div className="glass-panel h-[280px] rounded-[24px] p-6">
      <h3 className="mb-4 font-headline-md text-headline-md text-on-surface">Votes over time</h3>
      <ResponsiveContainer width="100%" height="85%">
        <AreaChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
          <defs>
            <linearGradient id="voteTrendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6C3FC5" stopOpacity={0.45} />
              <stop offset="100%" stopColor="#6C3FC5" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
          <XAxis dataKey="label" stroke="#8c909f" fontSize={10} tickMargin={6} />
          <YAxis stroke="#8c909f" fontSize={11} allowDecimals={false} width={36} />
          <Tooltip
            contentStyle={{
              background: '#1b202b',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 12,
            }}
            formatter={(value: number) => [`${value} votes`, 'Ballots']}
          />
          <Area
            type="monotone"
            dataKey="votes"
            stroke="#6C3FC5"
            fill="url(#voteTrendFill)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
