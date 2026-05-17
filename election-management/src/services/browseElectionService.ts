import { supabase } from '@/lib/supabase'

/** Candidate counts per election for browse cards (anon-readable via published elections). */
export async function fetchPublicCandidateCounts(
  electionIds: string[],
): Promise<Map<string, number>> {
  const map = new Map<string, number>()
  if (electionIds.length === 0) return map

  const { data, error } = await supabase.from('candidates').select('election_id').in('election_id', electionIds)

  if (error) {
    console.warn('fetchPublicCandidateCounts:', error.message)
    return map
  }

  for (const row of data ?? []) {
    const id = row.election_id as string
    map.set(id, (map.get(id) ?? 0) + 1)
  }
  return map
}
