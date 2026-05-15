/** Mask secret voter ID for display, e.g. POLL-A-7821 → ****7821 */
export function maskSecretVoterId(secretVoterId: string): string {
  const trimmed = secretVoterId.trim()
  if (trimmed.length <= 4) return '****'
  return `****${trimmed.slice(-4)}`
}
