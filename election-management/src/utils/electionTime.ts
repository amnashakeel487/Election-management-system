export function formatTimeRemaining(endDateIso: string): string {
  const end = new Date(endDateIso).getTime()
  const now = Date.now()
  const diff = Math.max(0, end - now)

  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)

  if (hours >= 24) {
    const days = Math.floor(hours / 24)
    const remHours = hours % 24
    return `${days}d ${remHours}h`
  }

  return `${hours}h ${minutes}m ${seconds}s`
}

export function formatElectionCode(electionId: string): string {
  return `FV-${electionId.slice(0, 8).toUpperCase()}`
}
