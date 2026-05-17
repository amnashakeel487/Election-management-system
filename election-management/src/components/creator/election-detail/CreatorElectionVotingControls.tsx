import { useState } from 'react'
import { Link } from 'react-router-dom'
import { updateCreatorElectionControls } from '@/services/electionService'
import { lockElectionRegistration } from '@/services/voterRollLockingService'
import type { ElectionWithCandidates } from '@/types/election'
import { electionDisplayStatus } from '@/utils/dashboardDisplay'

export interface CreatorElectionVotingControlsProps {
  election: ElectionWithCandidates
  onReload: () => void
  onFinalize?: () => void
}

function votingStatusBadge(
  election: ElectionWithCandidates,
  nowMs: number,
): { label: string; stateClass: 'on' | 'off' | 'paused' } {
  if (election.status === 'completed' || election.status === 'archived') {
    return { label: 'Ended', stateClass: 'off' }
  }
  if (election.status === 'active') {
    return { label: 'Active', stateClass: 'on' }
  }
  const phase = electionDisplayStatus(election.status, election.start_date, election.end_date, nowMs)
  if (phase === 'active') return { label: 'Active', stateClass: 'on' }
  if (phase === 'upcoming') return { label: 'Upcoming', stateClass: 'paused' }
  return { label: 'Paused', stateClass: 'off' }
}

