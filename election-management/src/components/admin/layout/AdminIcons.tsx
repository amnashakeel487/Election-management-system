import type { ReactNode } from 'react'
import type { AdminNavItem } from '@/config/adminNav'

function Svg({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      {children}
    </svg>
  )
}

export function AdminNavIcon({ icon }: { icon: AdminNavItem['icon'] }) {
  const common = { fill: 'none', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  switch (icon) {
    case 'dashboard':
      return (
        <Svg>
          <rect x="3" y="3" width="7" height="7" {...common} />
          <rect x="14" y="3" width="7" height="7" {...common} />
          <rect x="14" y="14" width="7" height="7" {...common} />
          <rect x="3" y="14" width="7" height="7" {...common} />
        </Svg>
      )
    case 'requests':
      return (
        <Svg>
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" {...common} />
          <rect x="8" y="2" width="8" height="4" rx="1" {...common} />
        </Svg>
      )
    case 'elections':
      return (
        <Svg>
          <circle cx="12" cy="12" r="10" {...common} />
          <polyline points="12 6 12 12 16 14" {...common} />
        </Svg>
      )
    case 'users':
      return (
        <Svg>
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" {...common} />
          <circle cx="9" cy="7" r="4" {...common} />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" {...common} />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" {...common} />
        </Svg>
      )
    case 'voters':
      return (
        <Svg>
          <rect x="3" y="3" width="18" height="18" rx="2" {...common} />
          <path d="M9 12l2 2 4-4" {...common} />
        </Svg>
      )
    case 'audit':
      return (
        <Svg>
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" {...common} />
        </Svg>
      )
    case 'reports':
      return (
        <Svg>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" {...common} />
          <polyline points="14 2 14 8 20 8" {...common} />
          <line x1="16" y1="13" x2="8" y2="13" {...common} />
          <line x1="16" y1="17" x2="8" y2="17" {...common} />
        </Svg>
      )
    case 'notifications':
      return (
        <Svg>
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" {...common} />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" {...common} />
        </Svg>
      )
    case 'security':
      return (
        <Svg>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" {...common} />
        </Svg>
      )
    case 'settings':
      return (
        <Svg>
          <circle cx="12" cy="12" r="3" {...common} />
          <path
            d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
            {...common}
          />
        </Svg>
      )
    case 'profile':
      return (
        <Svg>
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" {...common} />
          <circle cx="12" cy="7" r="4" {...common} />
        </Svg>
      )
    case 'logout':
      return (
        <Svg>
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" {...common} />
          <polyline points="16 17 21 12 16 7" {...common} />
          <line x1="21" y1="12" x2="9" y2="12" {...common} />
        </Svg>
      )
    default:
      return null
  }
}

export function ShieldBrandIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path
        d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
        fill="none"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
