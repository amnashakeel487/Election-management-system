export function userInitials(name: string | null | undefined, email: string | null | undefined): string {
  const fromName = name?.trim()
  if (fromName) {
    const parts = fromName.split(/\s+/).filter(Boolean)
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    return fromName.slice(0, 2).toUpperCase()
  }
  const local = email?.split('@')[0] ?? 'U'
  return local.slice(0, 2).toUpperCase()
}

export function formatDashboardNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 10_000) return `${(n / 1_000).toFixed(1)}k`
  return n.toLocaleString()
}

export function electionDisplayStatus(
  status: string,
  startDate: string,
  endDate: string,
  nowMs = Date.now(),
): 'active' | 'upcoming' | 'completed' | 'draft' | 'pending' {
  if (status === 'draft') return 'draft'
  const start = new Date(startDate).getTime()
  const end = new Date(endDate).getTime()
  if (status === 'completed' || status === 'archived' || nowMs > end) return 'completed'
  if (nowMs < start) return 'upcoming'
  if (status === 'published' || status === 'active') return 'active'
  return 'pending'
}

export function statusBadgeClass(
  phase: ReturnType<typeof electionDisplayStatus>,
): string {
  switch (phase) {
    case 'active':
      return 'vs-t-badge--active'
    case 'upcoming':
      return 'vs-t-badge--upcoming'
    case 'completed':
      return 'vs-t-badge--completed'
    case 'draft':
      return 'vs-t-badge--draft'
    default:
      return 'vs-t-badge--pending'
  }
}

export function avatarGradient(seed: string): string {
  const palettes = [
    'linear-gradient(135deg,#1B3A6B,#6C3FC5)',
    'linear-gradient(135deg,#065f46,#10B981)',
    'linear-gradient(135deg,#92400E,#F59E0B)',
    'linear-gradient(135deg,#0369a1,#06B6D4)',
    'linear-gradient(135deg,#6C3FC5,#9333ea)',
  ]
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = (hash + seed.charCodeAt(i)) % palettes.length
  return palettes[hash] ?? palettes[0]
}
