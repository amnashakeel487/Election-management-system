import { sanitizeText } from '@/lib/security/sanitize'
import { electionDescriptionSchema, electionTitleSchema, parseOrThrow } from '@/lib/validation/schemas'
import { removeCandidatePortrait } from '@/services/candidatePhotoService'
import { supabase } from '@/lib/supabase'
import type {
  Candidate,
  CandidateInput,
  CreateElectionInput,
  Election,
  ElectionStatus,
  ElectionWithCandidates,
  UpdateCandidateInput,
  UpdateElectionInput,
} from '@/types/election'

const ELECTIONS = 'elections'
const CANDIDATES = 'candidates'

const ELECTION_COLUMNS =
  'id, creator_id, title, description, category, start_date, end_date, registration_deadline, max_voters, status, eligibility_rule, privacy_tier, real_time_results, allow_write_ins, created_at, updated_at, published_at, secret_voter_id_prefix, voter_roll_finalized_at, registration_locked_at, registration_lock_reason, results_locked_at, results_locked_by'

const CANDIDATE_COLUMNS = 'id, election_id, name, description, designation, photo_url, sort_order, created_at'

function defaultDraftDates() {
  const start = new Date()
  start.setDate(start.getDate() + 7)
  const end = new Date(start)
  end.setDate(end.getDate() + 7)
  return { start: start.toISOString(), end: end.toISOString() }
}

export type PublicElectionFilter = 'all' | 'active' | 'upcoming' | 'completed'

export async function fetchPublicElections(filter: PublicElectionFilter = 'all'): Promise<Election[]> {
  let query = supabase
    .from(ELECTIONS)
    .select(ELECTION_COLUMNS)
    .in('status', ['published', 'active', 'completed'])
    .order('start_date', { ascending: true })

  const { data, error } = await query
  if (error) throw new Error(error.message)

  const rows = (data ?? []) as Election[]
  const now = Date.now()

  return rows.filter((e) => {
    const start = new Date(e.start_date).getTime()
    const end = new Date(e.end_date).getTime()
    if (e.status === 'completed' || now > end) return filter === 'all' || filter === 'completed'
    if (now < start) return filter === 'all' || filter === 'upcoming'
    return filter === 'all' || filter === 'active'
  })
}

/** @deprecated Use fetchPublicElections */
export async function fetchPublishedElections(): Promise<Election[]> {
  return fetchPublicElections('all').then((rows) =>
    rows.filter((e) => {
      const now = Date.now()
      const start = new Date(e.start_date).getTime()
      const end = new Date(e.end_date).getTime()
      return e.status !== 'completed' && now >= start && now <= end
        ? true
        : e.status !== 'completed' && now < start
    }),
  )
}

