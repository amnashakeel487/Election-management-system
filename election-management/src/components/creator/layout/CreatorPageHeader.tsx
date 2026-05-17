export interface CreatorPageHeaderProps {
  eyebrow?: string
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

export function CreatorPageHeader({ eyebrow, title, subtitle, actions }: CreatorPageHeaderProps) {
  return (
    <div
      className="page-header"
      style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}
    >
      <div>
        {eyebrow ? <div className="page-eyebrow">{eyebrow}</div> : null}
        <div className="page-title">{title}</div>
        {subtitle ? <div className="page-subtitle">{subtitle}</div> : null}
      </div>
      {actions ? <div className="page-header-actions">{actions}</div> : null}
    </div>
  )
}
