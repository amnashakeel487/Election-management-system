import { supabase } from '@/lib/supabase'
import type {
  Candidate,
  CandidateInput,
  CreateElectionInput,
  Election,
  ElectionWithCandidates,
  UpdateElectionInput,
} from '@/types/election'

const ELECTIONS = 'elections'
const CANDIDATES = 'candidates'

const ELECTION_COLUMNS =
  'id, creator_id, title, description, start_date, end_date, max_voters, status, eligibility_rule, privacy_tier, real_time_results, allow_write_ins, created_at, updated_at, published_at, secret_voter_id_prefix, voter_roll_finalized_at'

function defaultDraftDates() {
  const start = new Date()
  start.setDate(start.getDate() + 7)
  const end = new Date(start)
  end.setDate(end.getDate() + 7)
  return { start: start.toISOString(), end: end.toISOString() }
}

export async function fetchPublishedElections(): Promise<Election[]> {
  const { data, error } = await supabase
    .from(ELECTIONS)
    .select(ELECTION_COLUMNS)
    .in('status', ['published', 'active'])
    .order('start_date', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as Election[]
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
    .select(`${ELECTION_COLUMNS}, candidates (id, election_id, name, description, sort_order, created_at)`)
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
  input: Pick<CreateElectionInput, 'title' | 'description'>,
): Promise<Election> {
  const { start, end } = defaultDraftDates()

  const { data, error } = await supabase
    .from(ELECTIONS)
    .insert({
      creator_id: creatorId,
      title: input.title,
      description: input.description ?? null,
      start_date: start,
      end_date: end,
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

export async function publishElection(electionId: string): Promise<Election> {
  const election = await fetchElectionById(electionId)
  if (!election) throw new Error('Election not found')
  if (election.status !== 'draft') throw new Error('Only draft elections can be published')
  if (election.candidates.length < 2) {
    throw new Error('Add at least two candidates before publishing')
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
      sort_order: count ?? 0,
    })
    .select('id, election_id, name, description, sort_order, created_at')
    .single()

  if (error) throw new Error(error.message)
  return data as Candidate
}

export async function removeCandidate(candidateId: string): Promise<void> {
  const { error } = await supabase.from(CANDIDATES).delete().eq('id', candidateId)
  if (error) throw new Error(error.message)
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
    sort_order: index,
  }))

  const { data, error } = await supabase
    .from(CANDIDATES)
    .insert(rows)
    .select('id, election_id, name, description, sort_order, created_at')

  if (error) throw new Error(error.message)
  return (data ?? []) as Candidate[]
}
