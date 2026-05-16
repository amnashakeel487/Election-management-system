import type { ElectionResultsPayload, WinnerOutcome } from '@/types/electionResults'
import { candidateVoteShare } from '@/utils/resultsDisplay'
import { formatSubmissionDate } from '@/utils/formatDate'

export interface ResultsExportMeta {
  exportedAt: string
  creatorName: string
  creatorEmail: string
  creatorOrganization: string | null
}

function csvCell(value: string | number): string {
  return `"${String(value).replace(/"/g, '""')}"`
}

function winnerLabel(outcome: WinnerOutcome): string {
  if (outcome.type === 'winner') return outcome.candidate.name
  if (outcome.type === 'tie') return `Tie: ${outcome.candidates.map((c) => c.name).join(', ')}`
  return '—'
}

export function buildResultsCsv(
  results: ElectionResultsPayload,
  meta: ResultsExportMeta,
  outcome: WinnerOutcome,
): string {
  const lines: string[] = []
  const summary: Array<[string, string | number]> = [
    ['Report', 'FortressVote Election Results'],
    ['Exported at', formatSubmissionDate(meta.exportedAt)],
    ['Election title', results.title],
    ['Election ID', results.election_id],
    ['Status', results.status],
    ['Voting start', formatSubmissionDate(results.start_date)],
    ['Voting end', formatSubmissionDate(results.end_date)],
    ['Creator name', meta.creatorName],
    ['Creator email', meta.creatorEmail],
    ['Creator organization', meta.creatorOrganization ?? ''],
    ['Registered voters', results.registered_voters],
    ['Total votes', results.total_votes],
    ['Turnout %', results.turnout_percent],
    ['Winner', winnerLabel(outcome)],
    ['Results locked at', results.results_locked_at ? formatSubmissionDate(results.results_locked_at) : ''],
  ]

  lines.push('Field,Value')
  for (const [k, v] of summary) {
    lines.push(`${csvCell(k)},${csvCell(v)}`)
  }

  lines.push('')
  lines.push('Candidate,Votes,Share %,Winner')
  const sorted = [...results.candidates].sort((a, b) => b.vote_count - a.vote_count)
  const winnerIds =
    outcome.type === 'winner'
      ? new Set([outcome.candidate.candidate_id])
      : outcome.type === 'tie'
        ? new Set(outcome.candidates.map((c) => c.candidate_id))
        : new Set<string>()

  for (const c of sorted) {
    const share = candidateVoteShare(c.vote_count, results.total_votes)
    const isWinner = winnerIds.has(c.candidate_id)
    lines.push(
      `${csvCell(c.name)},${c.vote_count},${csvCell(`${share}%`)},${csvCell(isWinner ? 'Yes' : '')}`,
    )
  }

  return lines.join('\n')
}

export function downloadResultsCsv(content: string, electionTitle: string): void {
  const slug = electionTitle.replace(/[^\w-]+/g, '-').replace(/^-|-$/g, '').slice(0, 48) || 'election'
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${slug}-results-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
