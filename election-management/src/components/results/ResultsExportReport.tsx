import { forwardRef } from 'react'
import type { ElectionResultsPayload, WinnerOutcome } from '@/types/electionResults'
import type { ResultsExportMeta } from '@/utils/resultsExportCsv'
import { candidateVoteShare, formatTurnoutPercent, resultsPhaseLabel } from '@/utils/resultsDisplay'
import { formatSubmissionDate } from '@/utils/formatDate'
import { formatElectionCode } from '@/utils/electionTime'

interface ResultsExportReportProps {
  results: ElectionResultsPayload
  meta: ResultsExportMeta
  outcome: WinnerOutcome
}

function winnerText(outcome: WinnerOutcome): string {
  if (outcome.type === 'winner') {
    return `${outcome.candidate.name} (${outcome.vote_count.toLocaleString()} votes, ${outcome.share_percent}%)`
  }
  if (outcome.type === 'tie') {
    return `Tie — ${outcome.candidates.map((c) => c.name).join(', ')} (${outcome.vote_count} votes each)`
  }
  return 'No winner yet'
}

export const ResultsExportReport = forwardRef<HTMLDivElement, ResultsExportReportProps>(
  function ResultsExportReport({ results, meta, outcome }, ref) {
    const sorted = [...results.candidates].sort((a, b) => b.vote_count - a.vote_count)
    const maxVotes = Math.max(1, ...sorted.map((c) => c.vote_count))
    const winnerIds =
      outcome.type === 'winner'
        ? new Set([outcome.candidate.candidate_id])
        : outcome.type === 'tie'
          ? new Set(outcome.candidates.map((c) => c.candidate_id))
          : new Set<string>()

    return (
      <div
        ref={ref}
        style={{
          width: 720,
          padding: 32,
          background: '#ffffff',
          color: '#0f172a',
          fontFamily: "'Segoe UI', Sora, system-ui, sans-serif",
          fontSize: 13,
          lineHeight: 1.5,
        }}
      >
        <div style={{ borderBottom: '3px solid #1B3A6B', paddingBottom: 16, marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: '#2451A3' }}>
            FORTRESSVOTE
          </div>
          <h1 style={{ margin: '8px 0 4px', fontSize: 22, fontWeight: 800, color: '#0f172a' }}>{results.title}</h1>
          <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>
            Election results report · {formatElectionCode(results.election_id)} · {resultsPhaseLabel(results)}
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 12,
            marginBottom: 20,
            fontSize: 12,
          }}
        >
          <div>
            <p style={{ margin: '0 0 4px', color: '#64748b' }}>Exported</p>
            <p style={{ margin: 0, fontWeight: 600 }}>{formatSubmissionDate(meta.exportedAt)}</p>
          </div>
          <div>
            <p style={{ margin: '0 0 4px', color: '#64748b' }}>Voting window</p>
            <p style={{ margin: 0, fontWeight: 600 }}>
              {formatSubmissionDate(results.start_date)} – {formatSubmissionDate(results.end_date)}
            </p>
          </div>
          <div>
            <p style={{ margin: '0 0 4px', color: '#64748b' }}>Creator</p>
            <p style={{ margin: 0, fontWeight: 600 }}>{meta.creatorName}</p>
            <p style={{ margin: '2px 0 0', color: '#64748b' }}>{meta.creatorEmail}</p>
            {meta.creatorOrganization ? (
              <p style={{ margin: '2px 0 0', color: '#64748b' }}>{meta.creatorOrganization}</p>
            ) : null}
          </div>
          <div>
            <p style={{ margin: '0 0 4px', color: '#64748b' }}>Turnout</p>
            <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#2451A3' }}>
              {formatTurnoutPercent(results.turnout_percent)}
            </p>
            <p style={{ margin: '4px 0 0', color: '#64748b' }}>
              {results.total_votes.toLocaleString()} / {results.registered_voters.toLocaleString()} registered
            </p>
          </div>
        </div>

        <div
          style={{
            background: '#EFF4FF',
            borderRadius: 12,
            padding: 14,
            marginBottom: 20,
            border: '1px solid #BFDBFE',
          }}
        >
          <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, color: '#2451A3' }}>WINNER</p>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>{winnerText(outcome)}</p>
        </div>

        <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, color: '#334155' }}>Vote distribution</p>
        <div style={{ marginBottom: 24 }}>
          {sorted.map((c) => {
            const pct = (c.vote_count / maxVotes) * 100
            const share = candidateVoteShare(c.vote_count, results.total_votes)
            return (
              <div key={c.candidate_id} style={{ marginBottom: 10 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: 4,
                    fontSize: 12,
                  }}
                >
                  <span style={{ fontWeight: winnerIds.has(c.candidate_id) ? 700 : 500 }}>
                    {c.name}
                    {winnerIds.has(c.candidate_id) ? ' ★' : ''}
                  </span>
                  <span style={{ fontFamily: 'monospace', color: '#2451A3' }}>
                    {c.vote_count.toLocaleString()} ({share}%)
                  </span>
                </div>
                <div style={{ height: 10, background: '#e2e8f0', borderRadius: 5, overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${pct}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg,#2451A3,#6C3FC5)',
                      borderRadius: 5,
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: '#f1f5f9' }}>
              <th style={{ textAlign: 'left', padding: '8px 10px', borderBottom: '2px solid #cbd5e1' }}>Candidate</th>
              <th style={{ textAlign: 'right', padding: '8px 10px', borderBottom: '2px solid #cbd5e1' }}>Votes</th>
              <th style={{ textAlign: 'right', padding: '8px 10px', borderBottom: '2px solid #cbd5e1' }}>Share</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((c) => (
              <tr key={c.candidate_id}>
                <td style={{ padding: '8px 10px', borderBottom: '1px solid #e2e8f0' }}>
                  {c.name}
                  {winnerIds.has(c.candidate_id) ? ' (Winner)' : ''}
                </td>
                <td style={{ padding: '8px 10px', borderBottom: '1px solid #e2e8f0', textAlign: 'right' }}>
                  {c.vote_count.toLocaleString()}
                </td>
                <td style={{ padding: '8px 10px', borderBottom: '1px solid #e2e8f0', textAlign: 'right' }}>
                  {candidateVoteShare(c.vote_count, results.total_votes)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {results.vote_trend.length > 0 ? (
          <>
            <p style={{ margin: '20px 0 10px', fontSize: 12, fontWeight: 700, color: '#334155' }}>Vote trend (by hour)</p>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{ textAlign: 'left', padding: 6, borderBottom: '1px solid #e2e8f0' }}>Hour (UTC)</th>
                  <th style={{ textAlign: 'right', padding: 6, borderBottom: '1px solid #e2e8f0' }}>Votes</th>
                </tr>
              </thead>
              <tbody>
                {results.vote_trend.map((p) => (
                  <tr key={p.hour}>
                    <td style={{ padding: 6, borderBottom: '1px solid #f1f5f9' }}>{p.hour}</td>
                    <td style={{ padding: 6, borderBottom: '1px solid #f1f5f9', textAlign: 'right' }}>{p.votes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        ) : null}

        <p style={{ marginTop: 24, fontSize: 10, color: '#94a3b8', textAlign: 'center' }}>
          Generated by FortressVote · Confidential election record
        </p>
      </div>
    )
  },
)
