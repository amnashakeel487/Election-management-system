import type { Candidate } from '@/types/election'

export function candidatePhotoUrl(photoUrl?: string | null): string | null {
  const u = photoUrl?.trim()
  return u || null
}

/** First letter for avatar fallback (supports multi-word names). */
export function candidateInitial(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) return '?'
  const parts = trimmed.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0]!.charAt(0)}${parts[1]!.charAt(0)}`.toUpperCase()
  }
  return trimmed.charAt(0).toUpperCase()
}

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
