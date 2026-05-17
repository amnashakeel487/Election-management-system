import { AccountMfaSettings } from '@/components/account/AccountMfaSettings'
import { ChangePasswordSettings } from '@/components/account/ChangePasswordSettings'
import { LanguageSwitcher } from '@/components/i18n/LanguageSwitcher'
import { AppearanceSettings } from '@/components/theme/AppearanceSettings'
import { VoterPageHeader } from '@/components/voter/VoterPageHeader'
import { PUBLIC_LOCALES } from '@/types/locale'

export function VoterSettingsPage() {
  return (
    <>
      <VoterPageHeader
        eyebrow="Configuration"
        title="Settings"
        subtitle="Appearance, language, and account security"
      />

      <div className="grid-2" style={{ marginBottom: 16 }}>
        <div className="card-elevated">
          <div className="card-header">
            <div className="card-title">Language</div>
            <div className="card-subtitle">English and Urdu</div>
          </div>
          <div className="card-body">
            <LanguageSwitcher variant="settings" locales={PUBLIC_LOCALES} />
            <p style={{ fontSize: 11, color: 'var(--subtle)', marginTop: 12, lineHeight: 1.5 }}>
              Urdu uses right-to-left layout. Your choice is saved on this device and synced to your account when
              signed in.
            </p>
          </div>
        </div>
        <AppearanceSettings variant="admin" />
      </div>

      <div className="card-elevated">
        <div className="card-header">
          <div className="card-title">Privacy & Security</div>
        </div>
        <div className="card-body">
          <ChangePasswordSettings variant="embedded" />
          <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
            <AccountMfaSettings variant="embedded" />
          </div>
        </div>
      </div>
    </>
  )
}
