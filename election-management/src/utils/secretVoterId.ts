/** Secret voter ID utilities — one unique ID per poll (election). */

export const DEFAULT_SECRET_VOTER_ID_PREFIX = 'POLL-A'

const PREFIX_PATTERN = /^[A-Z0-9][A-Z0-9-]*[A-Z0-9]$|^[A-Z0-9]$/

export function normalizeSecretVoterIdPrefix(prefix: string): string {
  let norm = prefix.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '')
  norm = norm.replace(/-+/g, '-').replace(/^-|-$/g, '')
  if (!norm) return DEFAULT_SECRET_VOTER_ID_PREFIX
  if (norm.length > 20) norm = norm.slice(0, 20)
  return norm
}

export function validateSecretVoterIdPrefix(prefix: string): string | null {
  const norm = normalizeSecretVoterIdPrefix(prefix)
  if (!PREFIX_PATTERN.test(norm)) {
    return 'Use letters, numbers, and hyphens (e.g. POLL-A).'
  }
  return null
}

/** Build display ID: POLL-A-0001 */
export function formatSecretVoterId(prefix: string, sequence: number): string {
  const norm = normalizeSecretVoterIdPrefix(prefix)
  const seq = Math.max(0, Math.floor(sequence))
  return `${norm}-${String(seq).padStart(4, '0')}`
}

export function exampleSecretVoterIds(prefix: string): { first: string; masked: string } {
  const first = formatSecretVoterId(prefix, 1)
  return {
    first,
    masked: `****${first.slice(-4)}`,
  }
}

/**
 * Loose validation for ballot entry.
 * Must match format_secret_voter_id / formatSecretVoterId: e.g. POLL-A-0001
 * (prefix may contain hyphens; sequence is always -####).
 */
export function isPlausibleSecretVoterId(value: string): boolean {
  const v = value.trim()
  if (v.length < 6 || v.length > 32) return false
  return /^[A-Za-z0-9][A-Za-z0-9-]*-\d{4}$/.test(v)
}
