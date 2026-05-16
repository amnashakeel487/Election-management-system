import { useTheme } from '@/context/ThemeContext'
import type { ThemePreference } from '@/types/theme'

const OPTIONS: { value: ThemePreference; label: string; description: string }[] = [
  { value: 'light', label: 'Light mode', description: 'Bright backgrounds and dark text' },
  { value: 'dark', label: 'Dark mode', description: 'Dim surfaces optimized for low light' },
  { value: 'system', label: 'System theme', description: 'Match your device appearance setting' },
]

interface AppearanceSettingsProps {
  variant?: 'admin' | 'default'
}

export function AppearanceSettings({ variant = 'default' }: AppearanceSettingsProps) {
  const { preference, setPreference, resolvedTheme } = useTheme()

  const content = (
    <div className="appearance-settings" role="radiogroup" aria-label="Appearance">
      {OPTIONS.map((opt) => {
        const checked = preference === opt.value
        return (
          <label
            key={opt.value}
            className={
              variant === 'admin'
                ? `appearance-option appearance-option--admin${checked ? ' appearance-option--active' : ''}`
                : `appearance-option${checked ? ' appearance-option--active' : ''}`
            }
          >
            <input
              type="radio"
              name="theme-preference"
              value={opt.value}
              checked={checked}
              onChange={() => setPreference(opt.value)}
              className="appearance-option__input"
            />
            <span className="appearance-option__check" aria-hidden>
              {checked ? '☑' : '☐'}
            </span>
            <span className="appearance-option__body">
              <span className="appearance-option__label">{opt.label}</span>
              <span className="appearance-option__desc">{opt.description}</span>
            </span>
          </label>
        )
      })}
      <p className="appearance-settings__hint">
        Active now: <strong>{resolvedTheme === 'dark' ? 'Dark' : 'Light'}</strong>
        {preference === 'system' ? ' (from system)' : ''}. Saved on this device
        {preference !== 'system' ? ' and to your account when signed in' : ' and synced when signed in'}.
      </p>
    </div>
  )

  if (variant === 'admin') {
    return (
      <div className="card-elevated">
        <div className="card-header">
          <div>
            <div className="card-title">Appearance</div>
            <div className="card-subtitle">Theme for admin dashboard and shared pages</div>
          </div>
        </div>
        <div className="card-body">{content}</div>
      </div>
    )
  }

  return (
    <div className="glass-card rounded-[24px] border border-line p-lg">
      <h3 className="mb-1 font-headline-md text-headline-md text-on-surface">Appearance</h3>
      <p className="mb-4 font-body-sm text-body-sm text-on-surface-variant">
        Choose how FortressVote looks on this device.
      </p>
      {content}
    </div>
  )
}
