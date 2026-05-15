export const ELECTION_CATEGORY_OPTIONS = [
  { value: 'government_public', label: 'Government / public office' },
  { value: 'organization_board', label: 'Organization / board governance' },
  { value: 'student_academic', label: 'Student / academic body' },
  { value: 'corporate_internal', label: 'Corporate / internal vote' },
  { value: 'community_poll', label: 'Community / straw poll' },
  { value: 'union_association', label: 'Union / association' },
] as const

export type ElectionCategoryValue = (typeof ELECTION_CATEGORY_OPTIONS)[number]['value']
