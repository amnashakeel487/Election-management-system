import type { RegisterableRole } from '@/types/auth'
import { ROLE_LABELS } from '@/types/auth'

const ROLES: { value: RegisterableRole; label: string; icon: string; description: string }[] = [
  { value: 'voter', label: ROLE_LABELS.voter, icon: 'person', description: 'Participate in elections' },
  {
    value: 'election_creator',
    label: 'Creator',
    icon: 'edit_square',
    description: 'Request approval to run polls',
  },
]

interface RoleSelectorProps {
  value: RegisterableRole
  onChange: (role: RegisterableRole) => void
  disabled?: boolean
}

export function RoleSelector({ value, onChange, disabled }: RoleSelectorProps) {
  return (
    <div className="space-y-sm">
      <label className="ml-xs font-label-md text-label-md text-on-surface-variant">Select Your Role</label>
      <div className="grid grid-cols-2 gap-sm">
        {ROLES.map((role) => {
          const selected = value === role.value
          return (
            <button
              key={role.value}
              type="button"
              disabled={disabled}
              onClick={() => onChange(role.value)}
              className={
                selected
                  ? 'flex flex-col items-center justify-center gap-xs rounded-xl border border-primary bg-primary/5 p-md text-primary shadow-[0_0_15px_rgba(173,198,255,0.1)] transition-all'
                  : 'group flex flex-col items-center justify-center gap-xs rounded-xl border border-outline-variant bg-surface-container-low p-md text-on-surface-variant transition-all hover:border-primary/50 hover:bg-surface-container-high hover:text-primary'
              }
            >
              <span
                className="material-symbols-outlined text-md"
                style={selected ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {role.icon}
              </span>
              <span className="font-label-sm text-label-sm">{role.label}</span>
              <span className="text-center font-label-sm text-[10px] leading-tight opacity-80">
                {role.description}
              </span>
            </button>
          )
        })}
      </div>
      <p className="ml-xs font-label-sm text-label-sm text-on-surface-variant">
        {ROLE_LABELS.admin} accounts are provisioned by the platform operator.
      </p>
    </div>
  )
}
