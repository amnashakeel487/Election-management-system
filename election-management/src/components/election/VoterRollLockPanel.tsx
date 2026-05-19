import { useEffect, useState } from 'react'
import { fetchElectionRegistrationStats } from '@/services/voterRegistrationService'
import type { Election } from '@/types/election'
import type { ElectionRegistrationStats } from '@/types/voterRegistration'
import {
  adminOverrideRegistrationLock,
  fetchFinalizedVoterRoll,
  lockElectionRegistration,
} from '@/services/voterRollLockingService'
import { downloadFinalizedVoterRollCsv } from '@/utils/voterRollExport'
import { registrationStatusLabel } from '@/utils/registrationLock'

export interface VoterRollLockPanelProps {
  election: Election
  stats?: ElectionRegistrationStats | null
  isAdmin?: boolean
  onChanged?: () => void
  compact?: boolean
}

export function VoterRollLockPanel({
  election,
  stats,
  isAdmin = false,
  onChanged,
  compact = false,
}: VoterRollLockPanelProps) {
  const [busy, setBusy] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [adminReason, setAdminReason] = useState('')
  const [showAdminOverride, setShowAdminOverride] = useState(false)

  const status = registrationStatusLabel(election)
  const live = election.status === 'published' || election.status === 'active'
  const canManageLock = live && !election.voter_roll_finalized_at
  const [loadedStats, setLoadedStats] = useState<ElectionRegistrationStats | null>(stats ?? null)

  useEffect(() => {
    if (stats) {
      setLoadedStats(stats)
      return
    }
    let cancelled = false
    void fetchElectionRegistrationStats(election.id)
      .then((s) => {
        if (!cancelled) setLoadedStats(s)
      })
      .catch(() => {
        if (!cancelled) setLoadedStats(null)
      })
    return () => {
      cancelled = true
    }
  }, [election.id, stats])

  const registered = loadedStats?.registered_count
  const displayStats = loadedStats

  async function handleLock() {
    const ok = window.confirm(
      `Lock registration for "${election.title}"? No new voters can join until an administrator unlocks it.`,
    )
    if (!ok) return

    setBusy('lock')
    setError(null)
    setMessage(null)
    try {
      await lockElectionRegistration(election.id, 'manual')
      setMessage('Registration locked. New joins are blocked.')
      onChanged?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lock failed')
    } finally {
      setBusy(null)
    }
  }

  async function handleAdminOverride(locked: boolean) {
    if (adminReason.trim().length < 3) {
      setError('Enter a reason (at least 3 characters) for the audit log.')
      return
    }

    setBusy(locked ? 'admin-lock' : 'admin-unlock')
    setError(null)
    setMessage(null)
    try {
      await adminOverrideRegistrationLock(election.id, locked, adminReason.trim())
      setMessage(locked ? 'Admin lock applied and logged.' : 'Registration unlocked by admin override.')
      setShowAdminOverride(false)
      setAdminReason('')
      onChanged?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Override failed')
    } finally {
      setBusy(null)
    }
  }

  async function handleDownloadRoll() {
    setBusy('export')
    setError(null)
    try {
      const roll = await fetchFinalizedVoterRoll(election.id)
      downloadFinalizedVoterRollCsv(roll)
      setMessage(`Downloaded ${roll.voter_count} voter(s).`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed')
    } finally {
      setBusy(null)
    }
  }

  const toneClass =
    status.tone === 'finalized'
      ? 'bg-secondary/15 text-secondary'
      : status.tone === 'locked'
        ? 'bg-amber-500/15 text-amber-800'
        : 'bg-emerald-500/15 text-emerald-800'

  return (
    <div className={compact ? 'space-y-2' : 'rounded-xl border border-line bg-surface-container-high/40 p-4'}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-label-sm font-bold uppercase tracking-wider text-on-surface-variant">Voter roll</p>
          {!compact ? (
            <p className="mt-0.5 text-[11px] text-on-surface-variant">
              Secret IDs are emailed when voters register · Registration locks when voting starts
            </p>
          ) : null}
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${toneClass}`}>
          {status.tone === 'open' ? 'Open' : status.tone === 'locked' ? 'Locked' : 'Finalized'}
        </span>
      </div>

      <p className="text-xs text-on-surface-variant">{status.label}</p>

      {registered != null ? (
        <p className="text-xs text-on-surface">
          <span className="font-semibold">{registered.toLocaleString()}</span> /{' '}
          {election.max_voters.toLocaleString()} registered
          {displayStats && displayStats.waitlist_count > 0
            ? ` · ${displayStats.waitlist_count} waitlisted`
            : ''}
        </p>
      ) : null}

      {error ? (
        <p className="rounded-lg border border-error/30 bg-error-container/20 px-2 py-1.5 text-[11px] text-error">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="rounded-lg border border-tertiary/30 bg-tertiary/10 px-2 py-1.5 text-[11px] text-tertiary">
          {message}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {canManageLock && !election.registration_locked_at ? (
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => void handleLock()}
            className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-[11px] font-bold text-amber-900 hover:bg-amber-500/20 disabled:opacity-60"
          >
            {busy === 'lock' ? 'Locking…' : 'Lock registration'}
          </button>
        ) : null}

        {election.voter_roll_finalized_at ? (
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => void handleDownloadRoll()}
            className="rounded-lg border border-line bg-surface-container px-3 py-1.5 text-[11px] font-bold text-on-surface hover:bg-elevated/50 disabled:opacity-60"
          >
            {busy === 'export' ? 'Preparing…' : 'Download voter list'}
          </button>
        ) : null}

        {isAdmin && canManageLock ? (
          <button
            type="button"
            onClick={() => setShowAdminOverride((v) => !v)}
            className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-[11px] font-bold text-primary"
          >
            Admin override
          </button>
        ) : null}
      </div>

      {isAdmin && showAdminOverride && canManageLock ? (
        <div className="mt-2 space-y-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
          <label className="block text-[11px] font-semibold text-on-surface">
            Audit reason (required)
            <textarea
              value={adminReason}
              onChange={(e) => setAdminReason(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-lg border border-line bg-surface px-2 py-1.5 text-xs text-on-surface"
              placeholder="Why is this override needed?"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            {election.registration_locked_at ? (
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => void handleAdminOverride(false)}
                className="rounded-lg bg-primary px-3 py-1.5 text-[11px] font-bold text-on-primary disabled:opacity-60"
              >
                {busy === 'admin-unlock' ? 'Unlocking…' : 'Unlock registration'}
              </button>
            ) : (
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => void handleAdminOverride(true)}
                className="rounded-lg bg-primary px-3 py-1.5 text-[11px] font-bold text-on-primary disabled:opacity-60"
              >
                {busy === 'admin-lock' ? 'Locking…' : 'Force lock'}
              </button>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
