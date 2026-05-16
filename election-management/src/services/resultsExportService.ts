import { fetchUserProfile } from '@/services/authService'
import type { ElectionResultsPayload } from '@/types/electionResults'
import type { ResultsExportMeta } from '@/utils/resultsExportCsv'

export async function buildResultsExportMeta(
  results: ElectionResultsPayload,
): Promise<ResultsExportMeta> {
  const exportedAt = new Date().toISOString()
  if (!results.creator_id) {
    return {
      exportedAt,
      creatorName: '—',
      creatorEmail: '—',
      creatorOrganization: null,
    }
  }

  try {
    const creator = await fetchUserProfile(results.creator_id)
    return {
      exportedAt,
      creatorName: creator?.full_name?.trim() || creator?.email || '—',
      creatorEmail: creator?.email ?? '—',
      creatorOrganization: creator?.organization?.trim() || null,
    }
  } catch {
    return {
      exportedAt,
      creatorName: '—',
      creatorEmail: '—',
      creatorOrganization: null,
    }
  }
}
