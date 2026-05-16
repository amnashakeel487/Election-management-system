import { sanitizeText } from '@/lib/security/sanitize'

interface SafeTextProps {
  value: string
  as?: 'span' | 'p' | 'div'
  className?: string
  maxLength?: number
}

/** Renders user-provided text as plain text (XSS-safe). */
export function SafeText({ value, as: Tag = 'span', className, maxLength }: SafeTextProps) {
  return <Tag className={className}>{sanitizeText(value, maxLength)}</Tag>
}
