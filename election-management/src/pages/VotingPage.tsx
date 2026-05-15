import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { useParams } from 'react-router-dom'
import { TopNavBar } from '@/components/layout/TopNavBar'
import { VotingBallotLayout } from '@/components/voting/VotingBallotLayout'
import { VotingBlockedView } from '@/components/voting/VotingBlockedView'
import { VotingSuccessView } from '@/components/voting/VotingSuccessView'
import { useAuth } from '@/hooks/useAuth'
import { fetchElectionById } from '@/services/electionService'
import { fetchUserRegistrationForElection } from '@/services/voterRegistrationService'
import {
  buildVotingEligibility,
  castAnonymousVote,
  clearVerifiedSession,
  getVerifiedSession,
  setVerifiedSession,
  verifySecretVoterForVoting,
} from '@/services/votingService'
import type { Candidate, ElectionWithCandidates } from '@/types/election'
import { isPollingEnded, isPollingOpen } from '@/utils/electionPolling'
import { maskSecretVoterId } from '@/utils/maskSecretVoterId'

type VotingStep = 'loading' | 'blocked' | 'verify' | 'ballot' | 'success'

export function VotingPage() {
  const { id: electionId } = useParams<{ id: string }>()
  const { session } = useAuth()

  const [election, setElection] = useState<ElectionWithCandidates | null>(null)
  const [step, setStep] = useState<VotingStep>('loading')
  const [blockMessage, setBlockMessage] = useState<string | null>(null)

  const [secretInput, setSecretInput] = useState('')
  const [secretVoterId, setSecretVoterId] = useState<string | null>(null)
  const [maskedId, setMaskedId] = useState<string | null>(null)
  const [verifyError, setVerifyError] = useState<string | null>(null)
  const [verifying, setVerifying] = useState(false)

  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [receiptHash, setReceiptHash] = useState<string | null>(null)

  const [timeLeftMs, setTimeLeftMs] = useState(0)
  const [sessionLeftMs, setSessionLeftMs] = useState(0)

  const loadData = useCallback(async () => {
    if (!electionId || !session?.user.id) return

    const [electionData, reg] = await Promise.all([
      fetchElectionById(electionId),
      fetchUserRegistrationForElection(electionId, session.user.id),
    ])

    setElection(electionData)

    if (!electionData) {
      setBlockMessage('Election not found.')
      setStep('blocked')
      return
    }

    const eligibility = buildVotingEligibility(electionData, reg)

    if (reg?.voted_at) {
      setStep('blocked')
      setBlockMessage('You have already cast your vote in this election.')
      return
    }

    if (!isPollingOpen(electionData) || isPollingEnded(electionData)) {
      setStep('blocked')
      setBlockMessage(eligibility.reason ?? 'Voting is closed for this election.')
      return
    }

    if (!eligibility.canVote) {
      setStep('blocked')
      setBlockMessage(eligibility.reason ?? 'You are not eligible to vote.')
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
    if (!election) return

    const endDate = election.end_date

    function tick() {
      const remaining = new Date(endDate).getTime() - Date.now()
      setTimeLeftMs(remaining)

      if (remaining <= 0 && (step === 'ballot' || step === 'verify')) {
        if (electionId) clearVerifiedSession(electionId)
        setSecretVoterId(null)
        setStep('blocked')
        setBlockMessage('Voting period has ended. The ballot is now locked.')
      }
    }

    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [election, electionId, step])

  useEffect(() => {
    if (!electionId || step !== 'ballot') return
    const sessionElectionId: string = electionId

    function tickSession() {
      const verified = getVerifiedSession(sessionElectionId)
      if (verified) {
        setSessionLeftMs(verified.expiresAt - Date.now())
      } else {
        setStep('verify')
        setSecretVoterId(null)
        setMaskedId(null)
      }
    }

    tickSession()
    const id = window.setInterval(tickSession, 1000)
    return () => window.clearInterval(id)
  }, [electionId, step])

  async function handleVerify(e: FormEvent) {
    e.preventDefault()
    if (!electionId || !election) return

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
      setVerifiedSession(electionId, masked)
      setStep('ballot')
    } catch (err) {
      setVerifyError(err instanceof Error ? err.message : 'Verification failed')
    } finally {
      setVerifying(false)
    }
  }

  async function handleCastVote() {
    if (!electionId || !selectedCandidate || !secretVoterId) return

    setSubmitting(true)
    setSubmitError(null)

    try {
      const result = await castAnonymousVote(electionId, secretVoterId, selectedCandidate.id)
      clearVerifiedSession(electionId)
      setSecretVoterId(null)
      setReceiptHash(result.receipt_hash ?? null)
      setShowConfirm(false)
      setStep('success')
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to submit vote')
    } finally {
      setSubmitting(false)
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
    return <VotingBlockedView message={blockMessage} electionId={electionId} />
  }

  if (step === 'success') {
    return <VotingSuccessView receiptHash={receiptHash} />
  }

  if (!election || !electionId) return null

  return (
    <VotingBallotLayout
      election={election}
      electionId={electionId}
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
      showConfirm={showConfirm}
      onCloseConfirm={() => setShowConfirm(false)}
      onOpenConfirm={() => setShowConfirm(true)}
      submitting={submitting}
      submitError={submitError}
      onCastVote={() => void handleCastVote()}
    />
  )
}
