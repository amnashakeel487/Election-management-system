export function formatTimeRemaining(endDateIso: string, nowMs = Date.now()): string {
  const end = new Date(endDateIso).getTime()
  const diff = Math.max(0, end - nowMs)

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

/** Countdown until `targetIso` (e.g. voting start). Same shape as time-until-end. */
export function formatTimeUntil(targetIso: string, nowMs = Date.now()): string {
  const target = new Date(targetIso).getTime()
  const diff = Math.max(0, target - nowMs)

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
