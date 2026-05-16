import { candidateInitial, candidatePhotoUrl } from '@/utils/candidateDisplay'

const SIZE_CLASS = {
  sm: 'h-12 w-12 text-lg rounded-lg',
  md: 'h-20 w-20 text-2xl rounded-xl',
  lg: 'h-24 w-24 text-3xl rounded-xl',
} as const

const GRADIENTS = [
  'linear-gradient(135deg, #1B3A6B, #2451A3)',
  'linear-gradient(135deg, #6C3FC5, #4F46E5)',
  'linear-gradient(135deg, #0891B2, #06B6D4)',
  'linear-gradient(135deg, #059669, #10B981)',
  'linear-gradient(135deg, #D97706, #F59E0B)',
  'linear-gradient(135deg, #7C3AED, #6C3FC5)',
] as const

function gradientForName(name: string): string {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0
  return GRADIENTS[h % GRADIENTS.length]
}

export interface CandidateAvatarProps {
  name: string
  photoUrl?: string | null
  size?: keyof typeof SIZE_CLASS
  className?: string
}

export function CandidateAvatar({ name, photoUrl, size = 'md', className = '' }: CandidateAvatarProps) {
  const url = candidatePhotoUrl(photoUrl)
  const sizeClass = SIZE_CLASS[size]

  if (url) {
    return (
      <img
        src={url}
        alt=""
        className={`object-cover ${sizeClass} ${className}`.trim()}
      />
    )
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center font-extrabold tracking-tight text-white ${sizeClass} ${className}`.trim()}
      style={{ background: gradientForName(name) }}
      aria-hidden
    >
      {candidateInitial(name)}
    </div>
  )
}
