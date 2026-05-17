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
  labelKey: string
  sectionKey?: string
  icon: CreatorNavIcon
  badgeKey?: 'notifications'
  end?: boolean
}

export const CREATOR_NAV: CreatorNavItem[] = [
  {
    id: 'dashboard',
    path: '/creator/dashboard',
    labelKey: 'nav.dashboard',
    sectionKey: 'nav.sections.overview',
    icon: 'dashboard',
    end: true,
  },
  {
    id: 'elections',
    path: '/creator/elections',
    labelKey: 'nav.myElections',
    sectionKey: 'nav.sections.elections',
    icon: 'elections',
    end: true,
  },
  { id: 'create', path: '/creator/elections/new', labelKey: 'nav.createElection', icon: 'create', end: true },
  {
    id: 'candidates',
    path: '/creator/candidates',
    labelKey: 'nav.candidates',
    sectionKey: 'nav.sections.management',
    icon: 'candidates',
  },
  { id: 'participants', path: '/creator/participants', labelKey: 'nav.participants', icon: 'participants' },
  { id: 'results', path: '/creator/results', labelKey: 'nav.results', icon: 'results' },
  {
    id: 'notifications',
    path: '/creator/notifications',
    labelKey: 'nav.notifications',
    sectionKey: 'nav.sections.tools',
    icon: 'notifications',
    badgeKey: 'notifications',
  },
  { id: 'reports', path: '/creator/reports', labelKey: 'nav.reports', icon: 'reports' },
  {
    id: 'settings',
    path: '/creator/settings',
    labelKey: 'nav.settings',
    sectionKey: 'nav.sections.account',
    icon: 'settings',
  },
  { id: 'profile', path: '/creator/profile', labelKey: 'nav.profile', icon: 'profile' },
]

export interface CreatorPageKeySet {
  topTitle: string
  topSub?: string
  eyebrow?: string
  title: string
  subtitle?: string
}

/** i18n keys under the `creator` namespace */
export const CREATOR_PAGE_KEYS: Record<string, CreatorPageKeySet> = {
  dashboard: {
    topTitle: 'pages.dashboard.topTitle',
    topSub: 'pages.dashboard.topSub',
    eyebrow: 'pages.dashboard.eyebrow',
    title: 'pages.dashboard.title',
    subtitle: 'pages.dashboard.subtitle',
  },
  elections: {
    topTitle: 'pages.elections.topTitle',
    topSub: 'pages.elections.topSub',
    eyebrow: 'pages.elections.eyebrow',
    title: 'pages.elections.title',
    subtitle: 'pages.elections.subtitle',
  },
  create: {
    topTitle: 'pages.create.topTitle',
    topSub: 'pages.create.topSub',
    eyebrow: 'pages.create.eyebrow',
    title: 'pages.create.title',
    subtitle: 'pages.create.subtitle',
  },
  candidates: {
    topTitle: 'pages.candidates.topTitle',
    topSub: 'pages.candidates.topSub',
    eyebrow: 'pages.candidates.eyebrow',
    title: 'pages.candidates.title',
    subtitle: 'pages.candidates.subtitle',
  },
  participants: {
    topTitle: 'pages.participants.topTitle',
    topSub: 'pages.participants.topSub',
    eyebrow: 'pages.participants.eyebrow',
    title: 'pages.participants.title',
    subtitle: 'pages.participants.subtitle',
  },
  results: {
    topTitle: 'pages.results.topTitle',
    topSub: 'pages.results.topSub',
    eyebrow: 'pages.results.eyebrow',
    title: 'pages.results.title',
    subtitle: 'pages.results.subtitle',
  },
  notifications: {
    topTitle: 'pages.notifications.topTitle',
    topSub: 'pages.notifications.topSub',
    eyebrow: 'pages.notifications.eyebrow',
    title: 'pages.notifications.title',
    subtitle: 'pages.notifications.subtitle',
  },
  reports: {
    topTitle: 'pages.reports.topTitle',
    topSub: 'pages.reports.topSub',
    eyebrow: 'pages.reports.eyebrow',
    title: 'pages.reports.title',
    subtitle: 'pages.reports.subtitle',
  },
  settings: {
    topTitle: 'pages.settings.topTitle',
    topSub: 'pages.settings.topSub',
    eyebrow: 'pages.settings.eyebrow',
    title: 'pages.settings.title',
    subtitle: 'pages.settings.subtitle',
  },
  profile: {
    topTitle: 'pages.profile.topTitle',
    topSub: 'pages.profile.topSub',
    eyebrow: 'pages.profile.eyebrow',
    title: 'pages.profile.title',
    subtitle: 'pages.profile.subtitle',
  },
  'election-detail': {
    topTitle: 'pages.electionDetail.topTitle',
    topSub: 'pages.electionDetail.topSub',
    title: 'pages.electionDetail.title',
  },
}

/** @deprecated Use useCreatorPageMeta() for translated strings */
export const CREATOR_PAGE_META = CREATOR_PAGE_KEYS
