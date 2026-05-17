import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from '@/components/i18n/LanguageSwitcher'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import { useAuth } from '@/hooks/useAuth'
import { PUBLIC_LOCALES } from '@/types/locale'
import type { UserRole } from '@/types/auth'

export function TopNavBar() {
  const { t } = useTranslation(['nav', 'common'])
  const navigate = useNavigate()
  const location = useLocation()
  const { session, profile, signOut, getDashboardPath, mfaRequired } = useAuth()

  function roleLabel(role: UserRole) {
    return t(`common:roles.${role}`)
  }

  async function handleLogout() {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <nav className="fixed top-0 z-50 flex h-16 w-full items-center justify-between border-b border-line/80 bg-nav px-4 shadow-md backdrop-blur-md sm:px-8">
      <div className="flex items-center gap-6 md:gap-10">
        <Link to="/" className="font-headline-md text-headline-md font-extrabold tracking-tight text-on-nav">
          {t('common:appName')}
        </Link>
        <div className="hidden gap-8 md:flex">
          <Link
            to="/browse-elections"
            className={
              location.pathname === '/browse-elections'
                ? 'border-b-2 border-tertiary pb-0.5 font-body-md text-body-md font-medium text-on-nav'
                : 'font-body-md text-body-md text-on-nav/70 transition-colors hover:text-on-nav'
            }
          >
            {t('nav:elections')}
          </Link>
          <Link
            to="/results"
            className="font-body-md text-body-md text-on-nav/70 transition-colors hover:text-on-nav"
          >
            {t('nav:results')}
          </Link>
          <Link
            to="/browse-elections"
            className="font-body-md text-body-md text-on-nav/70 transition-colors hover:text-on-nav"
          >
            {t('nav:browse')}
          </Link>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        <LanguageSwitcher variant="nav" locales={PUBLIC_LOCALES} />
        <ThemeToggle variant="nav" />
        {session && profile && !mfaRequired ? (
          <>
            <span className="hidden items-center gap-2 rounded-full border border-on-nav/20 bg-on-nav/10 px-3 py-1 font-label-sm text-label-sm text-on-nav md:inline-flex">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-tertiary opacity-50" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-tertiary" />
              </span>
              {roleLabel(profile.role)}
            </span>
            <Link
              to={getDashboardPath() ?? '/'}
              className="hidden font-body-sm text-body-sm text-on-nav/70 hover:text-on-nav md:inline"
            >
              {t('nav:dashboard')}
            </Link>
            <Link
              to="/account/security"
              className="hidden font-body-sm text-body-sm text-on-nav/70 hover:text-on-nav md:inline"
            >
              {t('nav:security')}
            </Link>
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="px-3 py-2 font-body-md text-body-md text-on-nav/70 transition-colors hover:text-on-nav sm:px-4"
            >
              {t('nav:logout')}
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="text-sm font-semibold text-on-nav/80 hover:text-on-nav sm:hidden">
              {t('nav:login')}
            </Link>
            <Link
              to="/login"
              className="btn-ghost hidden border-on-nav/25 py-2 text-on-nav/90 hover:border-on-nav/50 hover:bg-on-nav/10 hover:text-on-nav sm:inline-flex sm:px-4"
            >
              {t('nav:login')}
            </Link>
            <Link
              to="/register"
              className="btn-gradient-primary hidden py-2 text-sm sm:inline-flex sm:px-5"
            >
              {t('nav:register')}
            </Link>
            <Link to="/login" className="btn-gradient-primary py-2 text-sm sm:hidden sm:px-4">
              {t('nav:getStarted')}
            </Link>
          </>
        )}
      </div>
    </nav>
  )
}
