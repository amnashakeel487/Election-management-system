import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { CandidateResultRow } from '@/types/electionResults'
import { RESULTS_CHART_COLORS } from '@/constants/resultsChartColors'

interface ResultsVoteBarChartProps {
  candidates: CandidateResultRow[]
  totalVotes: number
}

export function ResultsVoteBarChart({ candidates, totalVotes }: ResultsVoteBarChartProps) {
  const data = candidates.map((c, i) => ({
    name: c.name.length > 18 ? `${c.name.slice(0, 16)}…` : c.name,
    fullName: c.name,
    votes: c.vote_count,
    fill: RESULTS_CHART_COLORS[i % RESULTS_CHART_COLORS.length],
    percent: totalVotes > 0 ? Math.round((c.vote_count / totalVotes) * 1000) / 10 : 0,
  }))

  return (
    <div className="glass-panel h-[320px] rounded-[24px] p-6">
      <h3 className="mb-4 font-headline-md text-headline-md text-on-surface">Vote Distribution</h3>
      <ResponsiveContainer width="100%" height="85%">
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" horizontal={false} />
          <XAxis type="number" stroke="#8c909f" fontSize={12} allowDecimals={false} />
          <YAxis type="category" dataKey="name" stroke="#8c909f" fontSize={11} width={100} />
          <Tooltip
            contentStyle={{
              background: '#1b202b',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 12,
            }}
            labelFormatter={(_, payload) =>
              (payload?.[0]?.payload as { fullName?: string })?.fullName ?? ''
            }
            formatter={(value: number) => [`${value} votes`, 'Votes']}
          />
          <Bar dataKey="votes" radius={[0, 8, 8, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
