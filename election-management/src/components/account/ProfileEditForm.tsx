import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'

export interface ProfileEditFormProps {
  /** Show organization field (election creators). */
  showOrganization?: boolean
}

export function ProfileEditForm({ showOrganization = false }: ProfileEditFormProps) {
  const { profile, refreshProfile } = useAuth()
  const [fullName, setFullName] = useState(profile?.full_name ?? '')
  const [phone, setPhone] = useState(profile?.phone ?? '')
  const [organization, setOrganization] = useState(profile?.organization ?? '')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setFullName(profile?.full_name ?? '')
    setPhone(profile?.phone ?? '')
    setOrganization(profile?.organization ?? '')
  }, [profile?.full_name, profile?.phone, profile?.organization])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!profile?.id) return
    setSaving(true)
    setMessage(null)
    setError(null)
    try {
      const payload: Record<string, string | null> = {
        full_name: fullName.trim() || null,
        phone: phone.trim() || null,
      }
      if (showOrganization) {
        payload.organization = organization.trim() || null
      }

      const { error: updateError } = await supabase.from('users').update(payload).eq('id', profile.id)

      if (updateError) throw new Error(updateError.message)
      await refreshProfile()
      setMessage('Profile updated.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="card-body" onSubmit={(e) => void handleSave(e)}>
      {message ? (
        <p className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>
      ) : null}

      <div className="form-group">
        <label className="form-label" htmlFor="profile-email">
          Email
        </label>
        <input
          id="profile-email"
          className="form-input"
          type="email"
          value={profile?.email ?? ''}
          readOnly
          disabled
          aria-describedby="profile-email-hint"
        />
        <p id="profile-email-hint" style={{ fontSize: 11, color: 'var(--subtle)', marginTop: 4 }}>
          Email is managed through your sign-in account and cannot be changed here.
        </p>
      </div>

      <div className="form-group" style={{ marginTop: 12 }}>
        <label className="form-label" htmlFor="profile-name">
          Full name
        </label>
        <input
          id="profile-name"
          className="form-input"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          autoComplete="name"
          placeholder="Your full name"
        />
      </div>

      <div className="form-group" style={{ marginTop: 12 }}>
        <label className="form-label" htmlFor="profile-phone">
          Phone
        </label>
        <input
          id="profile-phone"
          className="form-input"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          autoComplete="tel"
          placeholder="Optional contact number"
        />
      </div>

      {showOrganization ? (
        <div className="form-group" style={{ marginTop: 12 }}>
          <label className="form-label" htmlFor="profile-org">
            Organization
          </label>
          <input
            id="profile-org"
            className="form-input"
            value={organization}
            onChange={(e) => setOrganization(e.target.value)}
            placeholder="School, company, or host organization"
          />
        </div>
      ) : null}

      <button type="submit" className="btn btn-primary" style={{ marginTop: 16 }} disabled={saving}>
        {saving ? 'Saving…' : 'Save changes'}
      </button>
    </form>
  )
}
