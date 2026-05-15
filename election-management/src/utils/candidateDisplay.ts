import type { Candidate } from '@/types/election'

/** Deterministic index so the same candidate picks the same fallback art across views. */
export function stablePlaceholderIndex(id: string, length: number): number {
  if (length <= 0) return 0
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return h % length
}

export function candidatePortraitSrc(candidate: Candidate, fallbackIndex: number, fallbacks: readonly string[]): string {
  const u = candidate.photo_url?.trim()
  if (u) return u
  return fallbacks[fallbackIndex % fallbacks.length] ?? fallbacks[0] ?? ''
}

export function candidatePortraitOrPlaceholder(
  candidate: Candidate,
  fallbacks: readonly string[],
): string {
  const idx = stablePlaceholderIndex(candidate.id, fallbacks.length)
  return candidatePortraitSrc(candidate, idx, fallbacks)
}
