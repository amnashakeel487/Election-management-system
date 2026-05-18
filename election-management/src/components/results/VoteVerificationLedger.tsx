import { useCallback, useEffect, useState } from 'react'
import { computeVoteProofHash, fetchVoteVerificationLedger } from '@/services/voteVerificationService'
import type { VoteVerificationLedger as LedgerData } from '@/types/voteVerification'
import { formatProofHashDisplay } from '@/utils/voteProofHash'
import '@/styles/vote-verification-ledger.css'

export interface VoteVerificationLedgerProps {
  electionId: string
  show: boolean
}

export function VoteVerificationLedger({ electionId, show }: VoteVerificationLedgerProps) {
  const [ledger, setLedger] = useState<LedgerData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [secretInput, setSecretInput] = useState('')
  const [lookupHash, setLookupHash] = useState<string | null>(null)
  const [lookupError, setLookupError] = useState<string | null>(null)
  const [lookingUp, setLookingUp] = useState(false)

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
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load verification ledger')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [electionId, show])

  const handleLookup = useCallback(async () => {
    const trimmed = secretInput.trim()
    if (!trimmed) {
      setLookupError('Enter your secret voter ID')
      return
    }
    setLookingUp(true)
    setLookupError(null)
    try {
      const hash = await computeVoteProofHash(electionId, trimmed)
      setLookupHash(hash.toLowerCase())
    } catch (err) {
      setLookupHash(null)
      setLookupError(err instanceof Error ? err.message : 'Could not compute verification hash')
    } finally {
      setLookingUp(false)
    }
  }, [electionId, secretInput])

  if (!show) return null

  return (
    <div className="panel vv-ledger-panel" style={{ marginBottom: 20 }}>
      <div className="panel-head">
        <div>
          <div className="panel-title">Vote verification ledger</div>
          <div className="panel-sub">
            Hashed secret voter IDs per candidate — no names. Find your hash to confirm your vote.
          </div>
        </div>
      </div>
      <div className="panel-body">
        <div className="vv-lookup">
          <label className="vv-lookup-label" htmlFor="vv-secret-lookup">
            Check your vote
          </label>
          <div className="vv-lookup-row">
            <input
              id="vv-secret-lookup"
              type="password"
              autoComplete="off"
              className="vv-lookup-input"
              placeholder="Enter your secret voter ID"
              value={secretInput}
              onChange={(e) => setSecretInput(e.target.value)}
            />
            <button type="button" className="vv-lookup-btn" disabled={lookingUp} onClick={() => void handleLookup()}>
              {lookingUp ? '…' : 'Find my vote'}
            </button>
          </div>
          {lookupError ? <p className="vv-lookup-error">{lookupError}</p> : null}
          {lookupHash ? (
            <p className="vv-lookup-hint">
              Your verification hash: <code className="vv-hash-code">{formatProofHashDisplay(lookupHash)}</code>
              <span className="vv-lookup-hint-sub"> — highlighted below under the candidate you chose.</span>
            </p>
          ) : null}
        </div>

        {loading ? (
          <p className="vv-muted">Loading verification ledger…</p>
        ) : error ? (
          <p className="vv-error">{error}</p>
        ) : !ledger || ledger.candidates.length === 0 ? (
          <p className="vv-muted">No votes recorded yet.</p>
        ) : (
          <>
            {ledger.legacy_ballots_without_hash > 0 ? (
              <p className="vv-legacy-note">
                {ledger.legacy_ballots_without_hash} older ballot(s) were cast before verification hashes were
                enabled and are not listed here.
              </p>
            ) : null}
            <div className="vv-tables">
              {ledger.candidates.map((row) => (
                <div key={row.candidate_id} className="vv-candidate-block">
                  <div className="vv-candidate-head">
                    <div>
                      <div className="vv-candidate-name">{row.candidate_name}</div>
                      {row.designation ? <div className="vv-candidate-designation">{row.designation}</div> : null}
                    </div>
                    <div className="vv-vote-count">
                      {row.vote_count.toLocaleString()} vote{row.vote_count === 1 ? '' : 's'}
                    </div>
                  </div>
                  {row.proof_hashes.length === 0 ? (
                    <p className="vv-muted vv-empty">No verification hashes for this candidate.</p>
                  ) : (
                    <div className="vv-table-wrap">
                      <table className="vv-table">
                        <thead>
                          <tr>
                            <th scope="col">#</th>
                            <th scope="col">Hashed secret voter ID</th>
                          </tr>
                        </thead>
                        <tbody>
                          {row.proof_hashes.map((hash, idx) => {
                            const isMatch =
                              lookupHash != null && hash.toLowerCase() === lookupHash.toLowerCase()
                            return (
                              <tr key={`${hash}-${idx}`} className={isMatch ? 'vv-row--match' : undefined}>
                                <td>{idx + 1}</td>
                                <td>
                                  <code className="vv-hash-code" title={hash}>
                                    {formatProofHashDisplay(hash)}
                                  </code>
                                  {isMatch ? <span className="vv-match-badge">Your vote</span> : null}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

