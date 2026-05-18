/** Short display for a 64-char hex SHA-256 proof hash */
export function formatProofHashDisplay(fullHash: string): string {
  const h = fullHash.trim().toLowerCase()
  if (h.length <= 20) return h
  return `${h.slice(0, 10)}…${h.slice(-10)}`
}
