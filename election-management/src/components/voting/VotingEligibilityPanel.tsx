import { Link } from 'react-router-dom'
import type { ElectionWithCandidates } from '@/types/election'
import type { VoterRegistration } from '@/types/voterRegistration'
import { formatCountdownMs } from '@/utils/electionPolling'
import { buildVotingEligibilityDetail } from '@/utils/votingEligibility'

interface VotingEligibilityPanelProps {
  election: ElectionWithCandidates
  registration: VoterRegistration | null
  sessionUserId: string | undefined
}

export function VotingEligibilityPanel({ election, registration, sessionUserId }: VotingEligibilityPanelProps) {
  const detail = buildVotingEligibilityDetail(election, registration, sessionUserId)

  return (
    <div className="ed-panel">
      <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500">Voting eligibility</h3>
      <ul className="mb-4 space-y-2">
        {detail.checks.map((check) => (
          <li key={check.id} className="flex items-start gap-2 text-xs">
            <span
              className={`material-symbols-outlined text-[16px] ${check.passed ? 'text-emerald-600' : 'text-slate-300'}`}
            >
              {check.passed ? 'check_circle' : 'radio_button_unchecked'}
            </span>
            <span className={check.passed ? 'text-slate-700' : 'text-slate-500'}>
              {check.label}
              {check.detail ? <span className="mt-0.5 block text-[10px] text-slate-400">{check.detail}</span> : null}
            </span>
          </li>
        ))}
      </ul>
      {detail.phase === 'not_started' && detail.opensInMs > 0 ? (
        <p className="mb-3 text-xs text-slate-500">
          Voting opens in <span className="font-mono font-semibold text-[#2451A3]">{formatCountdownMs(detail.opensInMs)}</span>
        </p>
      ) : null}
      {detail.pollingOpen && detail.closesInMs > 0 ? (
        <p className="mb-3 text-xs text-slate-500">
          Ballot closes in <span className="font-mono font-semibold text-red-600">{formatCountdownMs(detail.closesInMs)}</span>
        </p>
      ) : null}
      {detail.canVote ? (
        <Link
          to={`/elections/${election.id}/vote`}
          className="block w-full rounded-xl bg-gradient-to-br from-[#1B3A6B] to-[#6C3FC5] py-2.5 text-center text-sm font-bold text-white no-underline"
        >
          Open secure ballot
        </Link>
      ) : (
        <p className="text-xs text-slate-500">{detail.blockReason}</p>
      )}
    </div>
  )
}
