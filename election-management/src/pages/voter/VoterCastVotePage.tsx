import { useCallback, useEffect, useRef, useState, type CSSProperties, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { VoterPageHeader } from '@/components/voter/VoterPageHeader'
import { VotingBlockedView } from '@/components/voting/VotingBlockedView'
import { useAuth } from '@/hooks/useAuth'
import { useVoterDashboard } from '@/hooks/useVoterDashboard'
import { fetchElectionById } from '@/services/electionService'
import { fetchUserRegistrationForElection } from '@/services/voterRegistrationService'
import {
  castAnonymousVote,
  clearVerifiedSession,
  ensureElectionVotingReady,
  getVerifiedSession,
  setVerifiedSession,
  verifySecretVoterForVoting,
} from '@/services/votingService'
import type { Candidate, ElectionWithCandidates } from '@/types/election'
import { formatCountdownMs, isPollingOpen } from '@/utils/electionPolling'
import { maskSecretVoterId } from '@/utils/maskSecretVoterId'
import { buildVotingEligibilityDetail, validateSecretIdInput } from '@/utils/votingEligibility'

type Step = 'loading' | 'blocked' | 'verify' | 'ballot' | 'confirm'

export function VoterCastVotePage() {
  const { electionId } = useParams<{ electionId: string }>()
  const navigate = useNavigate()
  const { session } = useAuth()
  const { reload: reloadDashboard } = useVoterDashboard()
  const castInFlight = useRef(false)

  const [election, setElection] = useState<ElectionWithCandidates | null>(null)
  const [step, setStep] = useState<Step>('loading')
  const [blockMessage, setBlockMessage] = useState<string | null>(null)
  const [blockOpensInMs, setBlockOpensInMs] = useState<number | null>(null)

  const [secretInput, setSecretInput] = useState('')
  const [secretVoterId, setSecretVoterId] = useState<string | null>(null)
  const [maskedId, setMaskedId] = useState<string | null>(null)
  const [verifyError, setVerifyError] = useState<string | null>(null)
  const [verifying, setVerifying] = useState(false)

  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const [timeLeftMs, setTimeLeftMs] = useState(0)
  const [sessionLeftMs, setSessionLeftMs] = useState(0)

  const loadData = useCallback(async () => {
    if (!electionId || !session?.user.id) return

    let electionData = await fetchElectionById(electionId)

    if (electionData && new Date(electionData.start_date).getTime() <= Date.now()) {
      const ready = await ensureElectionVotingReady(electionId)
      if (ready.error?.includes('migration')) {
        setBlockMessage(ready.error)
        setStep('blocked')
        return
      }
      electionData = await fetchElectionById(electionId)
    }

    const reg = await fetchUserRegistrationForElection(electionId, session.user.id)

    setElection(electionData)

    if (!electionData) {
      setBlockMessage('Election not found.')
      setStep('blocked')
      return
    }

    const eligibility = buildVotingEligibilityDetail(electionData, reg, session.user.id)

    if (reg?.voted_at) {
      setStep('blocked')
      setBlockMessage('You have already cast your vote in this election.')
      return
    }

    if (!eligibility.canVote) {
      setStep('blocked')
      setBlockMessage(eligibility.blockReason ?? 'You are not eligible to vote.')
      if (eligibility.phase === 'not_started') {
        setBlockOpensInMs(eligibility.opensInMs)
      }
      return
    }

    const restored = getVerifiedSession(electionId)
    if (restored?.secretVoterId) {
      setSecretVoterId(restored.secretVoterId)
      setMaskedId(restored.maskedSecretId)
      setStep('ballot')
      return
    }

    setStep('verify')
  }, [electionId, session?.user.id])

  useEffect(() => {
    if (!electionId) return
    let cancelled = false

    async function init() {
      try {
        await loadData()
      } catch (err) {
        if (!cancelled) {
          setBlockMessage(err instanceof Error ? err.message : 'Failed to load ballot')
          setStep('blocked')
        }
      }
    }

    void init()
    return () => {
      cancelled = true
    }
  }, [electionId, loadData])

  useEffect(() => {
    if (!election || !electionId) return
    const endDate = election.end_date

    function tick() {
      const remaining = new Date(endDate).getTime() - Date.now()
      setTimeLeftMs(remaining)

      if (remaining <= 0 && ['ballot', 'verify', 'confirm'].includes(step) && electionId) {
        clearVerifiedSession(electionId)
        setSecretVoterId(null)
        setSelectedCandidate(null)
        setStep('blocked')
        setBlockMessage('Voting period has ended. The ballot is now locked.')
      }
    }

    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [election, electionId, step])

  useEffect(() => {
    if (!electionId || !['ballot', 'confirm'].includes(step)) return
    const sessionElectionId: string = electionId

    function tickSession() {
      const verified = getVerifiedSession(sessionElectionId)
      if (verified) {
        setSessionLeftMs(verified.expiresAt - Date.now())
        if (!secretVoterId && verified.secretVoterId) {
          setSecretVoterId(verified.secretVoterId)
          setMaskedId(verified.maskedSecretId)
        }
      } else {
        setStep('verify')
        setSecretVoterId(null)
        setMaskedId(null)
        setSelectedCandidate(null)
      }
    }

    tickSession()
    const id = window.setInterval(tickSession, 1000)
    return () => window.clearInterval(id)
  }, [electionId, step, secretVoterId])

  async function handleVerify(e: FormEvent) {
    e.preventDefault()
    if (!electionId || !election) return

    const formatError = validateSecretIdInput(secretInput, election.secret_voter_id_prefix)
    if (formatError) {
      setVerifyError(formatError)
      return
    }

    setVerifying(true)
    setVerifyError(null)

    try {
      const result = await verifySecretVoterForVoting(electionId, secretInput)

      if (!result.valid) {
        setVerifyError(result.message ?? 'Verification failed')
        return
      }

      const normalized = secretInput.trim()
      const masked = result.masked_secret_id ?? maskSecretVoterId(normalized)
      setSecretVoterId(normalized)
      setMaskedId(masked)
      setVerifiedSession(electionId, masked, normalized)
      setStep('ballot')
    } catch (err) {
      setVerifyError(err instanceof Error ? err.message : 'Verification failed')
    } finally {
      setVerifying(false)
    }
  }

  function handleOpenConfirm() {
    if (!selectedCandidate || !secretVoterId) return
    if (!election || !isPollingOpen(election)) {
      setStep('blocked')
      setBlockMessage('Voting is closed for this election.')
      return
    }
    setSubmitError(null)
    setStep('confirm')
  }

  async function handleCastVote() {
    if (!electionId || !selectedCandidate || !secretVoterId || castInFlight.current) return
    if (!election || !isPollingOpen(election)) {
      setStep('blocked')
      setBlockMessage('Voting period has ended.')
      return
    }

    castInFlight.current = true
    setSubmitting(true)
    setSubmitError(null)

    try {
      const result = await castAnonymousVote(electionId, secretVoterId, selectedCandidate.id)
      clearVerifiedSession(electionId)
      void reloadDashboard()
      const receipt = result.receipt_hash ?? ''
      const verify = result.verification_hash ?? ''
      const qs = new URLSearchParams({ electionId, receipt })
      if (verify) qs.set('verify', verify)
      navigate(`/voter/vote/success?${qs.toString()}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to submit vote'
      setSubmitError(message)
      if (message.toLowerCase().includes('already voted')) {
        clearVerifiedSession(electionId)
        setStep('blocked')
        setBlockMessage(message)
      }
    } finally {
      setSubmitting(false)
      castInFlight.current = false
    }
  }

  function handleChangeId() {
    if (electionId) clearVerifiedSession(electionId)
    setSecretVoterId(null)
    setMaskedId(null)
    setSecretInput('')
    setSelectedCandidate(null)
    setStep('verify')
  }

  if (step === 'loading') {
    return (
      <div className="card-elevated">
        <div className="card-body">Loading secure ballot…</div>
      </div>
    )
  }

  if (step === 'blocked') {
    return <VotingBlockedView message={blockMessage} electionId={electionId} opensInMs={blockOpensInMs} />
  }

  if (!election || !electionId) return null

  return (
    <>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <VoterPageHeader eyebrow="Secure Voting" title="Cast Your Vote" subtitle={election.title} />

        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={chipStyle}>
            <svg width={10} height={10} viewBox="0 0 24 24" aria-hidden>
              <rect x="3" y="11" width="18" height="11" rx="2" stroke="#10B981" strokeWidth="2.5" fill="none" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="#10B981" strokeWidth="2.5" fill="none" />
            </svg>
            AES-256 Encrypted
          </div>
          <div style={chipStyle}>
            <svg width={10} height={10} viewBox="0 0 24 24" aria-hidden>
              <polyline points="20 6 9 17 4 12" stroke="#10B981" strokeWidth="2.5" fill="none" />
            </svg>
            Anonymous Vote
          </div>
          <div style={chipStyle}>
            <svg width={10} height={10} viewBox="0 0 24 24" aria-hidden>
              <polyline points="20 6 9 17 4 12" stroke="#10B981" strokeWidth="2.5" fill="none" />
            </svg>
            Tamper-Proof
          </div>
        </div>

        {step === 'verify' ? (
          <>
            <div className="card-elevated" style={{ marginBottom: 16 }}>
              <div className="card-body">
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                  <div style={{ fontSize: 36, marginBottom: 8 }}>🔑</div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>Verify Your Identity</div>
                  <div style={{ fontSize: 12, color: 'var(--subtle)', marginTop: 4 }}>
                    Enter your Secret Voter ID to access the ballot
                  </div>
                </div>
                <form onSubmit={(e) => void handleVerify(e)}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="voter-sid-input">
                      Secret Voter ID
                    </label>
                    <input
                      id="voter-sid-input"
                      className="form-input"
                      placeholder="VS-XXXX-XXXX-XXXX"
                      style={{ textAlign: 'center', fontFamily: "'IBM Plex Mono', monospace", fontSize: 16, letterSpacing: 3 }}
                      value={secretInput}
                      onChange={(e) => setSecretInput(e.target.value)}
                      autoComplete="off"
                    />
                  </div>
                  {verifyError ? (
                    <div className="alert a-danger" style={{ marginBottom: 12 }}>
                      <svg viewBox="0 0 24 24" aria-hidden>
                        <circle cx="12" cy="12" r="10" />
                        <line x1="15" y1="9" x2="9" y2="15" />
                        <line x1="9" y1="9" x2="15" y2="15" />
                      </svg>
                      {verifyError}
                    </div>
                  ) : null}
                  <button type="submit" className="btn btn-success" style={{ width: '100%', justifyContent: 'center', padding: 12 }} disabled={verifying}>
                    {verifying ? 'Verifying…' : 'Verify & Continue →'}
                  </button>
                </form>
              </div>
            </div>
            <div className="alert a-warning">
              <svg viewBox="0 0 24 24" aria-hidden>
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              Your vote is anonymous. Once submitted it cannot be changed.
            </div>
          </>
        ) : (
          <>
            <div style={verifiedBannerStyle}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#166534' }}>
                ✓ Identity Verified — {maskedId ?? '••••'}
              </div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 14, fontWeight: 700, color: '#EF4444' }}>
                {formatCountdownMs(timeLeftMs)}
              </div>
            </div>
            <div style={{ fontSize: 11, color: 'var(--subtle)', marginBottom: 8 }}>
              Session {formatCountdownMs(Math.max(0, sessionLeftMs))} ·{' '}
              <button type="button" className="btn btn-ghost btn-xs" onClick={handleChangeId}>
                Change ID
              </button>
            </div>

            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Select your candidate:</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(election.candidates ?? []).map((c) => {
                const selected = selectedCandidate?.id === c.id
                return (
                  <button
                    key={c.id}
                    type="button"
                    className={`vote-cand${selected ? ' selected' : ''}`}
                    onClick={() => setSelectedCandidate(c)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ flex: 1, textAlign: 'left' }}>
                        <div style={{ fontSize: 14, fontWeight: 700 }}>{c.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--subtle)' }}>{c.designation ?? 'Candidate'}</div>
                        {c.description ? (
                          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>{c.description}</div>
                        ) : null}
                      </div>
                      <div className="vc-radio">
                        {selected ? (
                          <svg width={12} height={12} viewBox="0 0 24 24" aria-hidden>
                            <polyline points="20 6 9 17 4 12" stroke="white" strokeWidth="2.5" fill="none" />
                          </svg>
                        ) : null}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

            {submitError ? (
              <div className="alert a-danger" style={{ marginTop: 12 }}>
                {submitError}
              </div>
            ) : null}

            <button
              type="button"
              className="btn btn-success"
              style={{ width: '100%', justifyContent: 'center', padding: 13, marginTop: 16, display: selectedCandidate ? 'inline-flex' : 'none' }}
              onClick={handleOpenConfirm}
            >
              <svg viewBox="0 0 24 24" aria-hidden>
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              Submit My Vote
            </button>
          </>
        )}
      </div>

      <div className={`modal-overlay${step === 'confirm' ? ' open' : ''}`} role="presentation">
        {step === 'confirm' && selectedCandidate ? (
          <div className="modal" role="dialog" aria-modal aria-labelledby="vote-confirm-title">
            <div className="modal-header">
              <div className="modal-title" id="vote-confirm-title">
                Confirm your vote
              </div>
              <button type="button" className="modal-close" aria-label="Close" onClick={() => setStep('ballot')}>
                <svg viewBox="0 0 24 24" aria-hidden>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <p style={{ fontSize: 13, color: 'var(--subtle)', lineHeight: 1.6 }}>
              You are about to cast one anonymous vote for <strong>{selectedCandidate.name}</strong>. This cannot be undone.
            </p>
            <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>Ballot closes in {formatCountdownMs(timeLeftMs)}</p>
            {submitError ? (
              <div className="alert a-danger" style={{ marginTop: 12 }}>
                {submitError}
              </div>
            ) : null}
            <div className="modal-footer">
              <button type="button" className="btn btn-ghost" onClick={() => setStep('ballot')} disabled={submitting}>
                Back
              </button>
              <button type="button" className="btn btn-success" onClick={() => void handleCastVote()} disabled={submitting}>
                {submitting ? 'Submitting…' : 'Confirm vote'}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </>
  )
}

const chipStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 5,
  background: '#F0FDF4',
  border: '1px solid #BBF7D0',
  borderRadius: 20,
  padding: '4px 12px',
  fontSize: 10,
  fontWeight: 600,
  color: '#166534',
}

const verifiedBannerStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  background: '#F0FDF4',
  border: '1px solid #BBF7D0',
  borderRadius: 10,
  padding: '10px 14px',
  marginBottom: 16,
}
