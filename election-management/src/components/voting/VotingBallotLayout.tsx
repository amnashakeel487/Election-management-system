import { type FormEvent } from 'react'
import { Footer } from '@/components/layout/Footer'
import { TopNavBar } from '@/components/layout/TopNavBar'
import { VOTING_CANDIDATE_IMAGES } from '@/constants/votingAssets'
import type { Candidate, ElectionWithCandidates } from '@/types/election'
import { formatElectionCode } from '@/utils/electionTime'
import { formatCountdownMs } from '@/utils/electionPolling'
import { ConfirmVoteModal } from './ConfirmVoteModal'

interface VotingBallotLayoutProps {
  election: ElectionWithCandidates
  electionId: string
  step: 'verify' | 'ballot'
  secretInput: string
  onSecretInputChange: (value: string) => void
  verifyError: string | null
  verifying: boolean
  onVerify: (e: FormEvent) => void
  maskedId: string | null
  onChangeId: () => void
  timeLeftMs: number
  sessionLeftMs: number
  selectedCandidate: Candidate | null
  onSelectCandidate: (candidate: Candidate) => void
  showConfirm: boolean
  onCloseConfirm: () => void
  onOpenConfirm: () => void
  submitting: boolean
  submitError: string | null
  onCastVote: () => void
}

