export const ELECTION_CATEGORY_OPTIONS = [
  { value: 'government_public', label: 'Government / public office' },
  { value: 'organization_board', label: 'Organization / board governance' },
  { value: 'student_academic', label: 'Student / academic body' },
  { value: 'corporate_internal', label: 'Corporate / internal vote' },
  { value: 'community_poll', label: 'Community / straw poll' },
  { value: 'union_association', label: 'Union / association' },
] as const

export type ElectionCategoryValue = (typeof ELECTION_CATEGORY_OPTIONS)[number]['value']

/** Stored values stay `zero_knowledge` / `pseudonymous` — labels are creator-friendly only. */
export const WIZARD_PRIVACY_OPTIONS = [
  {
    value: 'zero_knowledge',
    title: 'Maximum privacy (recommended)',
    description:
      'Votes are secret. Organizers see totals and turnout, not who picked which candidate.',
  },
  {
    value: 'pseudonymous',
    title: 'Standard privacy + audit support',
    description:
      'Still secret ballots, but organizers can use secret voter IDs to audit participation (not your ballot choice).',
  },
] as const

export const WIZARD_FEATURE_TOGGLES = {
  liveResults: {
    title: 'Show live results while voting',
    descriptionOn: 'ON — Vote counts update on the public results page during the election.',
    descriptionOff: 'OFF — Results stay hidden until voting ends (then you can publish them).',
  },
  writeIns: {
    title: 'Allow write-in candidates',
    descriptionOn: 'ON — Saved for this election (ballot write-in UI coming soon).',
    descriptionOff: 'OFF — Voters may only choose candidates you add to the ballot.',
  },
} as const

export function privacyTierLabel(value: string): string {
  return WIZARD_PRIVACY_OPTIONS.find((o) => o.value === value)?.title ?? value.replace(/_/g, ' ')
}
