import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { CreatorWizardShell } from '@/components/creator/CreatorWizardShell'
import { useAuth } from '@/hooks/useAuth'
import {
  addCandidate,
  createElectionDraft,
  fetchElectionById,
  publishElection,
  removeCandidate,
  updateElection,
} from '@/services/electionService'
import type { Candidate } from '@/types/election'
import { fromDatetimeLocalValue, toDatetimeLocalValue } from '@/utils/datetime'

interface CreateElectionWizardProps {
  electionId?: string
}

const ELIGIBILITY_OPTIONS = [
  { value: 'verified_voters', label: 'Verified Registered Voters Only (Default)' },
  { value: 'national_id', label: 'Any Citizen with Valid National ID' },
  { value: 'whitelist', label: 'Whitelist-Only Access (Invite Required)' },
  { value: 'public', label: 'Public Open Access (Community Poll)' },
]

export function CreateElectionWizard({ electionId: initialElectionId }: CreateElectionWizardProps) {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [step, setStep] = useState(1)
  const [electionId, setElectionId] = useState<string | undefined>(initialElectionId)
  const [loading, setLoading] = useState(Boolean(initialElectionId))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [maxVoters, setMaxVoters] = useState(1000)
  const [eligibilityRule, setEligibilityRule] = useState('verified_voters')
  const [privacyTier, setPrivacyTier] = useState('zero_knowledge')
  const [realTimeResults, setRealTimeResults] = useState(false)
  const [allowWriteIns, setAllowWriteIns] = useState(true)
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [newCandidateName, setNewCandidateName] = useState('')

  useEffect(() => {
    if (!initialElectionId) return

    async function load() {
      setLoading(true)
      try {
        const data = await fetchElectionById(initialElectionId!)
        if (!data) throw new Error('Election not found')
        if (data.status !== 'draft') throw new Error('Only draft elections can be edited')

        setElectionId(data.id)
        setTitle(data.title)
        setDescription(data.description ?? '')
        setStartDate(toDatetimeLocalValue(data.start_date))
        setEndDate(toDatetimeLocalValue(data.end_date))
        setMaxVoters(data.max_voters)
        setEligibilityRule(data.eligibility_rule)
        setPrivacyTier(data.privacy_tier)
        setRealTimeResults(data.real_time_results)
        setAllowWriteIns(data.allow_write_ins)
        setCandidates(data.candidates)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load election')
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [initialElectionId])

  function footerNav(backLabel: string, nextLabel: string, onBack: () => void, onNext: () => void) {
    return (
      <div className="flex items-center justify-between pt-4">
        <button
          type="button"
          onClick={onBack}
          disabled={step === 1 || saving}
          className="flex items-center gap-2 px-6 py-3 font-label-md text-label-md text-on-surface-variant transition-all hover:text-on-surface disabled:opacity-40"
        >
          <span className="material-symbols-outlined">arrow_back</span>
          {backLabel}
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={saving}
          className="flex items-center gap-2 rounded-full bg-primary px-10 py-4 font-bold text-on-primary shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-60"
        >
          {saving ? 'Saving…' : nextLabel}
          <span className="material-symbols-outlined">arrow_forward</span>
        </button>
      </div>
    )
  }

  async function ensureElectionId(): Promise<string> {
    if (electionId) return electionId
    if (!profile?.id) throw new Error('Not authenticated')

    const created = await createElectionDraft(profile.id, { title, description })
    setElectionId(created.id)
    return created.id
  }

  async function handleStep1Next() {
    if (!title.trim()) {
      setError('Election title is required')
      return
    }
    setError(null)
    setSaving(true)
    try {
      const id = await ensureElectionId()
      await updateElection(id, { title: title.trim(), description: description.trim() || undefined })
      setStep(2)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  async function handleStep2Next() {
    if (!startDate || !endDate) {
      setError('Start and end dates are required')
      return
    }
    if (new Date(endDate) <= new Date(startDate)) {
      setError('End date must be after start date')
      return
    }
    setError(null)
    setSaving(true)
    try {
      const id = await ensureElectionId()
      await updateElection(id, {
        start_date: fromDatetimeLocalValue(startDate),
        end_date: fromDatetimeLocalValue(endDate),
      })
      setStep(3)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  async function handleStep3Next() {
    if (maxVoters < 1) {
      setError('Max voters must be at least 1')
      return
    }
    setError(null)
    setSaving(true)
    try {
      const id = await ensureElectionId()
      await updateElection(id, {
        max_voters: maxVoters,
        eligibility_rule: eligibilityRule,
        privacy_tier: privacyTier,
        real_time_results: realTimeResults,
        allow_write_ins: allowWriteIns,
      })
      setStep(4)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  async function handleAddCandidate() {
    if (!newCandidateName.trim() || !electionId) return
    setSaving(true)
    setError(null)
    try {
      const added = await addCandidate(electionId, { name: newCandidateName.trim() })
      setCandidates((prev) => [...prev, added])
      setNewCandidateName('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add candidate')
    } finally {
      setSaving(false)
    }
  }

  async function handleRemoveCandidate(candidateId: string) {
    setSaving(true)
    setError(null)
    try {
      await removeCandidate(candidateId)
      setCandidates((prev) => prev.filter((c) => c.id !== candidateId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove candidate')
    } finally {
      setSaving(false)
    }
  }

  async function handlePublish() {
    if (!electionId) return
    setSaving(true)
    setError(null)
    try {
      await publishElection(electionId)
      navigate('/creator/dashboard', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <CreatorWizardShell currentStep={step}>
        <p className="font-body-md text-body-md text-on-surface-variant">Loading election…</p>
      </CreatorWizardShell>
    )
  }

  return (
    <CreatorWizardShell
      currentStep={step}
      footerActions={
        step === 1
          ? footerNav('Back', 'Continue to Timing', () => navigate('/creator/dashboard'), () => void handleStep1Next())
          : step === 2
            ? footerNav('Back to Identity', 'Continue to Rules', () => setStep(1), () => void handleStep2Next())
            : step === 3
              ? footerNav('Back to Timing', 'Review Configuration', () => setStep(2), () => void handleStep3Next())
              : null
      }
    >
      {error ? (
        <p className="mb-4 rounded-xl border border-error/30 bg-error-container/20 px-md py-sm font-body-sm text-body-sm text-error">
          {error}
        </p>
      ) : null}

      {step === 1 ? (
        <div className="glass-card rounded-[32px] p-6 md:p-10">
          <h2 className="mb-8 flex items-center gap-3 font-headline-md text-headline-md text-on-surface">
            <span className="material-symbols-outlined rounded-lg bg-primary/10 p-2 text-primary">badge</span>
            Election Identity Setup
          </h2>
          <div className="space-y-6">
            <div className="flex flex-col gap-2">
              <label className="ml-1 font-label-md text-label-md text-on-surface-variant" htmlFor="title">
                Election Title
              </label>
              <input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border border-outline-variant bg-surface-container-low p-4 text-on-surface outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-primary"
                placeholder="2024 Municipal Council Election"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="ml-1 font-label-md text-label-md text-on-surface-variant" htmlFor="description">
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full rounded-xl border border-outline-variant bg-surface-container-low p-4 text-on-surface outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-primary"
                placeholder="Describe the purpose and scope of this election…"
              />
            </div>
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="glass-card rounded-[32px] p-6 md:p-10">
          <h2 className="mb-8 flex items-center gap-3 font-headline-md text-headline-md text-on-surface">
            <span className="material-symbols-outlined rounded-lg bg-primary/10 p-2 text-primary">schedule</span>
            Timing &amp; Duration
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label className="ml-1 font-label-md text-label-md text-on-surface-variant" htmlFor="start">
                Start Date &amp; Time
              </label>
              <input
                id="start"
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-xl border border-outline-variant bg-surface-container-low p-4 text-on-surface outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="ml-1 font-label-md text-label-md text-on-surface-variant" htmlFor="end">
                End Date &amp; Time
              </label>
              <input
                id="end"
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-xl border border-outline-variant bg-surface-container-low p-4 text-on-surface outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="glass-card rounded-[32px] p-6 md:p-10">
          <h2 className="mb-8 flex items-center gap-3 font-headline-md text-headline-md text-on-surface">
            <span className="material-symbols-outlined rounded-lg bg-primary/10 p-2 text-primary">gavel</span>
            Election Governance &amp; Rules
          </h2>
          <div className="space-y-8">
            <div className="flex flex-col gap-2">
              <label className="ml-1 font-label-md text-label-md text-on-surface-variant" htmlFor="max-voters">
                Maximum Voters
              </label>
              <input
                id="max-voters"
                type="number"
                min={1}
                value={maxVoters}
                onChange={(e) => setMaxVoters(Number(e.target.value))}
                className="w-full rounded-xl border border-outline-variant bg-surface-container-low p-4 text-on-surface outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="ml-1 font-label-md text-label-md text-on-surface-variant">
                Voting Eligibility Rule
              </label>
              <div className="relative">
                <select
                  value={eligibilityRule}
                  onChange={(e) => setEligibilityRule(e.target.value)}
                  className="w-full cursor-pointer appearance-none rounded-xl border border-outline-variant bg-surface-container-low p-4 pr-10 text-on-surface outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-primary"
                >
                  {ELIGIBILITY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant">
                  expand_more
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label className="ml-1 font-label-md text-label-md text-on-surface-variant">Privacy Tier</label>
                <button
                  type="button"
                  onClick={() => setPrivacyTier('zero_knowledge')}
                  className={
                    privacyTier === 'zero_knowledge'
                      ? 'flex cursor-pointer flex-col gap-2 rounded-xl border-2 border-primary bg-primary/5 p-5 transition-all'
                      : 'flex cursor-pointer flex-col gap-2 rounded-xl border border-outline-variant bg-surface-container p-5 transition-all hover:bg-surface-container-high'
                  }
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={
                        privacyTier === 'zero_knowledge'
                          ? 'font-body-md font-bold text-primary'
                          : 'font-body-md font-bold text-on-surface'
                      }
                    >
                      Zero-Knowledge
                    </span>
                    {privacyTier === 'zero_knowledge' ? (
                      <span
                        className="material-symbols-outlined text-[20px] text-primary"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        verified
                      </span>
                    ) : null}
                  </div>
                  <p className="text-label-sm text-on-surface-variant">
                    Maximum anonymity via fully encrypted cryptographic proofs.
                  </p>
                </button>
              </div>
              <div className="flex flex-col gap-2">
                <label className="ml-1 font-label-md text-label-md text-on-surface-variant">&nbsp;</label>
                <button
                  type="button"
                  onClick={() => setPrivacyTier('pseudonymous')}
                  className={
                    privacyTier === 'pseudonymous'
                      ? 'flex cursor-pointer flex-col gap-2 rounded-xl border-2 border-primary bg-primary/5 p-5 transition-all'
                      : 'flex cursor-pointer flex-col gap-2 rounded-xl border border-outline-variant bg-surface-container p-5 transition-all hover:bg-surface-container-high'
                  }
                >
                  <div className="flex items-center justify-between">
                    <span className="font-body-md font-bold text-on-surface">Pseudonymous</span>
                  </div>
                  <p className="text-label-sm text-on-surface-variant">
                    Enhanced audit-trail focused with unique voter tokenization.
                  </p>
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex items-center justify-between rounded-2xl border border-white/5 bg-surface-container-low/50 p-5">
                <div className="flex gap-4">
                  <span className="material-symbols-outlined rounded-lg bg-secondary/10 p-2 text-secondary">
                    visibility_off
                  </span>
                  <div>
                    <p className="font-label-md text-label-md font-bold text-on-surface">Real-time Results</p>
                    <p className="text-[11px] text-on-surface-variant">Show tallies during voting.</p>
                  </div>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={realTimeResults}
                    onChange={(e) => setRealTimeResults(e.target.checked)}
                  />
                  <div className="peer h-6 w-11 rounded-full bg-surface-container-highest after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all peer-checked:bg-primary peer-checked:after:translate-x-full peer-focus:outline-none" />
                </label>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-white/5 bg-surface-container-low/50 p-5">
                <div className="flex gap-4">
                  <span className="material-symbols-outlined rounded-lg bg-tertiary/10 p-2 text-tertiary">history_edu</span>
                  <div>
                    <p className="font-label-md text-label-md font-bold text-on-surface">Write-ins</p>
                    <p className="text-[11px] text-on-surface-variant">Allow suggested candidates.</p>
                  </div>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={allowWriteIns}
                    onChange={(e) => setAllowWriteIns(e.target.checked)}
                  />
                  <div className="peer h-6 w-11 rounded-full bg-surface-container-highest after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all peer-checked:bg-primary peer-checked:after:translate-x-full peer-focus:outline-none" />
                </label>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {step === 4 ? (
        <>
          <div className="glass-card rounded-[32px] p-6 md:p-10">
            <h2 className="mb-8 flex items-center gap-3 font-headline-md text-headline-md text-on-surface">
              <span className="material-symbols-outlined rounded-lg bg-primary/10 p-2 text-primary">verified</span>
              Final Verification
            </h2>
            <p className="mb-6 font-body-md text-body-md text-on-surface-variant">
              Add at least two candidates, then publish your election.
            </p>
            <form
              className="mb-6 flex gap-3"
              onSubmit={(e: FormEvent) => {
                e.preventDefault()
                void handleAddCandidate()
              }}
            >
              <input
                value={newCandidateName}
                onChange={(e) => setNewCandidateName(e.target.value)}
                placeholder="Candidate name"
                className="flex-1 rounded-xl border border-outline-variant bg-surface-container-low p-4 text-on-surface outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                type="submit"
                disabled={saving || !newCandidateName.trim()}
                className="rounded-xl bg-surface-container-high px-6 font-label-md text-label-md text-on-surface transition-colors hover:bg-surface-container-highest disabled:opacity-50"
              >
                Add
              </button>
            </form>
            <ul className="space-y-3">
              {candidates.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between rounded-xl border border-white/5 bg-surface-container-low p-4"
                >
                  <span className="font-body-md text-body-md text-on-surface">{c.name}</span>
                  <button
                    type="button"
                    onClick={() => void handleRemoveCandidate(c.id)}
                    className="font-label-sm text-label-sm text-error hover:underline"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col gap-4 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => setStep(3)}
              className="flex items-center gap-2 px-6 py-3 font-label-md text-label-md text-on-surface-variant hover:text-on-surface"
            >
              <span className="material-symbols-outlined">arrow_back</span>
              Back to Rules
            </button>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => navigate('/creator/dashboard')}
                className="rounded-full border border-outline px-8 py-4 font-bold text-on-surface transition-all hover:bg-surface-variant"
              >
                Save Draft
              </button>
              <button
                type="button"
                disabled={saving || candidates.length < 2}
                onClick={() => void handlePublish()}
                className="rounded-full bg-primary px-10 py-4 font-bold text-on-primary shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
              >
                Publish Election
              </button>
            </div>
          </div>
        </>
      ) : null}
    </CreatorWizardShell>
  )
}
