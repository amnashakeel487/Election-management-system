import { useState } from 'react'
import { CreatorPageHeader } from '@/components/creator/layout/CreatorPageHeader'
import { useAuth } from '@/hooks/useAuth'
import { useCreatorPageMeta } from '@/hooks/useCreatorI18n'
import { supabase } from '@/lib/supabase'
import { avatarGradient, userInitials } from '@/utils/dashboardDisplay'
import { formatSubmissionDate } from '@/utils/formatDate'

export function CreatorProfilePage() {
  const meta = useCreatorPageMeta('profile')
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
        .update({ full_name: fullName.trim() || null, phone: phone.trim() || null })
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

  const approvalLabel =
    profile?.approval_status === 'approved'
      ? 'Approved'
      : profile?.approval_status === 'pending'
        ? 'Pending review'
        : profile?.approval_status === 'rejected'
          ? 'Rejected'
          : '—'

  return (
    <>
      <CreatorPageHeader eyebrow={meta.eyebrow} title={meta.title} subtitle={meta.subtitle} />
      {message ? <div className="alert-banner alert-banner--success">{message}</div> : null}
      {error ? <div className="alert-banner alert-banner--error">{error}</div> : null}

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
                  background: avatarGradient(profile?.email ?? 'creator'),
                }}
              >
                {userInitials(profile?.full_name, profile?.email)}
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800 }}>{profile?.full_name ?? 'Creator'}</div>
                <div style={{ fontSize: 12, color: 'var(--subtle)' }}>{profile?.email}</div>
                <span className="badge b-pending" style={{ marginTop: 6 }}>
                  {approvalLabel}
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
            <label className="form-label">Full name</label>
            <input className="form-input" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            <label className="form-label" style={{ marginTop: 12 }}>
              Phone
            </label>
            <input className="form-input" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <button type="submit" className="btn btn-primary" style={{ marginTop: 16 }} disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </form>
        </div>
      </div>
    </>
  )
}