export function CreatorElectionVotingControls({
  election,
  onReload,
  onFinalize,
}: CreatorElectionVotingControlsProps) {
  const [busy, setBusy] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const nowMs = Date.now()
  const votingOpen = election.status === 'active'
  const anonymousOn = election.privacy_tier === 'zero_knowledge'
  const resultsOn = election.real_time_results
  const votingBadge = votingStatusBadge(election, nowMs)
  const isTerminal = election.status === 'completed' || election.status === 'archived'
  const isDraft = election.status === 'draft'
  const canStart = election.status === 'published' && !isTerminal
  const canPause = election.status === 'active'
  const canEnd = (election.status === 'published' || election.status === 'active') && !isTerminal
  const canRestart = election.status === 'completed'
  const canLock =
    (election.status === 'published' || election.status === 'active') &&
    (!election.voter_roll_finalized_at || !election.registration_locked_at)

  async function runAction(key: string, fn: () => Promise<void>) {
    setBusy(key)
    setError(null)
    setMessage(null)
    try {
      await fn()
      onReload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed')
    } finally {
      setBusy(null)
    }
  }

  async function handleStart() {
    if (isDraft) return
    await updateCreatorElectionControls(election.id, { status: 'active' })
    setMessage('Election started. Voting is now open.')
  }

  async function handlePause() {
    await updateCreatorElectionControls(election.id, { status: 'published' })
    setMessage('Voting paused. The election remains published but ballots are closed.')
  }

  async function handleEnd() {
    const ok = window.confirm(
      `End "${election.title}" now? This cannot be undone and will close voting immediately.`,
    )
    if (!ok) return
    await updateCreatorElectionControls(election.id, { status: 'completed' })
    setMessage('Election ended.')
  }

  async function handleRestart() {
    const ok = window.confirm(
      `Re-open "${election.title}" for voting? Status will return to published; confirm this is intentional.`,
    )
    if (!ok) return
    await updateCreatorElectionControls(election.id, { status: 'published' })
    setMessage('Election reopened as published. Start voting when ready.')
  }

  async function handleLockParticipants() {
    if (onFinalize && !election.voter_roll_finalized_at) {
      const ok = window.confirm(
        `Finalize the voter roll for "${election.title}"? This locks the participant list and issues secret voter IDs.`,
      )
      if (!ok) return
      onFinalize()
      return
    }
    const ok = window.confirm(`Lock registration for "${election.title}"? No new participants can join.`)
    if (!ok) return
    await lockElectionRegistration(election.id, 'manual')
    setMessage('Participant registration locked.')
  }

  async function handleVotingToggle() {
    if (votingOpen) {
      await handlePause()
    } else {
      await handleStart()
    }
  }

  async function handleAnonymousToggle() {
    await updateCreatorElectionControls(election.id, {
      privacy_tier: anonymousOn ? 'pseudonymous' : 'zero_knowledge',
    })
    setMessage(anonymousOn ? 'Anonymous mode disabled.' : 'Anonymous mode enabled.')
  }

  async function handleResultsToggle() {
    await updateCreatorElectionControls(election.id, { real_time_results: !resultsOn })
    setMessage(resultsOn ? 'Public results hidden.' : 'Public results enabled.')
  }

  return (
    <>
      <div className="vc-warning" style={{ marginBottom: 20 }}>
        <svg viewBox="0 0 24 24" aria-hidden>
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <div className="vc-warning-text">
          <strong>Important:</strong> Once the election starts, participants cannot be added or removed. The voter
          list will be locked automatically. Ending an election is irreversible.
        </div>
      </div>

      {error ? (
        <p className="vc-feedback vc-feedback-error" role="alert">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="vc-feedback vc-feedback-ok" role="status">
          {message}
        </p>
      ) : null}

      {isDraft ? (
        <p className="vc-draft-hint">
          Publish this election from the{' '}
          <Link to={`/creator/elections/${election.id}/edit`}>creation wizard</Link> before using voting controls.
        </p>
      ) : null}

      <div className="voting-controls-grid">
        <div className="vc-buttons">
          <button
            type="button"
            className="vc-btn start"
            disabled={!!busy || isDraft || !canStart}
            onClick={() => void runAction('start', handleStart)}
          >
            <svg viewBox="0 0 24 24" aria-hidden>
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            {busy === 'start' ? 'Starting…' : 'Start Election'}
          </button>
          <button
            type="button"
            className="vc-btn pause"
            disabled={!!busy || !canPause}
            onClick={() => void runAction('pause', handlePause)}
          >
            <svg viewBox="0 0 24 24" aria-hidden>
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
            {busy === 'pause' ? 'Pausing…' : 'Pause Voting'}
          </button>
          <button
            type="button"
            className="vc-btn end"
            disabled={!!busy || !canEnd}
            onClick={() => void runAction('end', handleEnd)}
          >
            <svg viewBox="0 0 24 24" aria-hidden>
              <rect x="3" y="3" width="18" height="18" />
            </svg>
            {busy === 'end' ? 'Ending…' : 'End Election'}
          </button>
          <button
            type="button"
            className="vc-btn restart"
            disabled={!!busy || !canRestart}
            onClick={() => void runAction('restart', handleRestart)}
          >
            <svg viewBox="0 0 24 24" aria-hidden>
              <polyline points="1 4 1 10 7 10" />
              <path d="M3.51 15a9 9 0 1 0 .49-3" />
            </svg>
            {busy === 'restart' ? 'Restarting…' : 'Restart Election'}
          </button>
          <button
            type="button"
            className="vc-btn lock"
            disabled={!!busy || !canLock}
            onClick={() => void runAction('lock', handleLockParticipants)}
          >
            <svg viewBox="0 0 24 24" aria-hidden>
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            {busy === 'lock' ? 'Locking…' : 'Lock Participants'}
          </button>
        </div>

        <div className="vc-status-panel">
          <div className="vc-status-card">
            <div className="vcs-top">
              <div className="vcs-label">Voting Status</div>
              <span className={`vcs-state ${votingBadge.stateClass}`}>{votingBadge.label}</span>
            </div>
            <div className="vcs-desc">
              {votingOpen
                ? 'Voting is currently open. Approved participants can cast their ballots until the election closes.'
                : isTerminal
                  ? 'This election has ended. Voting is closed.'
                  : 'Voting is not open. Start the election when you are ready for participants to cast ballots.'}
            </div>
            <div className="toggle-row">
              <button
                type="button"
                className={`toggle${votingOpen ? ' on' : ' off'}`}
                disabled={!!busy || isDraft || isTerminal}
                aria-pressed={votingOpen}
                onClick={() => void runAction('toggle-voting', handleVotingToggle)}
              />
              <span className={votingOpen ? 'toggle-caption on' : 'toggle-caption off'}>
                {votingOpen ? 'Voting open — toggle to pause' : 'Voting paused — toggle to open'}
              </span>
            </div>
          </div>

          <div className="vc-status-card">
            <div className="vcs-top">
              <div className="vcs-label">Anonymous Mode</div>
              <span className={`vcs-state ${anonymousOn ? 'on' : 'off'}`}>{anonymousOn ? 'Enabled' : 'Off'}</span>
            </div>
            <div className="vcs-desc">
              ZK-proof anonymity is {anonymousOn ? 'active' : 'off'}. Voter identities are{' '}
              {anonymousOn
                ? 'cryptographically hidden from everyone, including the creator.'
                : 'linked to pseudonymous identifiers for this election.'}
            </div>
            <div className="toggle-row">
              <button
                type="button"
                className={`toggle${anonymousOn ? ' on' : ' off'}`}
                disabled={!!busy || isTerminal}
                aria-pressed={anonymousOn}
                onClick={() => void runAction('toggle-anon', handleAnonymousToggle)}
              />
              <span className={anonymousOn ? 'toggle-caption on' : 'toggle-caption off'}>
                {anonymousOn ? 'ZK-Proof verified ✓' : 'Standard ballot mode'}
              </span>
            </div>
          </div>

          <div className="vc-status-card">
            <div className="vcs-top">
              <div className="vcs-label">Public Results</div>
              <span className={`vcs-state ${resultsOn ? 'on' : 'off'}`}>{resultsOn ? 'Enabled' : 'Hidden'}</span>
            </div>
            <div className="vcs-desc">
              {resultsOn
                ? 'Live results are visible to participants while voting is open.'
                : 'Live results are currently hidden from participants. Enable to show real-time vote counts publicly.'}
            </div>
            <div className="toggle-row">
              <button
                type="button"
                className={`toggle${resultsOn ? ' on' : ' off'}`}
                disabled={!!busy || isTerminal}
                aria-pressed={resultsOn}
                onClick={() => void runAction('toggle-results', handleResultsToggle)}
              />
              <span className={resultsOn ? 'toggle-caption on' : 'toggle-caption off'}>
                {resultsOn ? 'Results visible to voters' : 'Results hidden from voters'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
