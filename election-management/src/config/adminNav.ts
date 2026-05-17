export interface AdminNavItem {
  id: string
  path: string
  label: string
  section?: string
  badgeKey?: 'pending' | 'notifications'
  icon: 'dashboard' | 'requests' | 'elections' | 'users' | 'voters' | 'audit' | 'reports' | 'notifications' | 'settings' | 'profile' | 'logout'
}

export const ADMIN_NAV: AdminNavItem[] = [
  { id: 'dashboard', path: '/admin/dashboard', label: 'Dashboard', section: 'Main', icon: 'dashboard' },
  { id: 'requests', path: '/admin/requests', label: 'Creator Requests', section: 'Main', icon: 'requests', badgeKey: 'pending' },
  { id: 'elections', path: '/admin/elections', label: 'Elections', section: 'Main', icon: 'elections' },
  { id: 'users', path: '/admin/users', label: 'Users', section: 'Users', icon: 'users' },
  { id: 'voters', path: '/admin/voters', label: 'Voters', section: 'Users', icon: 'voters' },
  { id: 'audit', path: '/admin/audit-logs', label: 'Audit Logs', section: 'Monitoring', icon: 'audit' },
  { id: 'reports', path: '/admin/reports', label: 'Reports & Exports', section: 'Monitoring', icon: 'reports' },
  { id: 'notifications', path: '/admin/notifications', label: 'Notifications', section: 'Monitoring', icon: 'notifications', badgeKey: 'notifications' },
  { id: 'settings', path: '/admin/settings', label: 'Settings', section: 'Account', icon: 'settings' },
  { id: 'profile', path: '/admin/profile', label: 'Profile', section: 'Account', icon: 'profile' },
]

export const ADMIN_PAGE_META: Record<
  string,
  { topTitle: string; topSub?: string; eyebrow?: string; title: string; subtitle?: string }
> = {
  dashboard: {
    topTitle: 'Dashboard',
    topSub: 'Platform overview and key metrics',
    eyebrow: 'Overview',
    title: 'Admin Dashboard',
    subtitle: 'Platform-wide overview and key metrics at a glance',
  },
  requests: {
    topTitle: 'Creator Requests',
    topSub: 'Review and manage creator applications',
    eyebrow: 'Management',
    title: 'Creator Requests',
    subtitle: 'Review and manage election creator applications',
  },
  elections: {
    topTitle: 'Elections Management',
    topSub: 'View, manage and control all elections',
    eyebrow: 'Management',
    title: 'Elections Management',
    subtitle: 'View, manage and control all elections on the platform',
  },
  'election-detail': {
    topTitle: 'Election Details',
    topSub: 'Live stats, controls and audit trail',
    title: 'Election Details',
  },
  users: {
    topTitle: 'Users Management',
    topSub: 'View, search and manage all platform users',
    eyebrow: 'Management',
    title: 'Users Management',
    subtitle: 'View, search and manage all platform users',
  },
  voters: {
    topTitle: 'Voter Monitoring',
    topSub: 'Registrations, secret IDs and waitlists',
    eyebrow: 'Monitoring',
    title: 'Voter Monitoring',
    subtitle: 'Track voter registrations, secret IDs and duplicate detection',
  },
  audit: {
    topTitle: 'Audit Logs',
    topSub: 'Immutable timestamped activity log',
    eyebrow: 'Transparency',
    title: 'Audit Logs',
    subtitle: 'Full platform audit trail with export',
  },
  reports: {
    topTitle: 'Reports & Exports',
    topSub: 'Download platform data',
    eyebrow: 'Data',
    title: 'Reports & Exports',
    subtitle: 'Download platform data in various formats',
  },
  notifications: {
    topTitle: 'Notifications Center',
    topSub: 'System emails, alerts and reminders',
    eyebrow: 'Communications',
    title: 'Notifications Center',
    subtitle: 'System emails, alerts and election reminders',
  },
  settings: {
    topTitle: 'Settings',
    topSub: 'Platform configuration',
    eyebrow: 'Configuration',
    title: 'Settings',
    subtitle: 'Platform configuration and preferences',
  },
  profile: {
    topTitle: 'My Profile',
    topSub: 'Manage your admin account',
    eyebrow: 'Account',
    title: 'My Profile',
    subtitle: 'Manage your admin account information',
  },
}
