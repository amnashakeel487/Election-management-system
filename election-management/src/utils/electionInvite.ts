/** Public URL voters scan or open to register for an election. */
export function getElectionJoinUrl(electionId: string, origin?: string): string {
  const base = (origin ?? (typeof window !== 'undefined' ? window.location.origin : '')).replace(/\/$/, '')
  return `${base}/elections/${electionId}/join`
}
