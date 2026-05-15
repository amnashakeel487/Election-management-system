import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import type { CandidateResultRow } from '@/types/electionResults'
import { RESULTS_CHART_COLORS } from '@/constants/resultsChartColors'

interface ResultsVotePieChartProps {
  candidates: CandidateResultRow[]
  totalVotes: number
}

export function ResultsVotePieChart({ candidates, totalVotes }: ResultsVotePieChartProps) {
  const data = candidates
    .filter((c) => c.vote_count > 0)
    .map((c, i) => ({
      name: c.name,
      value: c.vote_count,
      fill: RESULTS_CHART_COLORS[i % RESULTS_CHART_COLORS.length],
    }))

  if (data.length === 0) {
    return (
      <div className="glass-panel flex h-[320px] items-center justify-center rounded-[24px] p-6">
        <p className="font-body-sm text-body-sm text-on-surface-variant">No votes recorded yet</p>
      </div>
    )
  }

  return (
    <div className="glass-panel h-[320px] rounded-[24px] p-6">
      <h3 className="mb-4 font-headline-md text-headline-md text-on-surface">Share of Votes</h3>
      <ResponsiveContainer width="100%" height="85%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: '#1b202b',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 12,
            }}
            formatter={(value: number) => {
              const pct = totalVotes > 0 ? Math.round((value / totalVotes) * 1000) / 10 : 0
              return [`${value} (${pct}%)`, 'Votes']
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
