import { jsPDF } from 'jspdf'

function escapeCsvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`
  return value
}

function safeFilenamePart(value: string): string {
  return value.replace(/[^\w\-]+/g, '_').slice(0, 60)
}

export function downloadCandidateVotersCsv(
  electionTitle: string,
  candidateName: string,
  maskedVoterIds: string[],
): void {
  const rows = [
    ['Election', electionTitle],
    ['Candidate', candidateName],
    ['Exported at', new Date().toISOString()],
    [],
    ['#', 'Masked voter ID'],
    ...maskedVoterIds.map((id, i) => [String(i + 1), id]),
  ]
  const csv = rows.map((row) => row.map(escapeCsvCell).join(',')).join('\n')
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${safeFilenamePart(electionTitle)}_${safeFilenamePart(candidateName)}_voters.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function downloadCandidateVotersPdf(
  electionTitle: string,
  candidateName: string,
  maskedVoterIds: string[],
  voteCount: number,
  rank: number,
): void {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const margin = 14
  let y = margin

  pdf.setFontSize(16)
  pdf.text('Candidate voter list', margin, y)
  y += 10

  pdf.setFontSize(11)
  const meta = [
    `Election: ${electionTitle}`,
    `Candidate: ${candidateName}`,
    `Rank: #${rank}`,
    `Total votes: ${voteCount}`,
    `Voters listed: ${maskedVoterIds.length}`,
    `Exported: ${new Date().toLocaleString()}`,
  ]
  for (const line of meta) {
    pdf.text(line, margin, y)
    y += 6
  }

  y += 4
  pdf.setFontSize(10)
  pdf.text('Masked voter IDs (last 4 digits visible only):', margin, y)
  y += 8

  const pageHeight = pdf.internal.pageSize.getHeight()
  for (let i = 0; i < maskedVoterIds.length; i++) {
    if (y > pageHeight - margin) {
      pdf.addPage()
      y = margin
    }
    pdf.text(`${i + 1}. ${maskedVoterIds[i]}`, margin + 2, y)
    y += 6
  }

  if (maskedVoterIds.length === 0) {
    pdf.text('No masked voter IDs on record for this candidate.', margin, y)
  }

  pdf.save(`${safeFilenamePart(electionTitle)}_${safeFilenamePart(candidateName)}_voters.pdf`)
}