export async function fetchCreatorElections(creatorId: string): Promise<Election[]> {
  const { data, error } = await supabase
    .from(ELECTIONS)
    .select(ELECTION_COLUMNS)
    .eq('creator_id', creatorId)
    .order('updated_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as Election[]
}

export async function fetchElectionById(electionId: string): Promise<ElectionWithCandidates | null> {
  const { data, error } = await supabase
    .from(ELECTIONS)
    .select(`${ELECTION_COLUMNS}, candidates (${CANDIDATE_COLUMNS})`)
    .eq('id', electionId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) return null

  const row = data as Election & { candidates: Candidate[] }
  return {
    ...row,
    candidates: (row.candidates ?? []).sort((a, b) => a.sort_order - b.sort_order),
  }
}

export async function createElectionDraft(
  creatorId: string,
  input: Pick<CreateElectionInput, 'title' | 'description'> & { category?: string | null },
): Promise<Election> {
  const { start, end } = defaultDraftDates()
  const title = parseOrThrow(electionTitleSchema, sanitizeText(input.title, 200))
  const description = input.description
    ? parseOrThrow(electionDescriptionSchema, sanitizeText(input.description, 5000))
    : null

  const { data, error } = await supabase
    .from(ELECTIONS)
    .insert({
      creator_id: creatorId,
      title,
      description,
      category: input.category ? sanitizeText(input.category, 80) : null,
      start_date: start,
      end_date: end,
      registration_deadline: null,
      max_voters: 1000,
      status: 'draft',
    })
    .select(ELECTION_COLUMNS)
    .single()

  if (error) throw new Error(error.message)
  return data as Election
}

export async function updateElection(
  electionId: string,
  input: UpdateElectionInput,
): Promise<Election> {
  const { data, error } = await supabase
    .from(ELECTIONS)
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq('id', electionId)
    .eq('status', 'draft')
    .select(ELECTION_COLUMNS)
    .single()

  if (error) throw new Error(error.message)
  return data as Election
}

function effectiveRegistrationDeadline(election: Election): Date {
  if (election.registration_deadline) return new Date(election.registration_deadline)
  return new Date(election.start_date)
}

/** Creator control-panel updates (status, privacy, live results) on non-draft elections. */
export async function updateCreatorElectionControls(
  electionId: string,
  patch: {
    status?: ElectionStatus
    real_time_results?: boolean
    privacy_tier?: string
  },
): Promise<Election> {
  const { data, error } = await supabase
    .from(ELECTIONS)
    .update({
      ...patch,
      updated_at: new Date().toISOString(),
    })
    .eq('id', electionId)
    .select(ELECTION_COLUMNS)
    .single()

  if (error) throw new Error(error.message)
  return data as Election
}

export function canCreatorDeleteElection(status: ElectionStatus): boolean {
  return status === 'draft' || status === 'published'
}

/** Deletes an election and cascades related rows. Only draft/published (see RLS). */
export async function deleteCreatorElection(electionId: string): Promise<void> {
  const election = await fetchElectionById(electionId)
  if (!election) throw new Error('Election not found')
  if (!canCreatorDeleteElection(election.status)) {
    throw new Error(
      'Only draft or published elections can be deleted. Active or completed elections cannot be removed.',
    )
  }

  await Promise.all(
    election.candidates.map((c) =>
      c.photo_url ? removeCandidatePortrait(c.photo_url).catch(() => undefined) : Promise.resolve(),
    ),
  )

  const { error } = await supabase.from(ELECTIONS).delete().eq('id', electionId)
  if (error) throw new Error(error.message)
}

export async function publishElection(electionId: string): Promise<Election> {
  const election = await fetchElectionById(electionId)
  if (!election) throw new Error('Election not found')
  if (election.status !== 'draft') throw new Error('Only draft elections can be published')
  if (!election.title.trim()) throw new Error('Election title is required')
  if (election.candidates.length < 2) {
    throw new Error('Add at least two candidates before publishing')
  }

  const start = new Date(election.start_date).getTime()
  const end = new Date(election.end_date).getTime()
  const regEnd = effectiveRegistrationDeadline(election).getTime()

  if (end <= start) throw new Error('Voting end must be after voting start')
  if (regEnd > start) {
    throw new Error('Registration deadline must be on or before the voting start time')
  }

  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from(ELECTIONS)
    .update({
      status: 'published',
      published_at: now,
      updated_at: now,
    })
    .eq('id', electionId)
    .eq('status', 'draft')
    .select(ELECTION_COLUMNS)
    .single()

  if (error) throw new Error(error.message)
  return data as Election
}

export async function addCandidate(electionId: string, input: CandidateInput): Promise<Candidate> {
  const { count, error: countError } = await supabase
    .from(CANDIDATES)
    .select('*', { count: 'exact', head: true })
    .eq('election_id', electionId)

  if (countError) throw new Error(countError.message)

  const { data, error } = await supabase
    .from(CANDIDATES)
    .insert({
      election_id: electionId,
      name: input.name,
      description: input.description ?? null,
      designation: input.designation ?? null,
      photo_url: input.photo_url ?? null,
      sort_order: count ?? 0,
    })
    .select(CANDIDATE_COLUMNS)
    .single()

  if (error) throw new Error(error.message)
  return data as Candidate
}

export async function removeCandidate(candidateId: string): Promise<void> {
  const { error } = await supabase.from(CANDIDATES).delete().eq('id', candidateId)
  if (error) throw new Error(error.message)
}

export async function updateCandidate(
  candidateId: string,
  patch: UpdateCandidateInput,
): Promise<Candidate> {
  const updateRow: Record<string, unknown> = {}
  if (patch.name !== undefined) updateRow.name = patch.name
  if (patch.description !== undefined) updateRow.description = patch.description
  if (patch.designation !== undefined) updateRow.designation = patch.designation
  if (patch.photo_url !== undefined) updateRow.photo_url = patch.photo_url

  const { data, error } = await supabase
    .from(CANDIDATES)
    .update(updateRow)
    .eq('id', candidateId)
    .select(CANDIDATE_COLUMNS)
    .single()

  if (error) throw new Error(error.message)
  return data as Candidate
}

export async function replaceCandidates(
  electionId: string,
  candidates: CandidateInput[],
): Promise<Candidate[]> {
  const { error: deleteError } = await supabase.from(CANDIDATES).delete().eq('election_id', electionId)
  if (deleteError) throw new Error(deleteError.message)

  if (candidates.length === 0) return []

  const rows = candidates.map((c, index) => ({
    election_id: electionId,
    name: c.name,
    description: c.description ?? null,
    designation: c.designation ?? null,
    photo_url: c.photo_url ?? null,
    sort_order: index,
  }))

  const { data, error } = await supabase
    .from(CANDIDATES)
    .insert(rows)
    .select(CANDIDATE_COLUMNS)

  if (error) throw new Error(error.message)
  return (data ?? []) as Candidate[]
}
