import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

export function VoterDashboardPage() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-surface px-margin py-2xl text-on-surface">
      <div className="mx-auto max-w-4xl">
        <h1 className="font-headline-lg text-headline-lg text-primary">Voter Dashboard</h1>
        <p className="mt-2 font-body-md text-body-md text-on-surface-variant">
          Welcome, {profile?.email}. Voting tools will be implemented in the next step.
        </p>
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
