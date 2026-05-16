import { useState } from 'react'
import { AdminPageHeader } from '@/components/admin/layout/AdminPageHeader'
import { ADMIN_PAGE_META } from '@/config/adminNav'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { avatarGradient, userInitials } from '@/utils/dashboardDisplay'
import { formatSubmissionDate } from '@/utils/formatDate'

const meta = ADMIN_PAGE_META.profile

export function AdminProfilePage() {
  const { profile, refreshProfile } = useAuth()
  const [fullName, setFullName] = useState(profile?.full_name ?? '')
  const [phone, setPhone] = useState(profile?.phone ?? '')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!profile?.id) return
    setSaving(true)
    setMessage(null)
    setError(null)
    try {
      const { error: updateError } = await supabase
        .from('users')
        .update({
          full_name: fullName.trim() || null,
          phone: phone.trim() || null,
        })
        .eq('id', profile.id)

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
    <>
      <AdminPageHeader eyebrow={meta.eyebrow} title={meta.title} subtitle={meta.subtitle} />

      {message ? <div className="alert alert-success">{message}</div> : null}
      {error ? <div className="alert alert-danger">{error}</div> : null}

      <div className="grid-2">
        <div className="card-elevated">
          <div className="card-body">
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
              <div
                className="user-avatar"
                style={{
                  width: 56,
                  height: 56,
                  fontSize: 18,
                  background: avatarGradient(profile?.email ?? 'admin'),
                }}
              >
                {userInitials(profile?.full_name, profile?.email)}
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800 }}>{profile?.full_name ?? 'Admin'}</div>
                <div style={{ fontSize: 12, color: 'var(--subtle)' }}>{profile?.email}</div>
                <span className="badge badge-admin" style={{ marginTop: 6 }}>
                  Super Admin
                </span>
              </div>
            </div>
            <p style={{ fontSize: 11, color: 'var(--subtle)' }}>
              Member since {profile?.created_at ? formatSubmissionDate(profile.created_at) : '—'}
            </p>
          </div>
        </div>

        <div className="card-elevated">
          <div className="card-header">
            <div className="card-title">Edit profile</div>
          </div>
          <form className="card-body" onSubmit={(e) => void handleSave(e)}>
            <div className="form-group">
              <label className="form-label" htmlFor="profile-name">
                Full name
              </label>
              <input
                id="profile-name"
                className="form-input"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="profile-phone">
                Phone
              </label>
              <input
                id="profile-phone"
                className="form-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </form>
        </div>
      </div>
    </>
  )
}
