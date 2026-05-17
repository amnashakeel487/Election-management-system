import type { UserRole } from '@/types/auth'

export interface AuthRoleOption {
  value: UserRole
  title: string
  sub: string
  icon: string
}

interface AuthRoleCardsProps {
  value: UserRole
  onChange: (role: UserRole) => void
  options: readonly AuthRoleOption[]
  columns?: 2 | 3
}

export function AuthRoleCards({ value, onChange, options, columns = 2 }: AuthRoleCardsProps) {
  const gridClass = columns === 3 ? 'grid-cols-3' : 'grid-cols-2'

  return (
    <div className={`grid gap-2 ${gridClass}`}>
      {options.map((opt) => {
        const sel = value === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`rounded-[11px] border-[1.5px] px-2 py-3 text-center transition-all hover:-translate-y-0.5 hover:border-[#2451A3] hover:shadow-[0_6px_20px_rgba(36,81,163,0.12)] ${
              sel
                ? 'border-[#1B3A6B] bg-gradient-to-br from-[#EFF4FF] to-[#F5F0FF]'
                : 'border-[#E2E8F0] bg-white'
            }`}
          >
            <div
              className={`mx-auto mb-2 flex h-[34px] w-[34px] items-center justify-center rounded-md border ${
                sel ? 'border-blue-200 bg-blue-100 text-[#2451A3]' : 'border-[#E2E8F0] bg-slate-50 text-slate-400'
              }`}
            >
              <span className="material-symbols-outlined text-[17px]">{opt.icon}</span>
            </div>
            <div className={`text-[12px] font-bold ${sel ? 'text-[#1B3A6B]' : 'text-slate-500'}`}>{opt.title}</div>
            <div className="mt-0.5 text-[10px] text-slate-300">{opt.sub}</div>
          </button>
        )
      })}
    </div>
  )
}
