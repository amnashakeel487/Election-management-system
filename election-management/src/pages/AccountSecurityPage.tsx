import { Link } from 'react-router-dom'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { AccountMfaSettings } from '@/components/account/AccountMfaSettings'
import { ChangePasswordSettings } from '@/components/account/ChangePasswordSettings'
import { useAuth } from '@/hooks/useAuth'
import { useTranslation } from 'react-i18next'

export function AccountSecurityPage() {
  const { t } = useTranslation('settings')
  const { getDashboardPath } = useAuth()
  const dashboard = getDashboardPath() ?? '/'

  return (
    <AuthLayout>
      <div className="glass-card rounded-[32px] p-lg md:p-xl">
        <div className="mb-lg flex items-center justify-between gap-md">
          <div>
            <h2 className="font-headline-lg text-headline-lg text-on-surface">{t('securityPageTitle')}</h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant">{t('securityPageSubtitle')}</p>
          </div>
          <Link to={dashboard} className="font-label-md text-primary hover:underline">
            {t('securityPageBack')}
          </Link>
        </div>

        <div className="mb-lg">
          <ChangePasswordSettings variant="standalone" />
        </div>

        <AccountMfaSettings variant="standalone" />
      </div>
    </AuthLayout>
  )
}
