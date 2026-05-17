export type CreatorNavIcon =
  | 'dashboard'
  | 'elections'
  | 'create'
  | 'candidates'
  | 'participants'
  | 'results'
  | 'notifications'
  | 'reports'
  | 'settings'
  | 'profile'
  | 'logout'

export interface CreatorNavItem {
  id: string
  path: string
  label: string
  section?: string
  icon: CreatorNavIcon
  badgeKey?: 'notifications'
  end?: boolean
}

export const CREATOR_NAV: CreatorNavItem[] = [
  { id: 'dashboard', path: '/creator/dashboard', label: 'Dashboard', section: 'Overview', icon: 'dashboard', end: true },
  {
    id: 'elections',
    path: '/creator/elections',
    label: 'My Elections',
    section: 'Elections',
    icon: 'elections',
    end: true,
  },
  { id: 'create', path: '/creator/elections/new', label: 'Create Election', icon: 'create', end: true },
  { id: 'candidates', path: '/creator/candidates', label: 'Candidates', section: 'Management', icon: 'candidates' },
  { id: 'participants', path: '/creator/participants', label: 'Participants', icon: 'participants' },
  { id: 'results', path: '/creator/results', label: 'Results', icon: 'results' },
  {
    id: 'notifications',
    path: '/creator/notifications',
    label: 'Notifications',
    section: 'Tools',
    icon: 'notifications',
    badgeKey: 'notifications',
  },
  { id: 'reports', path: '/creator/reports', label: 'Reports', icon: 'reports' },
  { id: 'settings', path: '/creator/settings', label: 'Settings', section: 'Account', icon: 'settings' },
  { id: 'profile', path: '/creator/profile', label: 'Profile', icon: 'profile' },
]

export const CREATOR_PAGE_META: Record<
  string,
  { topTitle: string; topSub?: string; eyebrow?: string; title: string; subtitle?: string }
> = {
  dashboard: {
    topTitle: 'Creator Dashboard',
    topSub: 'Your election platform summary and live stats',
    eyebrow: 'Overview',
    title: 'Creator Dashboard',
    subtitle: 'Your election platform summary and live stats',
  },
  elections: {
    topTitle: 'My Elections',
    topSub: 'All elections you have created and manage',
    eyebrow: 'Elections',
    title: 'My Elections',
    subtitle: 'All elections you have created and manage',
  },
  create: {
    topTitle: 'Create Election',
    topSub: 'Set up your election step by step',
    eyebrow: 'Create',
    title: 'Create New Election',
    subtitle: 'Set up your election step by step',
  },
  candidates: {
    topTitle: 'Candidate Management',
    topSub: 'Add, edit and manage election candidates',
    eyebrow: 'Management',
    title: 'Candidate Management',
    subtitle: 'Manage candidates for your selected election',
  },
  participants: {
    topTitle: 'Participants',
    topSub: 'Voter registrations, waitlists and stats',
    eyebrow: 'Voters',
    title: 'Participants',
    subtitle: 'Voter registrations and waitlist for your election',
  },
  results: {
    topTitle: 'Election Results',
    topSub: 'Live vote counting and analytics',
    eyebrow: 'Analytics',
    title: 'Election Results',
    subtitle: 'Live results and export for your election',
  },
  notifications: {
    topTitle: 'Notifications',
    topSub: 'System alerts, email logs and reminders',
    eyebrow: 'Communications',
    title: 'Notifications',
    subtitle: 'Email logs and election notification status',
  },
  reports: {
    topTitle: 'Reports',
    topSub: 'Export election data and analytics',
    eyebrow: 'Data',
    title: 'Reports',
    subtitle: 'Download participants, results and audit data',
  },
  settings: {
    topTitle: 'Creator Settings',
    topSub: 'Organisation info and preferences',
    eyebrow: 'Configuration',
    title: 'Creator Settings',
    subtitle: 'Appearance, language and notification preferences',
  },
  profile: {
    topTitle: 'My Profile',
    topSub: 'Manage your creator account',
    eyebrow: 'Account',
    title: 'My Profile',
    subtitle: 'Your account details and approval status',
  },
  'election-detail': {
    topTitle: 'Election Details',
    topSub: 'Manage invite, waitlist and voter roll',
    title: 'Election Details',
  },
}
