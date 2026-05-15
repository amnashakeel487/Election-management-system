import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

export function CreatorDashboardPage() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await signOut()
    navigate('/login', { replace: true })
  }

  const status = profile?.approval_status
  const isPending = status === 'pending'
  const isRejected = status === 'rejected'
  const isApproved = status === 'approved'

  return (
    <div className="min-h-screen bg-surface px-margin py-2xl text-on-surface">
      <div className="mx-auto max-w-4xl">
        <h1 className="font-headline-lg text-headline-lg text-primary">Election Creator Dashboard</h1>

        {isPending ? (
          <div className="mt-6 rounded-[24px] border border-secondary/20 bg-secondary-container/10 p-lg">
            <div className="mb-2 flex items-center gap-2">
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-secondary" />
              <span className="font-label-sm text-label-sm font-bold uppercase tracking-widest text-secondary">
                Pending Admin Approval
              </span>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Your election creator access request is under review. You will be notified once an administrator
              approves your account.
            </p>
          </div>
        ) : null}

        {isRejected ? (
          <div className="mt-6 rounded-[24px] border border-error/30 bg-error-container/20 p-lg">
            <p className="font-label-md text-label-md text-error">Application Rejected</p>
            <p className="mt-2 font-body-md text-body-md text-on-surface-variant">
              Your request to become an election creator was not approved. Contact system administration for
              details.
            </p>
          </div>
        ) : null}

        {isApproved ? (
          <p className="mt-2 font-body-md text-body-md text-on-surface-variant">
            Welcome, {profile?.email}. Creator tools will be implemented in the next step.
          </p>
        ) : (
          <p className="mt-2 font-body-md text-body-md text-on-surface-variant">Welcome, {profile?.email}.</p>
        )}

        <div className="mt-xl flex gap-md">
          <Link to="/" className="rounded-xl border border-outline px-lg py-md font-body-md hover:bg-surface-container">
            Home
          </Link>
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="rounded-xl bg-primary px-lg py-md font-body-md text-on-primary hover:opacity-90"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  )
}
