import type { ReactNode } from 'react'

interface AdminPageHeaderProps {
  eyebrow?: string
  title: string
  subtitle?: string
  actions?: ReactNode
}

export function AdminPageHeader({ eyebrow, title, subtitle, actions }: AdminPageHeaderProps) {
  return (
    <div
      className="page-header"
      style={
        actions
          ? { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }
          : undefined
      }
    >
      <div>
        {eyebrow ? <div className="page-eyebrow">{eyebrow}</div> : null}
        <div className="page-title">{title}</div>
        {subtitle ? <div className="page-subtitle">{subtitle}</div> : null}
      </div>
      {actions}
    </div>
  )
}
