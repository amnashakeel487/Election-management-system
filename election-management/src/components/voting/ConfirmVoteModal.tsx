import { VOTING_CANDIDATE_IMAGES } from '@/constants/votingAssets'
import type { Candidate } from '@/types/election'
import { candidatePortraitOrPlaceholder } from '@/utils/candidateDisplay'
import { formatElectionCode } from '@/utils/electionTime'

interface ConfirmVoteModalProps {
  open: boolean
  electionId: string
  candidate: Candidate
  maskedId: string | null
  submitting: boolean
  error: string | null
  onClose: () => void
  onConfirm: () => void
}

export function ConfirmVoteModal({
  open,
  electionId,
  candidate,
  maskedId,
  submitting,
  error,
  onClose,
  onConfirm,
}: ConfirmVoteModalProps) {
  if (!open) return null

  const wrapper = 'fixed inset-0 z-[100] flex items-center justify-center bg-surface-container-lowest/80 p-6 backdrop-blur-sm'

  return (
    <div className={wrapper}>
      <div className="glass-panel w-full max-w-lg rounded-[32px] p-8 shadow-2xl">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="font-headline-lg text-headline-lg text-on-surface">Confirm Your Vote</h2>
          <button type="button" onClick={onClose} className="rounded-full p-2 hover:bg-surface-container-highest">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="mb-8 rounded-2xl border border-primary/20 bg-surface-container-high p-6">
          <p className="mb-2 font-label-md text-label-md uppercase tracking-widest text-primary">Selected Candidate</p>
          <div className="flex items-center gap-4">
            <img
              src={candidatePortraitOrPlaceholder(candidate, VOTING_CANDIDATE_IMAGES)}
              alt=""
              className="h-12 w-12 rounded-full object-cover"
            />
            <div>
              <h4 className="font-headline-md text-headline-md text-on-surface">{candidate.name}</h4>
              <p className="font-label-sm text-label-sm text-primary">
                {candidate.designation?.trim() || 'Nominee'}
              </p>
              <p className="font-body-sm text-body-sm text-on-surface-variant">{candidate.description ?? 'Official candidate'}</p>
            </div>
          </div>
        </div>
        <div className="mb-8 space-y-4">
          <div className="flex justify-between font-body-sm text-body-sm text-on-surface-variant">
            <span>Election ID:</span>
            <span className="font-mono text-on-surface">{formatElectionCode(electionId)}</span>
          </div>
          <div className="flex justify-between font-body-sm text-body-sm text-on-surface-variant">
            <span>Voter ID:</span>
            <span className="font-mono text-on-surface">{maskedId ?? '****'}</span>
          </div>
          <div className="flex justify-between font-body-sm text-body-sm text-on-surface-variant">
            <span>Encryption Protocol:</span>
            <span className="text-tertiary">AES-256-GCM / RSA-4096</span>
          </div>
        </div>
        {error ? <p className="mb-4 text-body-sm text-error">{error}</p> : null}
        <div className="flex flex-col gap-3">
          <button
            type="button"
            disabled={submitting}
            onClick={onConfirm}
            className="w-full rounded-xl bg-primary py-4 font-bold text-label-md text-on-primary shadow-lg disabled:opacity-60"
          >
            {submitting ? 'Encrypting…' : 'Confirm and Encrypt Vote'}
          </button>
          <button type="button" onClick={onClose} className="w-full rounded-xl py-4 font-bold text-label-md text-on-surface-variant hover:bg-surface-container-highest">
            Return to Selection
          </button>
        </div>
        <p className="mt-6 text-center text-label-sm text-on-surface-variant/60">
          By confirming, you digitally sign this ballot with your private key.
        </p>
      </div>
    </div>
  )
}
