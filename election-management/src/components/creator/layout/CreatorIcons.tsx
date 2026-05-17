import type { ReactNode } from 'react'
import type { CreatorNavIcon } from '@/config/creatorNav'

function Svg({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      {children}
    </svg>
  )
}

const s = { fill: 'none', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

export function CreatorNavIcon({ icon }: { icon: CreatorNavIcon }) {
  switch (icon) {
    case 'dashboard':
      return (
        <Svg>
          <rect x="3" y="3" width="7" height="7" {...s} />
          <rect x="14" y="3" width="7" height="7" {...s} />
          <rect x="14" y="14" width="7" height="7" {...s} />
          <rect x="3" y="14" width="7" height="7" {...s} />
        </Svg>
      )
    case 'elections':
      return (
        <Svg>
          <circle cx="12" cy="12" r="10" {...s} />
          <polyline points="12 6 12 12 16 14" {...s} />
        </Svg>
      )
    case 'create':
      return (
        <Svg>
          <circle cx="12" cy="12" r="10" {...s} />
          <line x1="12" y1="8" x2="12" y2="16" {...s} />
          <line x1="8" y1="12" x2="16" y2="12" {...s} />
        </Svg>
      )
    case 'candidates':
      return (
        <Svg>
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" {...s} />
          <circle cx="9" cy="7" r="4" {...s} />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" {...s} />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" {...s} />
        </Svg>
      )
    case 'participants':
      return (
        <Svg>
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" {...s} />
          <rect x="8" y="2" width="8" height="4" rx="1" {...s} />
        </Svg>
      )
    case 'results':
      return (
        <Svg>
          <line x1="18" y1="20" x2="18" y2="10" {...s} />
          <line x1="12" y1="20" x2="12" y2="4" {...s} />
          <line x1="6" y1="20" x2="6" y2="14" {...s} />
        </Svg>
      )
    case 'notifications':
      return (
        <Svg>
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" {...s} />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" {...s} />
        </Svg>
      )
    case 'reports':
      return (
        <Svg>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" {...s} />
          <polyline points="14 2 14 8 20 8" {...s} />
        </Svg>
      )
    case 'settings':
      return (
        <Svg>
          <circle cx="12" cy="12" r="3" {...s} />
          <path
            d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
            {...s}
          />
        </Svg>
      )
    case 'profile':
      return (
        <Svg>
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" {...s} />
          <circle cx="12" cy="7" r="4" {...s} />
        </Svg>
      )
    case 'logout':
      return (
        <Svg>
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" {...s} />
          <polyline points="16 17 21 12 16 7" {...s} />
          <line x1="21" y1="12" x2="9" y2="12" {...s} />
        </Svg>
      )
    default:
      return null
  }
}

export function ShieldBrandIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="none" stroke="white" strokeWidth="2" />
    </svg>
  )
}
