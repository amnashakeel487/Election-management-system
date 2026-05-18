import { useCallback, useEffect, useState } from 'react'
import { fetchVoteVerificationLedger } from '@/services/voteVerificationService'
import type { VoteVerificationLedger as LedgerData } from '@/types/voteVerification'
import { maskSecretVoterIdHalf } from '@/utils/maskSecretVoterId'
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
  const [lookupMask, setLookupMask] = useState<string | null>(null)
  const [lookupError, setLookupError] = useState<string | null>(null)

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

  const handleLookup = useCallback(() => {
    const trimmed = secretInput.trim()
    if (!trimmed) {
      setLookupError('Enter your secret voter ID')
      return
    }
    setLookupError(null)
    setLookupMask(maskSecretVoterIdHalf(trimmed))
  }, [secretInput])

  if (!show) return null

  return (
    <div className="panel vv-ledger-panel" style={{ marginBottom: 20 }}>
      <div className="panel-head">
        <div>
          <div className="panel-title">Vote verification</div>
          <div className="panel-sub">
            Each candidate lists masked secret voter IDs (half hidden). Enter your full ID to highlight yours — no
            names are shown.
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
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleLookup()
              }}
            />
            <button type="button" className="vv-lookup-btn" onClick={handleLookup}>
              Find my vote
            </button>
          </div>
          {lookupError ? <p className="vv-lookup-error">{lookupError}</p> : null}
          {lookupMask ? (
            <p className="vv-lookup-hint">
              Your masked ID: <code className="vv-hash-code">{lookupMask}</code>
              <span className="vv-lookup-hint-sub"> — look for this under the candidate you voted for.</span>
            </p>
          ) : null}
        </div>

        {loading ? (
          <p className="vv-muted">Loading verification list…</p>
        ) : error ? (
          <p className="vv-error">{error}</p>
        ) : !ledger || ledger.candidates.length === 0 ? (
          <p className="vv-muted">No votes recorded yet.</p>
        ) : (
          <>
            {ledger.legacy_ballots_without_mask > 0 ? (
              <p className="vv-legacy-note">
                {ledger.legacy_ballots_without_mask} vote(s) were cast before masked IDs were recorded and are not
                listed here. New votes will appear in the table below.
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
                  {row.masked_secret_ids.length === 0 ? (
                    <p className="vv-muted vv-empty">
                      {row.vote_count > 0
                        ? 'Votes for this candidate are not listed (cast before verification was enabled).'
                        : 'No votes yet for this candidate.'}
                    </p>
                  ) : (
                    <div className="vv-table-wrap">
                      <table className="vv-table">
                        <thead>
                          <tr>
                            <th scope="col">#</th>
                            <th scope="col">Masked secret voter ID</th>
                          </tr>
                        </thead>
                        <tbody>
                          {row.masked_secret_ids.map((masked, idx) => {
                            const isMatch = lookupMask != null && masked === lookupMask
                            return (
                              <tr key={`${masked}-${idx}`} className={isMatch ? 'vv-row--match' : undefined}>
                                <td>{idx + 1}</td>
                                <td>
                                  <code className="vv-hash-code">{masked}</code>
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
