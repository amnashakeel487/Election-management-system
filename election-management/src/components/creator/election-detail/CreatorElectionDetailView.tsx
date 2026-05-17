import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { promoteNextWaitlistSlots } from '@/services/waitlistService'
import { CreatorElectionDetailQrSection } from '@/components/creator/election-detail/CreatorElectionDetailQrSection'
import { CreatorElectionVotingControls } from '@/components/creator/election-detail/CreatorElectionVotingControls'
import { ElectionWaitlistPanel } from '@/components/waitlist/ElectionWaitlistPanel'
import { VoterRollLockPanel } from '@/components/election/VoterRollLockPanel'
import {
  CREATOR_CANDIDATE_CARD_THEMES,
  CreatorCandidateCard,
} from '@/components/creator/candidates/CreatorCandidateCard'
import type { AuditLogEntry } from '@/types/auth'
import type { Candidate, ElectionWithCandidates } from '@/types/election'
import type { ElectionResultsPayload } from '@/types/electionResults'
import type { ElectionRegistrationStats } from '@/types/voterRegistration'
import { avatarGradient, formatDashboardNumber } from '@/utils/dashboardDisplay'
import { formatElectionCode, formatTimeRemaining } from '@/utils/electionTime'
import { formatSubmissionDate } from '@/utils/formatDate'
import { getAuditPresentation, auditLogCategory } from '@/utils/auditPresentation'
import { downloadAuditCsv } from '@/services/auditService'
import {
  CED_SECTIONS,
  auditDotClass,
  candidateInitials,
  candidateVoteShare,
  ehStatusClass,
  ehStatusLabel,
  formatClosesInShort,
  formatDeadlineCountdown,
  isRegistrationClosingSoon,
  registrationFillPercent,
  votingCountdownLabel,
} from '@/components/creator/election-detail/creatorElectionDetailUtils'
import { canCreatorDeleteElection, canCreatorEditElectionDetails } from '@/services/electionService'

export interface CreatorElectionDetailViewProps {
  election: ElectionWithCandidates
  stats: ElectionRegistrationStats | null
  results: ElectionResultsPayload | null
  auditLogs: AuditLogEntry[]
  finalizingId: string | null
  finalizeMessage: string | null
  onReload: () => void
  onFinalize: () => void
  onDeleteCandidate?: (candidate: Candidate) => void
  deletingCandidateId?: string | null
  onDeleteElection?: () => void
  deletingElection?: boolean
}

const RANK_CLASS = ['gold', 'silver', 'bronze'] as const

function clampCandidateBio(s: string, max = 120): string {
  const t = s.trim()
  if (!t) return ''
  if (t.length <= max) return t
  return `${t.slice(0, max)}…`
}

const BAR_GRADIENTS = [
  'linear-gradient(90deg,#F59E0B,#d97706)',
  'linear-gradient(90deg,#2451A3,#1B3A6B)',
  'linear-gradient(90deg,#6C3FC5,#9333ea)',
]

