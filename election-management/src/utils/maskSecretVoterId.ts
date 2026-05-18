/** Mask secret voter ID for display, e.g. POLL-A-7821 → ****7821 */
export function maskSecretVoterId(secretVoterId: string): string {
  const trimmed = secretVoterId.trim()
  if (trimmed.length <= 4) return '****'
  return `****${trimmed.slice(-4)}`
}

/** Half visible / half hidden — matches DB _mask_secret_voter_id_display */
export function maskSecretVoterIdHalf(secretVoterId: string): string {
  const t = secretVoterId.trim().toUpperCase()
  if (t.length <= 4) return '****'
  const visible = Math.ceil(t.length / 2)
  return t.slice(0, visible) + '*'.repeat(t.length - visible)
}
