import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  canCreatorEditElectionDetails,
  fetchElectionById,
  updateCreatorElectionDetails,
} from '@/services/electionService'
import type { Election } from '@/types/election'
import { fromDatetimeLocalValue, toDatetimeLocalValue } from '@/utils/datetime'
import { validateElectionScheduleInput } from '@/utils/electionScheduleValidation'

interface CreatorElectionEditFormProps {
  electionId: string
}

export function CreatorElectionEditForm({ electionId }: CreatorElectionEditFormProps) {
  const { t } = useTranslation('creator')
  const navigate = useNavigate()
  const [election, setElection] = useState<Election | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [registrationDeadline, setRegistrationDeadline] = useState('')
  const [maxVoters, setMaxVoters] = useState(1000)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const data = await fetchElectionById(electionId)
        if (!data) throw new Error('Election not found')
        if (!canCreatorEditElectionDetails(data.status)) {
          throw new Error(t('elections.edit.completedLocked'))
        }
        setElection(data)
        setTitle(data.title)
        setDescription(data.description ?? '')
        setStartDate(toDatetimeLocalValue(data.start_date))
        setEndDate(toDatetimeLocalValue(data.end_date))
        setRegistrationDeadline(
          data.registration_deadline ? toDatetimeLocalValue(data.registration_deadline) : '',
        )
        setMaxVoters(data.max_voters)
      } catch (err) {
        setError(err instanceof Error ? err.message : t('elections.edit.loadFailed'))
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [electionId, t])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!election) return

    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      setError(t('elections.edit.titleRequired'))
      return
    }

    const scheduleError = validateElectionScheduleInput(startDate, endDate, registrationDeadline)
    if (scheduleError) {
      setError(scheduleError)
      return
    }

    if (maxVoters < 1) {
      setError(t('elections.edit.maxVotersMin'))
      return
    }

    setSaving(true)
    setError(null)
    setMessage(null)
    try {
      await updateCreatorElectionDetails(electionId, {
        title: trimmedTitle,
        description: description.trim() || undefined,
        start_date: fromDatetimeLocalValue(startDate),
        end_date: fromDatetimeLocalValue(endDate),
        registration_deadline: registrationDeadline.trim()
          ? fromDatetimeLocalValue(registrationDeadline.trim())
          : null,
        max_voters: maxVoters,
      })
      setMessage(t('elections.edit.saved'))
      setTimeout(() => navigate(`/creator/elections/${electionId}`), 600)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('elections.edit.saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <p style={{ fontSize: 13, color: 'var(--subtle)' }}>{t('elections.loading')}</p>
  }

  if (!election) {
    return (
      <div className="card-elevated">
        <div className="card-body">
          <p style={{ fontSize: 13, color: 'var(--error, #dc2626)' }}>{error ?? t('elections.edit.loadFailed')}</p>
          <Link to="/creator/elections" className="btn btn-sm btn-ghost" style={{ marginTop: 12 }}>
            {t('elections.edit.backToList')}
          </Link>
        </div>
      </div>
    )
  }

  const rollLocked = Boolean(election.voter_roll_finalized_at)

  return (
    <form className="card-elevated" onSubmit={onSubmit}>
      <div className="card-header">
        <div className="card-title">{t('elections.edit.formTitle')}</div>
        <div className="card-subtitle">{t('elections.edit.formSubtitle')}</div>
      </div>
      <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {message ? <div className="alert-banner alert-banner--success">{message}</div> : null}
        {error ? (
          <p style={{ fontSize: 13, color: 'var(--error, #dc2626)', margin: 0 }} role="alert">
            {error}
          </p>
        ) : null}

        <div className="form-group">
          <label className="form-label" htmlFor="edit-election-title">
            {t('elections.edit.titleLabel')}
          </label>
          <input
            id="edit-election-title"
            className="form-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="edit-election-desc">
            {t('elections.edit.descriptionLabel')}
          </label>
          <textarea
            id="edit-election-desc"
            className="form-input"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label" htmlFor="edit-start">
              {t('elections.edit.startLabel')}
            </label>
            <input
              id="edit-start"
              type="datetime-local"
              className="form-input"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="edit-end">
              {t('elections.edit.endLabel')}
            </label>
            <input
              id="edit-end"
              type="datetime-local"
              className="form-input"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="edit-reg-deadline">
            {t('elections.edit.registrationDeadlineLabel')}
          </label>
          <input
            id="edit-reg-deadline"
            type="datetime-local"
            className="form-input"
            value={registrationDeadline}
            onChange={(e) => setRegistrationDeadline(e.target.value)}
          />
          <p style={{ fontSize: 11, color: 'var(--subtle)', marginTop: 6 }}>{t('elections.edit.registrationDeadlineHint')}</p>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="edit-max-voters">
            {t('elections.edit.maxVotersLabel')}
          </label>
          <input
            id="edit-max-voters"
            type="number"
            min={1}
            className="form-input"
            value={maxVoters}
            disabled={rollLocked}
            onChange={(e) => setMaxVoters(Number(e.target.value))}
          />
          {rollLocked ? (
            <p style={{ fontSize: 11, color: 'var(--subtle)', marginTop: 6 }}>{t('elections.edit.maxVotersLocked')}</p>
          ) : null}
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', paddingTop: 8 }}>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? t('elections.edit.saving') : t('elections.edit.save')}
          </button>
          <Link to={`/creator/elections/${electionId}`} className="btn btn-ghost">
            {t('elections.edit.cancel')}
          </Link>
        </div>
      </div>
    </form>
  )
}
