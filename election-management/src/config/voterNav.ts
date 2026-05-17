export type VoterNavIconId =
  | 'home'
  | 'elections'
  | 'polls'
  | 'vote'
  | 'results'
  | 'notifications'
  | 'profile'
  | 'settings'

export interface VoterNavItem {
  id: string
  path: string
  label: string
  icon: VoterNavIconId
  /** Sidebar section heading */
  section?: 'main' | 'data' | 'account'
  end?: boolean
  /** Shown in sidebar only when true (detail routes omit) */
  sidebar?: boolean
}

const SIDEBAR_SECTION_MAIN = 'main' as const
const SIDEBAR_SECTION_DATA = 'data' as const
const SIDEBAR_SECTION_ACCOUNT = 'account' as const

/** Primary sidebar navigation */
export const VOTER_SIDEBAR_NAV: VoterNavItem[] = [
  {
    id: 'home',
    path: '/voter/dashboard',
    label: 'Home',
    icon: 'home',
    section: SIDEBAR_SECTION_MAIN,
    end: true,
    sidebar: true,
  },
  {
    id: 'elections',
    path: '/voter/elections',
    label: 'My Elections',
    icon: 'elections',
    sidebar: true,
  },
  {
    id: 'polls',
    path: '/voter/polls',
    label: 'Joined Polls',
    icon: 'polls',
    sidebar: true,
  },
  {
    id: 'vote',
    path: '/voter/vote',
    label: 'Vote Now',
    icon: 'vote',
    sidebar: true,
    end: true,
  },
  {
    id: 'results',
    path: '/voter/results',
    label: 'Results',
    icon: 'results',
    section: SIDEBAR_SECTION_DATA,
    sidebar: true,
  },
  {
    id: 'notifications',
    path: '/voter/notifications',
    label: 'Notifications',
    icon: 'notifications',
    sidebar: true,
  },
  {
    id: 'profile',
    path: '/voter/profile',
    label: 'Profile',
    icon: 'profile',
    section: SIDEBAR_SECTION_ACCOUNT,
    sidebar: true,
  },
  {
    id: 'settings',
    path: '/voter/settings',
    label: 'Settings',
    icon: 'settings',
    sidebar: true,
  },
]

/** Extra routes (layout titles / matching), not all appear in sidebar */
export const VOTER_ROUTE_PATHS = {
  electionDetail: '/voter/elections/:id',
  voteCast: '/voter/vote/:electionId',
  voteSuccess: '/voter/vote/success',
  resultsDetail: '/voter/results/:id',
} as const