export function CreatorElectionDetailView({
  election,
  stats,
  results,
  auditLogs,
  finalizingId,
  finalizeMessage,
  onReload,
  onFinalize,
  onDeleteCandidate,
  deletingCandidateId = null,
  onDeleteElection,
  deletingElection = false,
}: CreatorElectionDetailViewProps) {
  const [activeSection, setActiveSection] = useState<string>('sec-stats')
  const [nowMs, setNowMs] = useState(() => Date.now())
  const [promoteAllBusy, setPromoteAllBusy] = useState(false)
  const [regActionMessage, setRegActionMessage] = useState<string | null>(null)

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 30_000)
    return () => window.clearInterval(id)
  }, [])

  const status = ehStatusClass(election, nowMs)
  const canManageCandidates =
    election.status === 'draft' || election.status === 'published'
  const canDeleteElection = canCreatorDeleteElection(election.status)
  const canEditDetails = canCreatorEditElectionDetails(election.status)
  const candidatesManageUrl = `/creator/candidates?election=${election.id}`
  const showInvite = election.status !== 'draft'
  const showRoll =
    election.status === 'published' ||
    election.status === 'active' ||
    Boolean(election.voter_roll_finalized_at)

  const regPct = registrationFillPercent(stats)
  const spotsLeft = stats ? Math.max(0, stats.max_voters - stats.registered_count) : 0
  const waitlistCount = stats?.waitlist_count ?? 0
  const closesInShort = formatClosesInShort(election.registration_deadline, nowMs)
  const timeRemaining = formatDeadlineCountdown(election.registration_deadline, nowMs)
  const closingSoon = isRegistrationClosingSoon(election.registration_deadline, nowMs)
  const autoLockEnabled = !election.voter_roll_finalized_at
  const canPromoteWaitlist =
    !election.voter_roll_finalized_at &&
    waitlistCount > 0 &&
    spotsLeft > 0 &&
    (election.status === 'published' || election.status === 'draft')

  async function handleApproveAllWaitlisted() {
    if (!canPromoteWaitlist) return
    setPromoteAllBusy(true)
    setRegActionMessage(null)
    try {
      const result = await promoteNextWaitlistSlots(election.id, Math.min(waitlistCount, spotsLeft, 25))
      const count = result.promoted_count ?? result.promoted?.length ?? 0
      setRegActionMessage(
        count > 0 ? `Approved ${count} waitlisted voter(s).` : 'No waitlisted voters could be promoted.',
      )
      onReload()
    } catch (err) {
      setRegActionMessage(err instanceof Error ? err.message : 'Promotion failed')
    } finally {
      setPromoteAllBusy(false)
    }
  }
  const totalVotes = results?.total_votes ?? 0
  const turnout = results?.turnout_percent ?? stats?.participation_percent ?? 0

  const sortedCandidates = useMemo(() => {
    const list = [...election.candidates]
    if (results && results.total_votes > 0) {
      list.sort((a, b) => {
        const av = results.candidates.find((c) => c.candidate_id === a.id)?.vote_count ?? 0
        const bv = results.candidates.find((c) => c.candidate_id === b.id)?.vote_count ?? 0
        return bv - av
      })
    }
    return list
  }, [election.candidates, results])

  const topResults = useMemo(() => {
    if (!results?.candidates.length) return []
    return [...results.candidates].sort((a, b) => b.vote_count - a.vote_count).slice(0, 5)
  }, [results])

  const trendMax = useMemo(() => {
    const trend = results?.vote_trend ?? []
    return Math.max(1, ...trend.map((p) => p.votes))
  }, [results?.vote_trend])

  const electionAudit = useMemo(
    () => auditLogs.filter((l) => l.election_id === election.id).slice(0, 8),
    [auditLogs, election.id],
  )

  function scrollToSection(id: string) {
    setActiveSection(id)
    const el = document.getElementById(id)
    if (!el) return
    const scrollRoot = document.querySelector<HTMLElement>('.creator-app .main')
    if (scrollRoot) {
      const nav = document.querySelector<HTMLElement>('.creator-election-detail .section-nav')
      const offset = (nav?.offsetHeight ?? 52) + 74
      const top = el.getBoundingClientRect().top - scrollRoot.getBoundingClientRect().top + scrollRoot.scrollTop - offset
      scrollRoot.scrollTo({ top: Math.max(0, top), behavior: 'smooth' })
      return
    }
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="creator-election-detail">
      <div className="election-header" id="sec-header">
        <div className="eh-grid-bg" />
        <div className="eh-orb1" />
        <div className="eh-orb2" />
        <div className="eh-inner">
          <div className="eh-left">
            <div className="eh-meta-row">
              {election.category ? <span className="eh-category">{election.category}</span> : null}
              <span className={`eh-status ${status}`}>
                <span className="eh-status-dot" />
                {ehStatusLabel(status)}
              </span>
            </div>
            <h1 className="eh-title">{election.title}</h1>
            <p className="eh-desc">{election.description?.trim() || 'No description provided.'}</p>
            <div className="eh-deadline">
              <svg viewBox="0 0 24 24" aria-hidden>
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <strong style={{ marginLeft: 4 }}>{votingCountdownLabel(election, nowMs)}</strong>
            </div>
            <div className="eh-id-chip">
              <svg viewBox="0 0 24 24" width="11" height="11" aria-hidden>
                <rect x="2" y="7" width="20" height="14" rx="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
              Election ID: {formatElectionCode(election.id)}
            </div>
          </div>
          <div className="eh-actions">
            {canEditDetails ? (
              <Link to={`/creator/elections/${election.id}/edit`} className="btn-edit">
                <svg viewBox="0 0 24 24" aria-hidden>
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                {election.status === 'draft' ? 'Continue wizard' : 'Edit schedule'}
              </Link>
            ) : null}
            <Link to={`/elections/${election.id}`} className="btn-publish" target="_blank" rel="noreferrer">
              <svg viewBox="0 0 24 24" aria-hidden>
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              Public page
            </Link>
            {canDeleteElection && onDeleteElection ? (
              <button
                type="button"
                className="btn-delete-election"
                disabled={deletingElection}
                onClick={() => onDeleteElection()}
              >
                <svg viewBox="0 0 24 24" aria-hidden>
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
                {deletingElection ? 'Deleting…' : 'Delete election'}
              </button>
            ) : null}
            <Link to="/creator/elections" className="btn-more" title="All elections" aria-label="All elections">
              <svg viewBox="0 0 24 24" aria-hidden>
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      {finalizeMessage ? (
        <p style={{ marginBottom: 16, fontSize: 12, color: 'var(--ced-muted)' }}>{finalizeMessage}</p>
      ) : null}

      <nav className="section-nav" aria-label="Page sections">
        {CED_SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            className={`sn-link${activeSection === s.id ? ' active' : ''}`}
            onClick={() => scrollToSection(s.id)}
          >
            {s.label}
          </button>
        ))}
      </nav>

      <div className="quick-stats" id="sec-stats">
        <div className="qs-card blue">
          <div className="qs-icon blue">
            <svg viewBox="0 0 24 24" aria-hidden>
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div className="qs-num">{stats ? formatDashboardNumber(stats.registered_count) : '—'}</div>
          <div className="qs-sub">Participants</div>
          {stats ? (
            <div className="qs-extra">of {formatDashboardNumber(stats.max_voters)} max</div>
          ) : null}
        </div>
        <div className="qs-card purple">
          <div className="qs-icon purple">
            <svg viewBox="0 0 24 24" aria-hidden>
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <div className="qs-num">{election.candidates.length}</div>
          <div className="qs-sub">Candidates</div>
        </div>
        <div className="qs-card green">
          <div className="qs-icon green">
            <svg viewBox="0 0 24 24" aria-hidden>
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div className="qs-num">{totalVotes > 0 ? formatDashboardNumber(totalVotes) : '—'}</div>
          <div className="qs-sub">Votes cast</div>
          {turnout > 0 ? <div className="qs-extra">{turnout.toFixed(1)}% turnout</div> : null}
        </div>
        <div className="qs-card orange">
          <div className="qs-icon orange">
            <svg viewBox="0 0 24 24" aria-hidden>
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div className="qs-timer">{formatTimeRemaining(election.end_date, nowMs)}</div>
          <div className="qs-sub">Time left</div>
        </div>
        <div className="qs-card cyan">
          <div className="qs-icon cyan">
            <svg viewBox="0 0 24 24" aria-hidden>
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <div className="qs-num">{stats ? `${regPct.toFixed(0)}%` : '—'}</div>
          <div className="qs-sub">Registration</div>
          {stats && stats.waitlist_count > 0 ? (
            <div className="qs-extra warn">{stats.waitlist_count} waitlisted</div>
          ) : null}
        </div>
      </div>

      {/* Info */}
      <div className="panel" id="sec-info">
        <div className="panel-head">
          <div className="panel-head-left">
            <div className="panel-title">Election Information</div>
            <div className="panel-sub">Full configuration details</div>
          </div>
          <div className="panel-head-right">
            {canEditDetails ? (
              <Link to={`/creator/elections/${election.id}/edit`} className="p-btn">
                Edit details
              </Link>
            ) : null}
          </div>
        </div>
        <div className="panel-body">
          <div className="info-grid">
            <InfoItem label="Title" value={election.title} iconStroke="var(--ced-blue)" />
            <InfoItem label="Category" value={election.category || 'General'} iconStroke="var(--ced-purple)" />
            <InfoItem label="Start date" value={formatSubmissionDate(election.start_date)} iconStroke="var(--ced-success)" />
            <InfoItem label="End date" value={formatSubmissionDate(election.end_date)} iconStroke="var(--ced-danger)" />
            <InfoItem
              label="Registration deadline"
              value={
                election.registration_deadline
                  ? formatSubmissionDate(election.registration_deadline)
                  : 'Not set'
              }
              iconStroke="var(--ced-warning)"
            />
            <InfoItem
              label="Max voters"
              value={
                stats
                  ? `${stats.max_voters.toLocaleString()} max · ${stats.registered_count.toLocaleString()} joined`
                  : String(election.max_voters)
              }
              mono
              iconStroke="var(--ced-blue)"
            />
            <InfoItem
              label="Visibility"
              value={
                <span className="visibility-badge">
                  <svg viewBox="0 0 24 24" aria-hidden>
                    <circle cx="12" cy="12" r="10" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                  {election.privacy_tier === 'private' ? 'Private' : 'Public'}
                </span>
              }
              iconStroke="var(--ced-success)"
            />
            <InfoItem
              label="Voting method"
              value={`${election.privacy_tier} · ${election.real_time_results ? 'Live results' : 'Results hidden'}`}
              iconStroke="var(--ced-cyan)"
            />
          </div>
        </div>
      </div>

      {/* Candidates */}
      <div className="panel" id="sec-candidates">
        <div className="panel-head">
          <div className="panel-head-left">
            <div className="panel-title">Candidates</div>
            <div className="panel-sub">
              {election.candidates.length} candidate{election.candidates.length === 1 ? '' : 's'}
            </div>
          </div>
          <div className="panel-head-right">
            <Link to={candidatesManageUrl} className="p-btn primary">
              Manage all
            </Link>
          </div>
        </div>
        <div className="panel-body">
          {sortedCandidates.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--ced-muted)' }}>No candidates yet.</p>
          ) : (
            <div className="candidates-grid">
              {sortedCandidates.slice(0, 6).map((c, i) => {
                const { pct, votes } = candidateVoteShare(c.id, results)
                const rank = RANK_CLASS[i] ?? 'bronze'
                const theme = CREATOR_CANDIDATE_CARD_THEMES[i % CREATOR_CANDIDATE_CARD_THEMES.length]
                const pctLabel =
                  totalVotes > 0
                    ? `${pct}% of total`
                    : election.status === 'draft'
                      ? 'Votes appear after publishing'
                      : '0% of total'

                return (
                  <CreatorCandidateCard
                    key={c.id}
                    candidate={c}
                    theme={theme}
                    votes={votes}
                    pct={pct}
                    pctLabel={pctLabel}
                    bio={clampCandidateBio(c.description ?? '')}
                    canManage={canManageCandidates}
                    editHref={candidatesManageUrl}
                    onDelete={onDeleteCandidate ? () => onDeleteCandidate(c) : undefined}
                    deleteDisabled={deletingCandidateId === c.id}
                    headerExtra={
                      results && pct > 0 ? (
                        <span className={`candidate-rank-badge ${rank}`}>#{i + 1}</span>
                      ) : null
                    }
                  />
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Participants summary */}
      <div className="panel" id="sec-participants">
        <div className="panel-head">
          <div className="panel-head-left">
            <div className="panel-title">Participants</div>
            <div className="panel-sub">Voter registration overview</div>
          </div>
          <div className="panel-head-right">
            <Link to="/creator/participants" className="p-btn primary">
              Manage participants
            </Link>
          </div>
        </div>
        <div className="panel-body">
          <div className="participants-stats">
            <div className="pstat registered">
              <div className="pstat-num">{stats?.registered_count ?? 0}</div>
              <div className="pstat-label">Registered</div>
            </div>
            <div className="pstat waitlisted">
              <div className="pstat-num">{stats?.waitlist_count ?? 0}</div>
              <div className="pstat-label">Waitlisted</div>
            </div>
            <div className="pstat approved">
              <div className="pstat-num">{stats?.registered_count ?? 0}</div>
              <div className="pstat-label">On roll</div>
            </div>
            <div className="pstat rejected">
              <div className="pstat-num">{spotsLeft}</div>
              <div className="pstat-label">Spots left</div>
            </div>
          </div>
          <p style={{ fontSize: 13, color: 'var(--ced-muted)', marginTop: 8 }}>
            Open the participants page to search, approve waitlist entries, and export the voter roll.
          </p>
        </div>
      </div>

      {/* Registration */}
      {showRoll ? (
        <div className="panel reg-status-panel" id="sec-registration">
          <div className="panel-head reg-panel-head">
            <div className="panel-title">Registration Status</div>
            <div className="panel-sub">Capacity and deadline tracking</div>
          </div>
          <div className="panel-body">
            {regActionMessage ? (
              <p className="reg-action-msg" role="status">
                {regActionMessage}
              </p>
            ) : null}
            <div className="reg-status-inner">
              <div className="reg-progress-section">
                <div className="reg-progress-header">
                  <div>
                    <div className="reg-pct-big">{regPct.toFixed(1)}%</div>
                    <div className="reg-count">
                      {formatDashboardNumber(stats?.registered_count ?? 0)} of{' '}
                      {formatDashboardNumber(stats?.max_voters ?? election.max_voters)} spots filled
                    </div>
                  </div>
                  <div className="reg-spots-meta">
                    <div className="reg-spots-left">{formatDashboardNumber(spotsLeft)} spots left</div>
                    {closesInShort && closesInShort !== 'Closed' ? (
                      <div className="reg-closes-in">Closes in {closesInShort}</div>
                    ) : null}
                  </div>
                </div>
                <div className="reg-bar-track">
                  <div className="reg-bar-fill" style={{ width: `${Math.min(100, regPct)}%` }} />
                </div>
                <div className="reg-info-grid">
                  <div className="reg-info-item">
                    <div className="reg-info-label">Deadline</div>
                    <div className="reg-info-value">
                      {election.registration_deadline
                        ? formatSubmissionDate(election.registration_deadline)
                        : '—'}
                    </div>
                  </div>
                  <div className="reg-info-item">
                    <div className="reg-info-label">Time remaining</div>
                    <div
                      className={`reg-info-value${timeRemaining && timeRemaining !== 'Closed' ? ' warn' : ''}`}
                    >
                      {timeRemaining ?? '—'}
                    </div>
                  </div>
                  <div className="reg-info-item">
                    <div className="reg-info-label">Auto-lock</div>
                    <div className="reg-info-value">
                      {autoLockEnabled ? (
                        <span className="reg-auto-lock-on">
                          <span className="reg-dot" aria-hidden /> Enabled
                        </span>
                      ) : (
                        'Finalized'
                      )}
                    </div>
                  </div>
                  <div className="reg-info-item">
                    <div className="reg-info-label">Waitlist</div>
                    <div className="reg-info-value">{waitlistCount} pending</div>
                  </div>
                </div>
              </div>

              <div className="reg-alert-section">
                <div className="reg-alert-box">
                  <div className="reg-alert-icon" aria-hidden>
                    <svg viewBox="0 0 24 24">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                      <line x1="12" y1="9" x2="12" y2="13" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                  </div>
                  <p className="reg-alert-text">
                    {timeRemaining && timeRemaining !== 'Closed' ? (
                      <>
                        <strong>Registration closes in {timeRemaining}.</strong> Once the deadline passes, the
                        voter list will be automatically locked. Waitlisted participants must be approved or
                        rejected before voting begins.
                      </>
                    ) : election.voter_roll_finalized_at ? (
                      <>
                        <strong>Voter roll is finalized.</strong> Registration is closed and the participant list
                        is locked for this election.
                      </>
                    ) : (
                      <>
                        <strong>Registration is open.</strong> Monitor capacity and approve waitlisted voters before
                        the registration deadline or voting starts.
                      </>
                    )}
                  </p>
                  <div className="reg-alert-tags">
                    {autoLockEnabled ? <span className="reg-tag active">✓ Auto-lock enabled</span> : null}
                    {waitlistCount > 0 ? (
                      <span className="reg-tag warn">⚠ {waitlistCount} waitlisted</span>
                    ) : null}
                    {closingSoon && timeRemaining !== 'Closed' ? (
                      <span className="reg-tag warn">⚠ Closing soon</span>
                    ) : null}
                  </div>
                  <div className="reg-actions">
                    <button
                      type="button"
                      className="reg-btn reg-btn-approve"
                      disabled={!canPromoteWaitlist || promoteAllBusy}
                      onClick={() => void handleApproveAllWaitlisted()}
                    >
                      {promoteAllBusy ? 'Approving…' : '✓ Approve All Waitlisted'}
                    </button>
                    {canEditDetails && !election.voter_roll_finalized_at ? (
                      <Link to={`/creator/elections/${election.id}/edit`} className="reg-btn reg-btn-extend">
                        Extend Deadline
                      </Link>
                    ) : (
                      <button type="button" className="reg-btn reg-btn-extend" disabled>
                        Extend Deadline
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="ced-embedded-panels" style={{ marginTop: 20 }}>
              <ElectionWaitlistPanel
                electionId={election.id}
                voterRollFinalized={election.voter_roll_finalized_at}
                onChanged={onReload}
              />
              <VoterRollLockPanel
                election={election}
                stats={stats}
                finalizingId={finalizingId}
                onFinalize={() => onFinalize()}
                onChanged={onReload}
              />
            </div>
          </div>
        </div>
      ) : null}

      {/* QR */}
      {showInvite ? (
        <div className="panel" id="sec-qr">
          <div className="panel-head">
            <div className="panel-head-left">
              <div className="panel-title">Invite Participants</div>
              <div className="panel-sub">Share QR code or invite link to onboard voters</div>
            </div>
          </div>
          <div className="panel-body">
            <CreatorElectionDetailQrSection electionId={election.id} electionTitle={election.title} />
          </div>
        </div>
      ) : (
        <div className="panel" id="sec-qr">
          <div className="panel-body">
            <p style={{ fontSize: 13, color: 'var(--ced-muted)' }}>
              Publish this election to generate an invite link and QR code.
            </p>
            <Link to={`/creator/elections/${election.id}/edit`} className="p-btn primary" style={{ marginTop: 12, display: 'inline-flex' }}>
              Open creation wizard
            </Link>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="panel vc-panel" id="sec-controls">
        <div className="panel-head">
          <div className="panel-head-left">
            <div className="panel-title">Voting Controls</div>
            <div className="panel-sub">Manage the state of this election</div>
          </div>
        </div>
        <div className="panel-body">
          <CreatorElectionVotingControls
            election={election}
            onReload={onReload}
            onFinalize={onFinalize}
          />
        </div>
      </div>

      {/* Live stats */}
      {results && results.total_votes > 0 ? (
        <div className="panel" id="sec-live">
          <div className="panel-head">
            <div className="panel-head-left">
              <div className="panel-title">Live Statistics</div>
              <div className="panel-sub" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {results.is_live ? (
                  <>
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        background: 'var(--ced-success)',
                        borderRadius: '50%',
                        display: 'inline-block',
                      }}
                    />
                    Updating with new ballots
                  </>
                ) : (
                  'Snapshot from latest results'
                )}
              </div>
            </div>
          </div>
          <div className="panel-body">
            <div className="live-stats-grid">
              <div className="live-stat-mini">
                <div className="lsm-num" style={{ color: 'var(--ced-blue)' }}>
                  {turnout.toFixed(1)}%
                </div>
                <div className="lsm-label">Turnout</div>
              </div>
              <div className="live-stat-mini">
                <div className="lsm-num">{formatDashboardNumber(totalVotes)}</div>
                <div className="lsm-label">Votes cast</div>
              </div>
              <div className="live-stat-mini">
                <div className="lsm-num" style={{ color: 'var(--ced-warning)' }}>
                  {Math.max(0, (stats?.registered_count ?? 0) - totalVotes)}
                </div>
                <div className="lsm-label">Remaining voters</div>
              </div>
            </div>
            {(results.vote_trend?.length ?? 0) > 0 ? (
              <div style={{ marginTop: 20 }}>
                <div className="chart-title">Votes per hour</div>
                <div className="bar-chart">
                  {results.vote_trend.map((p) => (
                    <div
                      key={p.hour}
                      className="bar-chart-bar"
                      style={{
                        height: `${Math.round((p.votes / trendMax) * 95)}%`,
                        background: 'linear-gradient(180deg,rgba(36,81,163,0.7),rgba(36,81,163,0.2))',
                      }}
                      title={`${p.hour}: ${p.votes}`}
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* Results */}
      {topResults.length > 0 ? (
        <div className="panel" id="sec-results">
          <div className="panel-head">
            <div className="panel-head-left">
              <div className="panel-title">Results Preview</div>
              <div className="panel-sub">
                {results?.results_locked_at ? 'Certified' : 'Preliminary'} results
              </div>
            </div>
            <div className="panel-head-right">
              <Link to={`/elections/${election.id}/results`} className="p-btn primary" target="_blank" rel="noreferrer">
                View full results
              </Link>
            </div>
          </div>
          <div className="panel-body">
            <div className="results-list">
              {topResults.map((row, i) => {
                const pct =
                  results && results.total_votes > 0
                    ? Math.round((row.vote_count / results.total_votes) * 1000) / 10
                    : 0
                const rank = RANK_CLASS[i] ?? 'bronze'
                return (
                  <div key={row.candidate_id} className="result-item">
                    <div className={`result-rank ${rank}`}>#{i + 1}</div>
                    <div className="result-avatar" style={{ background: avatarGradient(row.name) }}>
                      {candidateInitials(row.name)}
                    </div>
                    <div className="result-info">
                      <div className="result-name">
                        {row.name}
                        {i === 0 ? <span className="winner-tag">★ Leading</span> : null}
                      </div>
                      <div className="result-party">{row.designation || 'Candidate'}</div>
                    </div>
                    <div className="result-bar-wrap">
                      <div className="result-bar-track">
                        <div
                          className="result-bar-fill"
                          style={{ width: `${pct}%`, background: BAR_GRADIENTS[i % 3] }}
                        />
                      </div>
                    </div>
                    <div className="result-pct">{pct}%</div>
                    <div className="result-votes">{row.vote_count} votes</div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      ) : null}

      {/* Audit */}
      <div className="panel" id="sec-audit">
        <div className="panel-head">
          <div className="panel-head-left">
            <div className="panel-title">Audit Activity</div>
            <div className="panel-sub">Transparency log for this election</div>
          </div>
          <div className="panel-head-right">
            <button
              type="button"
              className="p-btn"
              onClick={() => downloadAuditCsv(electionAudit, `election-${election.id.slice(0, 8)}`)}
              disabled={electionAudit.length === 0}
            >
              Export logs
            </button>
          </div>
        </div>
        <div className="panel-body">
          {electionAudit.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--ced-muted)' }}>No audit events for this election yet.</p>
          ) : (
            <div className="audit-timeline">
              {electionAudit.map((log) => {
                const pres = getAuditPresentation(log)
                const cat = auditLogCategory(log.action, log.details)
                return (
                  <div key={log.id} className="audit-item">
                    <div className={`audit-dot ${auditDotClass(cat)}`} />
                    <div className="audit-content">
                      <div className="audit-top">
                        <div className="audit-action">{pres.title}</div>
                        <div className="audit-time">{formatSubmissionDate(log.created_at)}</div>
                      </div>
                      <div className="audit-detail">{pres.description}</div>
                      {log.actor?.email ? (
                        <div className="audit-user">{log.actor.email}</div>
                      ) : null}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function InfoItem({
  label,
  value,
  mono,
  iconStroke,
}: {
  label: string
  value: ReactNode
  mono?: boolean
  iconStroke: string
}) {
  return (
    <div className="info-item">
      <div className="info-icon" style={{ background: `${iconStroke}1a` }}>
        <svg viewBox="0 0 24 24" stroke={iconStroke} aria-hidden>
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      </div>
      <div>
        <div className="info-label">{label}</div>
        <div className={`info-value${mono ? ' mono' : ''}`}>{value}</div>
      </div>
    </div>
  )
}