export function VotingBallotLayout({
  election,
  electionId,
  step,
  secretInput,
  onSecretInputChange,
  verifyError,
  verifying,
  onVerify,
  maskedId,
  onChangeId,
  timeLeftMs,
  sessionLeftMs,
  selectedCandidate,
  onSelectCandidate,
  showConfirm,
  onCloseConfirm,
  onOpenConfirm,
  submitting,
  submitError,
  onCastVote,
}: VotingBallotLayoutProps) {
  const ballotCode = formatElectionCode(election.id)

  return (
    <div className="min-h-screen bg-background font-body-md text-on-background">
      <TopNavBar />
      <main className="mx-auto max-w-7xl px-margin pb-16 pt-24">
        <header className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 font-label-sm text-label-sm text-primary">
              <span className="material-symbols-outlined text-[14px]">verified</span>
              OFFICIAL BALLOT {ballotCode}
            </span>
            <h1 className="mb-2 font-headline-xl text-headline-xl text-on-surface">{election.title}</h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant">
              Electronic Voting System • Secure Connection Established
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-surface-container-high px-4 py-2">
              <div className="relative flex h-3 w-3 items-center justify-center">
                <div className="absolute h-3 w-3 animate-pulse rounded-full bg-tertiary" />
                <div className="h-3 w-3 rounded-full bg-tertiary" />
              </div>
              <span className="font-label-md text-label-md uppercase tracking-wider text-tertiary">
                Securely Encrypted
              </span>
            </div>
            <div className="rounded-xl border border-error/20 bg-error-container/10 px-4 py-2 text-center">
              <span className="font-label-sm text-label-sm text-on-surface-variant">Closes in </span>
              <span className="font-label-md text-label-md tabular-nums text-error">
                {formatCountdownMs(timeLeftMs)}
              </span>
            </div>
          </div>
        </header>

        {step === 'verify' ? (
          <section className="mb-12">
            <div className="glass-panel max-w-2xl rounded-[32px] p-8">
              <div className="mb-6 flex items-start gap-4">
                <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                  <span className="material-symbols-outlined text-[28px]">fingerprint</span>
                </div>
                <div>
                  <h2 className="font-headline-md text-headline-md text-on-surface">Identity Verification</h2>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Enter your Secret Voter ID (e.g. POLL-A-0001) to unlock the ballot.
                  </p>
                </div>
              </div>
              <form onSubmit={onVerify} className="space-y-4">
                <label className="ml-1 block font-label-md text-label-md text-on-surface-variant">
                  Secret Voter ID
                </label>
                <input
                  type="password"
                  value={secretInput}
                  onChange={(e) => onSecretInputChange(e.target.value)}
                  placeholder="POLL-A-0001"
                  className="voter-id-input w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3 font-body-md text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  autoComplete="off"
                />
                {verifyError ? (
                  <p className="rounded-lg border border-error/20 bg-error-container/20 px-4 py-3 font-body-sm text-error">
                    {verifyError}
                  </p>
                ) : null}
                <button
                  type="submit"
                  disabled={verifying || !secretInput.trim()}
                  className="w-full rounded-xl bg-primary py-4 font-headline-md text-headline-md text-on-primary disabled:opacity-60"
                >
                  {verifying ? 'Verifying…' : 'Authorize and Continue'}
                </button>
              </form>
            </div>
          </section>
        ) : (
          <>
            <section className="mb-12">
              <div className="glass-panel max-w-2xl rounded-[32px] p-8">
                <div className="mb-6 flex items-start gap-4">
                  <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                    <span className="material-symbols-outlined text-[28px]">fingerprint</span>
                  </div>
                  <div>
                    <h2 className="font-headline-md text-headline-md text-on-surface">Identity Verification</h2>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Verified. Session expires in {formatCountdownMs(sessionLeftMs)}.
                    </p>
                  </div>
                </div>
                <label className="ml-1 block font-label-md text-label-md text-on-surface-variant">
                  Voter Identification Number
                </label>
                <div className="relative mb-4">
                  <input
                    type="password"
                    readOnly
                    value={maskedId ?? '****'}
                    className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3 font-body-md text-on-surface"
                  />
                  <button
                    type="button"
                    onClick={onChangeId}
                    className="absolute right-4 top-1/2 -translate-y-1/2 font-label-sm text-label-sm text-primary hover:underline"
                  >
                    Change ID
                  </button>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/10 px-4 py-3">
                  <span className="material-symbols-outlined text-[20px] text-primary">info</span>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Identity verified. Your ballot is unlocked.
                  </p>
                </div>
              </div>
            </section>

            <div className="mb-8 flex items-center gap-4 rounded-2xl border border-white/5 bg-surface-container-low p-4">
              <span className="material-symbols-outlined text-tertiary">visibility_off</span>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                <strong className="text-on-surface">Anonymous Voting Notice:</strong> Your vote is stored without
                linking your identity to your candidate choice.
              </p>
            </div>

            <section className="mb-12">
              <h3 className="mb-8 font-headline-md text-headline-md text-on-surface">Select Your Representative</h3>
              <div className="grid grid-cols-1 gap-gutter md:grid-cols-2 lg:grid-cols-3">
                {election.candidates.map((candidate, index) => {
                  const selected = selectedCandidate?.id === candidate.id
                  return (
                    <div
                      key={candidate.id}
                      className={
                        selected
                          ? 'relative overflow-hidden rounded-[24px] border-2 border-primary bg-surface-container shadow-2xl shadow-primary/10'
                          : 'group relative cursor-pointer overflow-hidden rounded-[24px] border border-white/10 bg-surface-container transition-all selection-glow hover:border-primary/50'
                      }
                    >
                      {selected ? (
                        <div className="absolute right-4 top-4 z-10 rounded-full bg-primary p-2 text-on-primary shadow-lg">
                          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                            check_circle
                          </span>
                        </div>
                      ) : null}
                      <div className="aspect-square w-full overflow-hidden">
                        <img
                          src={VOTING_CANDIDATE_IMAGES[index % VOTING_CANDIDATE_IMAGES.length]}
                          alt=""
                          className={`h-full w-full object-cover ${selected ? '' : 'grayscale group-hover:grayscale-0'} transition-all duration-500`}
                        />
                      </div>
                      <div className="p-6">
                        <h4 className="mb-2 font-headline-md text-headline-md text-on-surface">{candidate.name}</h4>
                        <p className="mb-6 line-clamp-2 font-body-sm text-body-sm text-on-surface-variant">
                          {candidate.description ?? 'No platform summary provided.'}
                        </p>
                        {selected ? (
                          <button
                            type="button"
                            onClick={onOpenConfirm}
                            className="w-full rounded-xl bg-primary py-3 text-center font-label-md text-label-md text-on-primary"
                          >
                            Confirm Selection
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onSelectCandidate(candidate)}
                            className="w-full rounded-xl border border-primary py-3 font-label-md text-label-md text-primary transition-all hover:bg-primary hover:text-on-primary"
                          >
                            Select Candidate
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>

            <section className="flex flex-col items-center border-t border-white/5 py-12">
              <p className="mb-6 max-w-md text-center font-body-md text-body-md text-on-surface-variant">
                Once confirmed, your vote will be encrypted and submitted. This action cannot be reversed.
              </p>
              <button
                type="button"
                disabled={!selectedCandidate}
                onClick={onOpenConfirm}
                className="rounded-2xl bg-primary px-12 py-5 font-headline-md text-headline-md font-bold text-on-primary shadow-[0_0_40px_rgba(173,198,255,0.3)] transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
              >
                Submit Secure Ballot
              </button>
            </section>
          </>
        )}
      </main>
      <Footer />

      {selectedCandidate ? (
        <ConfirmVoteModal
          open={showConfirm}
          electionId={electionId}
          candidate={selectedCandidate}
          maskedId={maskedId}
          submitting={submitting}
          error={submitError}
          onClose={onCloseConfirm}
          onConfirm={onCastVote}
        />
      ) : null}
    </div>
  )
}
