import { useTheme } from '@/context/ThemeContext'

type ThemeToggleVariant = 'nav' | 'icon-btn' | 'minimal'

interface ThemeToggleProps {
  variant?: ThemeToggleVariant
  className?: string
}

export function ThemeToggle({ variant = 'nav', className = '' }: ThemeToggleProps) {
  const { resolvedTheme, toggleTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const label = isDark ? 'Switch to light mode' : 'Switch to dark mode'

  if (variant === 'icon-btn') {
    return (
      <button
        type="button"
        onClick={() => toggleTheme()}
        className={`icon-btn theme-toggle ${className}`.trim()}
        aria-label={label}
        title={label}
      >
        <span className="material-symbols-outlined theme-toggle__icon" aria-hidden>
          {isDark ? 'light_mode' : 'dark_mode'}
        </span>
      </button>
    )
  }

  if (variant === 'minimal') {
    return (
      <button
        type="button"
        onClick={() => toggleTheme()}
        className={`theme-toggle theme-toggle--minimal ${className}`.trim()}
        aria-label={label}
        title={label}
      >
        <span className="material-symbols-outlined theme-toggle__icon" aria-hidden>
          {isDark ? 'light_mode' : 'dark_mode'}
        </span>
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={() => toggleTheme()}
      className={`flex h-10 w-10 items-center justify-center rounded-xl border border-on-nav/20 text-on-nav/80 transition-colors duration-300 hover:border-on-nav/40 hover:bg-on-nav/10 hover:text-on-nav theme-toggle ${className}`.trim()}
      aria-label={label}
      title={label}
    >
      <span className="material-symbols-outlined text-[22px] theme-toggle__icon">
        {isDark ? 'light_mode' : 'dark_mode'}
      </span>
    </button>
  )
}
