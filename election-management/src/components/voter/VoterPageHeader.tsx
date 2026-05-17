interface VoterPageHeaderProps {
  eyebrow: string
  title: string
  subtitle?: string
}

export function VoterPageHeader({ eyebrow, title, subtitle }: VoterPageHeaderProps) {
  return (
    <div className="page-header">
      <div className="page-eyebrow">{eyebrow}</div>
      <div className="page-title">{title}</div>
      {subtitle ? <div className="page-subtitle">{subtitle}</div> : null}
    </div>
  )
}
