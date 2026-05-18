/** Mask secret voter ID for display, e.g. POLL-A-7821 → ****7821 */
export function maskSecretVoterId(secretVoterId: string): string {
  const trimmed = secretVoterId.trim()
  if (trimmed.length <= 4) return '****'
  return `****${trimmed.slice(-4)}`
}

/**
 * Public results / export: show only last 4 characters.
 * Example: VOTER12345678 → ********5678
 */
export function maskSecretVoterIdForDisplay(value: string): string {
  const t = value.trim().toUpperCase()
  if (!t) return '********'
  if (/^\*+[A-Z0-9-]{1,4}$/.test(t) && t.length >= 5) {
    return t
  }
  const last4 = t.replace(/\*/g, '').slice(-4) || t.slice(-4)
  return `${'*'.repeat(8)}${last4}`
}
