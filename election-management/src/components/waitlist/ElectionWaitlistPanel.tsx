import { useCallback, useEffect, useState } from 'react'
import {
  fetchElectionWaitlist,
  promoteNextWaitlistSlots,
  promoteWaitlistedParticipant,
  rejectElectionParticipant,
  type WaitlistEntry,
} from '@/services/waitlistService'
import { fetchElectionRegistrationStats } from '@/services/voterRegistrationService'
import type { ElectionRegistrationStats } from '@/types/voterRegistration'
import { formatDashboardNumber } from '@/utils/dashboardDisplay'

export interface ElectionWaitlistPanelProps {
  electionId: string
  /** ISO timestamp when roll was finalized; promotions disabled when set */
  voterRollFinalized?: string | null
  variant?: 'creator' | 'admin'
  onChanged?: () => void
}

export function ElectionWaitlistPanel({
  electionId,
  voterRollFinalized,
  variant = 'creator',
  onChanged,
}: ElectionWaitlistPanelProps) {
  const [entries, setEntries] = useState<WaitlistEntry[]>([])
  const [stats, setStats] = useState<ElectionRegistrationStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [bulkBusy, setBulkBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [list, s] = await Promise.all([
        fetchElectionWaitlist(electionId),
        fetchElectionRegistrationStats(electionId),
      ])
      setEntries(list)
      setStats(s)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load waitlist')
    } finally {
      setLoading(false)
    }
  }, [electionId])

  useEffect(() => {
    void load()
  }, [load])

  const rollFinalized = Boolean(voterRollFinalized)
  const spotsOpen =
    stats != null && stats.registered_count < stats.max_voters && !rollFinalized

  async function handlePromoteOne(registrationId: string) {
    setBusyId(registrationId)
    setMessage(null)
    try {
      await promoteWaitlistedParticipant(registrationId, electionId)
      setMessage('Voter promoted from waitlist.')
      await load()
      onChanged?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Promotion failed')
    } finally {
      setBusyId(null)
    }
  }

  async function handlePromoteNext() {
    if (!spotsOpen) return
    setBulkBusy(true)
    setMessage(null)
    try {
      const result = await promoteNextWaitlistSlots(electionId, 5)
      const count = result.promoted_count ?? result.promoted?.length ?? 0
      setMessage(count > 0 ? `Promoted ${count} voter(s) from the waitlist.` : 'No waitlisted voters to promote.')
      await load()
      onChanged?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bulk promotion failed')
    } finally {
      setBulkBusy(false)
    }
  }

  async function handleReject(registrationId: string) {
    if (!window.confirm('Remove this person from the waitlist?')) return
    setBusyId(registrationId)
    setMessage(null)
    try {
      await rejectElectionParticipant(registrationId, electionId)
      setMessage('Participant removed from waitlist.')
      await load()
      onChanged?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Rejection failed')
    } finally {
      setBusyId(null)
    }
  }

  const shellClass = variant === 'admin' ? 'card-elevated' : 'vs-panel'
  const headClass = variant === 'admin' ? 'card-header' : 'vs-panel-head'
  const bodyClass = variant === 'admin' ? 'card-body' : 'vs-panel-body'
  const titleClass = variant === 'admin' ? 'card-title' : 'vs-panel-title'
  const subClass = variant === 'admin' ? 'card-subtitle' : 'vs-panel-sub'

  return (
    <div className={shellClass}>
      <div className={headClass}>
        <div>
          <div className={titleClass}>Waitlist</div>
          <div className={subClass}>
            {stats
              ? `${formatDashboardNumber(stats.registered_count)}/${formatDashboardNumber(stats.max_voters)} approved · ${formatDashboardNumber(entries.length)} waiting`
              : 'Queued voters when capacity is full'}
          </div>
        </div>
        {spotsOpen ? (
          <button
            type="button"
            className={variant === 'admin' ? 'btn btn-primary btn-sm' : 'vs-t-btn vs-t-btn--primary'}
            disabled={bulkBusy || entries.length === 0}
            onClick={() => void handlePromoteNext()}
          >
            {bulkBusy ? 'Promoting…' : 'Promote next'}
          </button>
        ) : null}
      </div>

      <div className={bodyClass}>
        {error ? (
          <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>
        ) : null}
        {message ? (
          <p className="mb-3 rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs text-cyan-900">{message}</p>
        ) : null}

        {rollFinalized ? (
          <p className="text-xs text-slate-500">
            The voter roll is finalized. Waitlist promotions are disabled.
          </p>
        ) : spotsOpen ? (
          <p className="mb-3 text-xs text-slate-500">
            When a registered voter withdraws or is removed, the next waitlisted voter can be promoted automatically.
            Use &quot;Promote&quot; to fill open slots manually.
          </p>
        ) : stats && stats.registered_count >= stats.max_voters ? (
          <p className="mb-3 text-xs text-slate-500">Registration is at capacity. No open slots until someone withdraws.</p>
        ) : null}

        {loading ? (
          <p className="text-xs text-slate-500">Loading waitlist…</p>
        ) : entries.length === 0 ? (
          <p className="text-xs text-slate-500">No one on the waitlist.</p>
        ) : variant === 'admin' ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Voter</th>
                  <th>Joined</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {entries.map((row) => (
                  <tr key={row.registration_id}>
                    <td className="mono">{row.waitlist_position}</td>
                    <td>
                      <div>{row.full_name?.trim() || row.email}</div>
                      <div style={{ fontSize: 10, color: 'var(--subtle)' }}>{row.email}</div>
                    </td>
                    <td>{new Date(row.created_at).toLocaleDateString()}</td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {spotsOpen ? (
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          disabled={busyId === row.registration_id}
                          onClick={() => void handlePromoteOne(row.registration_id)}
                        >
                          Promote
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        disabled={busyId === row.registration_id || rollFinalized === true}
                        onClick={() => void handleReject(row.registration_id)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <ul className="space-y-2">
            {entries.map((row) => (
              <li
                key={row.registration_id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#e2e8f0] bg-slate-50/80 px-3 py-2 text-xs"
              >
                <div>
                  <span className="font-bold text-[#2451A3]">#{row.waitlist_position}</span>
                  <span className="ml-2 font-semibold text-slate-800">
                    {row.full_name?.trim() || row.email}
                  </span>
                  <span className="ml-2 text-slate-500">{row.email}</span>
                </div>
                <div className="flex gap-2">
                  {spotsOpen ? (
                    <button
                      type="button"
                      className="vs-t-btn vs-t-btn--primary"
                      disabled={busyId === row.registration_id}
                      onClick={() => void handlePromoteOne(row.registration_id)}
                    >
                      Promote
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="vs-t-btn"
                    disabled={busyId === row.registration_id || rollFinalized === true}
                    onClick={() => void handleReject(row.registration_id)}
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
