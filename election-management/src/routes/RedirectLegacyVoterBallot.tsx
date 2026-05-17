import { Navigate, useParams } from 'react-router-dom'

/** Sends `/elections/:id/vote` to the voter-hub ballot route. */
export function RedirectLegacyVoterBallot() {
  const { id } = useParams<{ id: string }>()
  if (!id) return <Navigate to="/voter/vote" replace />
  return <Navigate to={`/voter/vote/${id}`} replace />
}
