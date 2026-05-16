import { Link } from 'react-router-dom'
import { ADMIN_PROFILE_AVATAR } from '@/constants/adminAssets'
import { useAuth } from '@/hooks/useAuth'

export function AdminTopBar({
  title = 'Dashboard',
  pendingCount = 0,
}: {
  title?: string
  pendingCount?: number
}) {
  const { profile } = useAuth()
  const displayName = profile?.full_name?.trim() || profile?.email?.split('@')[0] || 'Admin'

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between bg-surface-dim px-margin py-sm">
      <div className="flex items-center gap-4">
        <h2 className="font-headline-lg text-headline-lg text-primary">{title}</h2>
      </div>
      <div className="flex items-center gap-6">
        {pendingCount > 0 ? (
          <Link
            to="/admin/approvals"
            className="relative rounded-full p-2 text-on-surface-variant transition-all hover:bg-surface-container-highest"
            title="Pending creator approvals"
          >
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-error text-[10px] font-bold text-on-error">
              {pendingCount > 9 ? '9+' : pendingCount}
            </span>
          </Link>
        ) : null}
        <div className="flex items-center gap-3 rounded-full border border-line bg-surface-container-high py-1 pl-4 pr-1">
          <span className="font-label-md text-label-md text-on-surface">{displayName}</span>
          <img
            alt="Admin profile"
            className="h-8 w-8 rounded-full border border-primary/30"
            src={ADMIN_PROFILE_AVATAR}
          />
        </div>
      </div>
    </header>
  )
}
