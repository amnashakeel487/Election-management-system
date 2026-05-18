import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { useParams } from 'react-router-dom'
import { TopNavBar } from '@/components/layout/TopNavBar'
import { VotingBallotLayout } from '@/components/voting/VotingBallotLayout'
import { VotingBlockedView } from '@/components/voting/VotingBlockedView'
import { VotingConfirmView } from '@/components/voting/VotingConfirmView'
import { VotingSuccessView } from '@/components/voting/VotingSuccessView'
import { useAuth } from '@/hooks/useAuth'
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
import { isPollingOpen } from '@/utils/electionPolling'
import { maskSecretVoterId } from '@/utils/maskSecretVoterId'
import { buildVotingEligibilityDetail, validateSecretIdInput } from '@/utils/votingEligibility'

type VotingStep = 'loading' | 'blocked' | 'verify' | 'ballot' | 'confirm' | 'success'

export function VotingPage() {
  const { id: electionId } = useParams<{ id: string }>()
  const { session } = useAuth()
  const castInFlight = useRef(false)

  const [election, setElection] = useState<ElectionWithCandidates | null>(null)
  const [step, setStep] = useState<VotingStep>('loading')
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
  const [receiptHash, setReceiptHash] = useState<string | null>(null)
  const [verificationHash, setVerificationHash] = useState<string | null>(null)

  const [timeLeftMs, setTimeLeftMs] = useState(0)
  const [sessionLeftMs, setSessionLeftMs] = useState(0)

  const loadData = useCallback(async () => {
    if (!electionId || !session?.user.id) return

    let electionData = await fetchElectionById(electionId)

    const votingStarted =
      electionData && new Date(electionData.start_date).getTime() <= Date.now()

    if (votingStarted) {
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
      setSecretVoterId(null)
      setReceiptHash(result.receipt_hash ?? null)
      setVerificationHash(result.verification_hash ?? null)
      setStep('success')
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
      <div className="min-h-screen bg-background text-on-background">
        <TopNavBar />
        <main className="flex min-h-screen items-center justify-center pt-16">
          <p className="font-body-md text-body-md text-on-surface-variant">Loading secure ballot…</p>
        </main>
      </div>
    )
  }

  if (step === 'blocked') {
    return (
      <VotingBlockedView message={blockMessage} electionId={electionId} opensInMs={blockOpensInMs} />
    )
  }

  if (step === 'success') {
    return (
      <VotingSuccessView
        receiptHash={receiptHash}
        verificationHash={verificationHash}
        electionId={electionId}
      />
    )
  }

  if (!election || !electionId) return null

  if (step === 'confirm' && selectedCandidate) {
    return (
      <VotingConfirmView
        election={election}
        electionId={electionId}
        candidate={selectedCandidate}
        maskedId={maskedId}
        timeLeftMs={timeLeftMs}
        submitting={submitting}
        error={submitError}
        onBack={() => {
          setSubmitError(null)
          setStep('ballot')
        }}
        onConfirm={() => void handleCastVote()}
      />
    )
  }

  return (
    <VotingBallotLayout
      election={election}
      step={step === 'ballot' ? 'ballot' : 'verify'}
      secretInput={secretInput}
      onSecretInputChange={setSecretInput}
      verifyError={verifyError}
      verifying={verifying}
      onVerify={(e) => void handleVerify(e)}
      maskedId={maskedId}
      onChangeId={handleChangeId}
      timeLeftMs={timeLeftMs}
      sessionLeftMs={sessionLeftMs}
      selectedCandidate={selectedCandidate}
      onSelectCandidate={setSelectedCandidate}
      submitting={submitting}
      submitError={submitError}
      onOpenConfirm={handleOpenConfirm}
    />
  )
}
