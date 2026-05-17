import { useState } from 'react'
import { AccountMfaSettings } from '@/components/account/AccountMfaSettings'
import { ChangePasswordSettings } from '@/components/account/ChangePasswordSettings'
import { VoterPageHeader } from '@/components/voter/VoterPageHeader'

export function VoterSettingsPage() {
  const [electionReminders, setElectionReminders] = useState(true)
  const [secretAlerts, setSecretAlerts] = useState(true)
  const [resultsAnnouncements, setResultsAnnouncements] = useState(true)
  const [marketing, setMarketing] = useState(false)
  const [loginAlerts, setLoginAlerts] = useState(true)

  return (
    <>
      <VoterPageHeader
        eyebrow="Configuration"
        title="Settings"
        subtitle="Notification and privacy preferences"
      />

      <div className="grid-2">
        <div className="card-elevated">
          <div className="card-header">
            <div className="card-title">Notification Settings</div>
          </div>
          <div className="card-body">
            <div className="toggle-wrap">
              <button
                type="button"
                className={`toggle${electionReminders ? ' on' : ''}`}
                aria-pressed={electionReminders}
                onClick={() => setElectionReminders((v) => !v)}
              >
                <div className="toggle-thumb" />
              </button>
              <div>
                <div className="toggle-label">Election reminders</div>
                <div style={{ fontSize: 11, color: 'var(--subtle)' }}>Reminded before deadlines (local UI only)</div>
              </div>
            </div>
            <div className="toggle-wrap">
              <button
                type="button"
                className={`toggle${secretAlerts ? ' on' : ''}`}
                aria-pressed={secretAlerts}
                onClick={() => setSecretAlerts((v) => !v)}
              >
                <div className="toggle-thumb" />
              </button>
              <div>
                <div className="toggle-label">Secret ID delivery alerts</div>
                <div style={{ fontSize: 11, color: 'var(--subtle)' }}>Highlights new IDs in notifications</div>
              </div>
            </div>
            <div className="toggle-wrap">
              <button
                type="button"
                className={`toggle${resultsAnnouncements ? ' on' : ''}`}
                aria-pressed={resultsAnnouncements}
                onClick={() => setResultsAnnouncements((v) => !v)}
              >
                <div className="toggle-thumb" />
              </button>
              <div>
                <div className="toggle-label">Results announcements</div>
                <div style={{ fontSize: 11, color: 'var(--subtle)' }}>When results pages update</div>
              </div>
            </div>
            <div className="toggle-wrap">
              <button
                type="button"
                className={`toggle${marketing ? ' on' : ''}`}
                aria-pressed={marketing}
                onClick={() => setMarketing((v) => !v)}
              >
                <div className="toggle-thumb" />
              </button>
              <div>
                <div className="toggle-label">Marketing emails</div>
                <div style={{ fontSize: 11, color: 'var(--subtle)' }}>Platform updates and news</div>
              </div>
            </div>
          </div>
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
            <div className="toggle-wrap">
              <button
                type="button"
                className={`toggle${loginAlerts ? ' on' : ''}`}
                aria-pressed={loginAlerts}
                onClick={() => setLoginAlerts((v) => !v)}
              >
                <div className="toggle-thumb" />
              </button>
              <div>
                <div className="toggle-label">Login activity alerts</div>
                <div style={{ fontSize: 11, color: 'var(--subtle)' }}>Preference placeholder</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
