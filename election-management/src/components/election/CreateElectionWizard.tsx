import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CreatorWizardShell } from '@/components/creator/CreatorWizardShell'
import { ELECTION_CATEGORY_OPTIONS } from '@/constants/electionWizard'
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
import { fromDatetimeLocalValue, isoFromDatetimeLocal, toDatetimeLocalValue } from '@/utils/datetime'
import { formatSubmissionDate } from '@/utils/formatDate'

interface CreateElectionWizardProps {
  electionId?: string
}

const CATEGORY_CUSTOM = '__custom__'

const ELIGIBILITY_OPTIONS = [
  { value: 'verified_voters', label: 'Verified Registered Voters Only (Default)' },
  { value: 'national_id', label: 'Any Citizen with Valid National ID' },
  { value: 'whitelist', label: 'Whitelist-Only Access (Invite Required)' },
  { value: 'public', label: 'Public Open Access (Community Poll)' },
]

function persistedCategory(slug: string, customDetail: string): string {
  if (slug === CATEGORY_CUSTOM) return customDetail.trim()
  return slug
}

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
  const [categorySlug, setCategorySlug] = useState<string>(ELECTION_CATEGORY_OPTIONS[1].value)
  const [categoryCustom, setCategoryCustom] = useState('')

  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [registrationDeadline, setRegistrationDeadline] = useState('')

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

        const cat = data.category?.trim()
        if (cat && ELECTION_CATEGORY_OPTIONS.some((o) => o.value === cat)) {
          setCategorySlug(cat)
          setCategoryCustom('')
        } else if (cat) {
          setCategorySlug(CATEGORY_CUSTOM)
          setCategoryCustom(cat)
        }

        setStartDate(toDatetimeLocalValue(data.start_date))
        setEndDate(toDatetimeLocalValue(data.end_date))
        setRegistrationDeadline(
          data.registration_deadline ? toDatetimeLocalValue(data.registration_deadline) : '',
        )

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

    const category = persistedCategory(categorySlug, categoryCustom)

    const created = await createElectionDraft(profile.id, {
      title: title.trim(),
      description: description.trim(),
      category: category || undefined,
    })
    setElectionId(created.id)
    return created.id
  }

  async function handleStep1Next() {
    if (!title.trim()) {
      setError('Election title is required')
      return
    }
    if (categorySlug === CATEGORY_CUSTOM && !categoryCustom.trim()) {
      setError('Enter a category name when using Custom.')
      return
    }

    setError(null)
    setSaving(true)
    try {
      const id = await ensureElectionId()
      await updateElection(id, {
        title: title.trim(),
        description: description.trim() || undefined,
        category: persistedCategory(categorySlug, categoryCustom),
      })
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
    const startMs = new Date(fromDatetimeLocalValue(startDate)).getTime()
    const endMs = new Date(fromDatetimeLocalValue(endDate)).getTime()
    if (endMs <= startMs) {
      setError('End date must be after start date')
      return
    }
    if (registrationDeadline.trim()) {
      const regMs = new Date(fromDatetimeLocalValue(registrationDeadline.trim())).getTime()
      if (regMs > startMs) {
        setError('Registration deadline must be on or before voting start.')
        return
      }
      if (regMs >= endMs) {
        setError('Registration deadline must be before voting ends.')
        return
      }
    }

    setError(null)
    setSaving(true)
    try {
      const id = await ensureElectionId()
      await updateElection(id, {
        start_date: fromDatetimeLocalValue(startDate),
        end_date: fromDatetimeLocalValue(endDate),
        registration_deadline: registrationDeadline.trim()
          ? fromDatetimeLocalValue(registrationDeadline.trim())
          : null,
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
      <CreatorWizardShell currentStep={step} headline={initialElectionId ? 'Edit draft election' : undefined}>
        <p className="font-body-md text-body-md text-on-surface-variant">Loading election…</p>
      </CreatorWizardShell>
    )
  }

  const categoryLabel =
    categorySlug === CATEGORY_CUSTOM
      ? categoryCustom.trim() || '(Custom)'
      : (ELECTION_CATEGORY_OPTIONS.find((o) => o.value === categorySlug)?.label ?? categorySlug)

  const regDeadlineIso = isoFromDatetimeLocal(registrationDeadline)
  const startIsoForSummary = isoFromDatetimeLocal(startDate)
  const registrationSummary = regDeadlineIso
    ? formatSubmissionDate(regDeadlineIso)
    : startIsoForSummary
      ? `Same as voting start (${formatSubmissionDate(startIsoForSummary)})`
      : 'Same as voting start (set in step 2)'

  const shellHeadline = initialElectionId ? 'Edit draft election' : undefined
  const shellSub = initialElectionId
    ? 'Edits save as you continue each step. Drafts stay private until you publish.'
    : undefined

  return (
    <CreatorWizardShell
      currentStep={step}
      headline={shellHeadline}
      subhead={shellSub}
      footerActions={
        step === 1
          ? footerNav('Back', 'Continue to Timing', () => navigate('/creator/dashboard'), () => void handleStep1Next())
          : step === 2
            ? footerNav('Back to Identity', 'Continue to Rules', () => setStep(1), () => void handleStep2Next())
            : step === 3
              ? footerNav('Back to Timing', 'Candidates & Publish', () => setStep(2), () => void handleStep3Next())
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
            Poll identity
          </h2>
          <div className="space-y-6">
            <div className="flex flex-col gap-2">
              <label className="ml-1 font-label-md text-label-md text-on-surface-variant" htmlFor="title">
                Election title
              </label>
              <input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border border-outline-variant bg-surface-container-low p-4 text-on-surface outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-primary"
                placeholder="e.g. 2026 Student Senate Election"
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
                placeholder="Purpose, eligibility context, and what this vote decides…"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="ml-1 font-label-md text-label-md text-on-surface-variant" htmlFor="category">
                Category
              </label>
              <div className="relative">
                <select
                  id="category"
                  value={categorySlug}
                  onChange={(e) => setCategorySlug(e.target.value)}
                  className="w-full cursor-pointer appearance-none rounded-xl border border-outline-variant bg-surface-container-low p-4 pr-10 text-on-surface outline-none transition-all focus:ring-2 focus:ring-primary"
                >
                  {ELECTION_CATEGORY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                  <option value={CATEGORY_CUSTOM}>Custom…</option>
                </select>
                <span className="material-symbols-outlined pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant">
                  expand_more
                </span>
              </div>
              {categorySlug === CATEGORY_CUSTOM ? (
                <input
                  type="text"
                  value={categoryCustom}
                  onChange={(e) => setCategoryCustom(e.target.value)}
                  placeholder="Your category label"
                  className="mt-2 w-full rounded-xl border border-outline-variant bg-surface-container-low p-4 text-on-surface outline-none focus:ring-2 focus:ring-primary"
                />
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="glass-card rounded-[32px] p-6 md:p-10">
          <h2 className="mb-8 flex items-center gap-3 font-headline-md text-headline-md text-on-surface">
            <span className="material-symbols-outlined rounded-lg bg-primary/10 p-2 text-primary">schedule</span>
            Timing &amp; registration window
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label className="ml-1 font-label-md text-label-md text-on-surface-variant" htmlFor="start">
                Voting starts
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
                Voting ends
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
          <div className="mt-6 flex flex-col gap-2">
            <label className="ml-1 font-label-md text-label-md text-on-surface-variant" htmlFor="regdeadline">
              Registration / opt-in deadline
            </label>
            <input
              id="regdeadline"
              type="datetime-local"
              value={registrationDeadline}
              onChange={(e) => setRegistrationDeadline(e.target.value)}
              className="w-full max-w-md rounded-xl border border-outline-variant bg-surface-container-low p-4 text-on-surface outline-none focus:ring-2 focus:ring-primary"
            />
            <p className="ml-1 max-w-xl font-body-sm text-body-sm text-on-surface-variant">
              Voters must join before this time (and before the cap fills). Leave empty to use the voting start time
              automatically.
            </p>
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="glass-card rounded-[32px] p-6 md:p-10">
          <h2 className="mb-8 flex items-center gap-3 font-headline-md text-headline-md text-on-surface">
            <span className="material-symbols-outlined rounded-lg bg-primary/10 p-2 text-primary">gavel</span>
            Participation limits &amp; rules
          </h2>
          <div className="space-y-8">
            <div className="flex flex-col gap-2">
              <label className="ml-1 font-label-md text-label-md text-on-surface-variant" htmlFor="max-voters">
                Maximum voters (pool cap before lock)
              </label>
              <input
                id="max-voters"
                type="number"
                min={1}
                value={maxVoters}
                onChange={(e) => setMaxVoters(Number(e.target.value))}
                className="w-full max-w-md rounded-xl border border-outline-variant bg-surface-container-low p-4 text-on-surface outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="ml-1 font-label-md text-label-md text-on-surface-variant">
                Voting eligibility rule
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
                <label className="ml-1 font-label-md text-label-md text-on-surface-variant">Privacy tier</label>
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
                  </div>
                  <p className="text-label-sm text-on-surface-variant">
                    Strong voter anonymity posture for ballots.
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
                    Audit-focused with pseudonymous identifiers.
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
                    <p className="font-label-md text-label-md font-bold text-on-surface">Live results</p>
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
                    <p className="text-[11px] text-on-surface-variant">Allow provisional write-in nominees.</p>
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
            <h2 className="mb-4 flex items-center gap-3 font-headline-md text-headline-md text-on-surface">
              <span className="material-symbols-outlined rounded-lg bg-primary/10 p-2 text-primary">verified</span>
              Candidates &amp; publish
            </h2>
            <p className="mb-6 font-body-md text-body-md text-on-surface-variant">
              Each election is <strong className="text-on-surface">one poll</strong>. Create additional polls anytime from
              your dashboard—each stays a separate draft until you publish.
            </p>

            <div className="mb-8 rounded-2xl border border-primary/20 bg-primary/5 p-6">
              <h3 className="mb-3 font-label-md font-bold uppercase tracking-wider text-primary">Publication summary</h3>
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-on-surface-variant">Title</dt>
                  <dd className="font-semibold text-on-surface">{title.trim() || '—'}</dd>
                </div>
                <div>
                  <dt className="text-on-surface-variant">Category</dt>
                  <dd className="font-semibold text-on-surface">{categoryLabel}</dd>
                </div>
                <div>
                  <dt className="text-on-surface-variant">Registration closes</dt>
                  <dd className="font-semibold text-on-surface">{registrationSummary}</dd>
                </div>
                <div>
                  <dt className="text-on-surface-variant">Voting window</dt>
                  <dd className="font-semibold text-on-surface">
                    {(() => {
                      const s = isoFromDatetimeLocal(startDate)
                      const e = isoFromDatetimeLocal(endDate)
                      if (!s || !e) return '—'
                      return `${formatSubmissionDate(s)} → ${formatSubmissionDate(e)}`
                    })()}
                  </dd>
                </div>
                <div>
                  <dt className="text-on-surface-variant">Max voters</dt>
                  <dd className="font-semibold text-on-surface">{maxVoters.toLocaleString()}</dd>
                </div>
              </dl>
            </div>

            <p className="mb-4 font-body-sm text-body-sm text-on-surface-variant">
              Add at least <strong className="text-on-surface">two candidates</strong> (poll options). You can publish
              when ready—draft stays editable until publish.
            </p>
            {electionId ? (
              <p className="mb-4 font-body-sm text-body-sm">
                <Link
                  to={`/creator/candidates?election=${electionId}`}
                  className="font-bold text-primary hover:underline"
                >
                  Candidate manager
                </Link>
                <span className="text-on-surface-variant">
                  {' '}
                  — upload portraits, designations, and full manifestos before you publish.
                </span>
              </p>
            ) : null}
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
                Save draft &amp; exit
              </button>
              <button
                type="button"
                disabled={saving || candidates.length < 2}
                onClick={() => void handlePublish()}
                className="rounded-full bg-primary px-10 py-4 font-bold text-on-primary shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
              >
                Publish election
              </button>
            </div>
          </div>
        </>
      ) : null}
    </CreatorWizardShell>
  )
}
