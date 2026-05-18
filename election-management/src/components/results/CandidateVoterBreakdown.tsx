import { useEffect, useMemo, useState } from 'react'
import { fetchVoteVerificationLedger } from '@/services/voteVerificationService'
import type { VoteVerificationLedger } from '@/types/voteVerification'
import type { CandidateResultRow } from '@/types/electionResults'
import {
  downloadCandidateVotersCsv,
  downloadCandidateVotersPdf,
} from '@/utils/exportCandidateVoterList'
import { maskSecretVoterIdForDisplay } from '@/utils/maskSecretVoterId'
import '@/styles/candidate-voter-breakdown.css'

export interface CandidateVoterBreakdownProps {
  electionId: string
  electionTitle: string
  show: boolean
  /** Sorted by vote count (highest first) — rank = index + 1 */
  candidates: CandidateResultRow[]
}

export function CandidateVoterBreakdown({
  electionId,
  electionTitle,
  show,
  candidates,
}: CandidateVoterBreakdownProps) {
  const [ledger, setLedger] = useState<VoteVerificationLedger | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (!show || !electionId) return
    let cancelled = false
    setLoading(true)
    setError(null)
    void fetchVoteVerificationLedger(electionId)
      .then((data) => {
        if (!cancelled) setLedger(data)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load voter lists')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [electionId, show])

  const rows = useMemo(() => {
    const maskByCandidate = new Map<string, string[]>()
    for (const row of ledger?.candidates ?? []) {
      maskByCandidate.set(
        row.candidate_id,
        row.masked_secret_ids.map((id) => maskSecretVoterIdForDisplay(id)),
      )
    }
    return candidates.map((c, index) => ({
      ...c,
      rank: index + 1,
      maskedVoterIds: maskByCandidate.get(c.candidate_id) ?? [],
    }))
  }, [candidates, ledger])

  function toggleExpanded(candidateId: string) {
    setExpanded((prev) => ({ ...prev, [candidateId]: !prev[candidateId] }))
  }

  if (!show) return null

  return (
    <div className="panel cvb-panel" style={{ marginBottom: 20 }}>
      <div className="panel-head">
        <div>
          <div className="panel-title">Candidate voter breakdown</div>
          <div className="panel-sub">
            Per-candidate masked voter IDs (last 4 characters visible). Names are never shown.
          </div>
        </div>
      </div>
      <div className="panel-body">
        {loading ? (
          <p className="cvb-muted">Loading voter lists…</p>
        ) : error ? (
          <p className="cvb-error">{error}</p>
        ) : (
          <>
            {ledger && ledger.legacy_ballots_without_mask > 0 ? (
              <p className="cvb-legacy-note">
                {ledger.legacy_ballots_without_mask} vote(s) cannot show masked IDs (cast before this feature, or
                votes split across multiple candidates). New votes will appear here automatically.
              </p>
            ) : null}
            <div className="cvb-list">
              {rows.map((row) => {
                const isOpen = Boolean(expanded[row.candidate_id])
                return (
                  <article key={row.candidate_id} className="cvb-candidate">
                    <div className="cvb-candidate-summary">
                      <div className="cvb-candidate-main">
                        <span className="cvb-rank">#{row.rank}</span>
                        <span className="cvb-name">{row.name}</span>
                        {row.designation ? (
                          <span className="cvb-designation">{row.designation}</span>
                        ) : null}
                      </div>
                      <span className="cvb-votes">
                        {row.vote_count.toLocaleString()} vote{row.vote_count === 1 ? '' : 's'}
                      </span>
                    </div>
                    <div className="cvb-actions">
                      <button
                        type="button"
                        className="cvb-toggle"
                        aria-expanded={isOpen}
                        onClick={() => toggleExpanded(row.candidate_id)}
                      >
                        View voters {isOpen ? '▲' : '▼'}
                      </button>
                      <div className="cvb-export-btns">
                        <button
                          type="button"
                          className="cvb-export-btn"
                          disabled={row.maskedVoterIds.length === 0}
                          onClick={() =>
                            downloadCandidateVotersCsv(electionTitle, row.name, row.maskedVoterIds)
                          }
                        >
                          Export CSV
                        </button>
                        <button
                          type="button"
                          className="cvb-export-btn"
                          disabled={row.maskedVoterIds.length === 0}
                          onClick={() =>
                            downloadCandidateVotersPdf(
                              electionTitle,
                              row.name,
                              row.maskedVoterIds,
                              row.vote_count,
                              row.rank,
                            )
                          }
                        >
                          Export PDF
                        </button>
                      </div>
                    </div>
                    {isOpen ? (
                      <div className="cvb-voters">
                        {row.maskedVoterIds.length === 0 ? (
                          <p className="cvb-muted">
                            {row.vote_count > 0
                              ? 'Votes are recorded but masked voter IDs are not available for this candidate (older ballot or votes on multiple candidates).'
                              : 'No votes for this candidate yet.'}
                          </p>
                        ) : (
                          <ul className="cvb-voter-ul">
                            {row.maskedVoterIds.map((masked, idx) => (
                              <li key={`${masked}-${idx}`}>
                                <code className="cvb-voter-id">{masked}</code>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ) : null}
                  </article>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

