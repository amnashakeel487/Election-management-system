import type { FinalizedVoterRoll } from '@/types/voterRoll'

function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export function buildFinalizedVoterRollCsv(roll: FinalizedVoterRoll): string {
  const headers = [
    'Secret Voter ID',
    'Full Name',
    'Email',
    'Registered At',
    'ID Emailed At',
    'Voted At',
  ]

  const rows = roll.entries.map((e) =>
    [
      e.secret_voter_id ?? '',
      e.full_name,
      e.email,
      e.registered_at,
      e.secret_id_emailed_at ?? '',
      e.voted_at ?? '',
    ]
      .map(escapeCsvCell)
      .join(','),
  )

  return [headers.join(','), ...rows].join('\r\n')
}

export function downloadFinalizedVoterRollCsv(roll: FinalizedVoterRoll): void {
  const csv = buildFinalizedVoterRollCsv(roll)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  const slug = roll.title.replace(/[^\w]+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'election'
  anchor.href = url
  anchor.download = `${slug}-finalized-voter-roll.csv`
  anchor.click()
  URL.revokeObjectURL(url)
}
