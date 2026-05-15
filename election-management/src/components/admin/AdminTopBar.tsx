import { ADMIN_PROFILE_AVATAR } from '@/constants/adminAssets'

export function AdminTopBar({ title = 'Dashboard' }: { title?: string }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between bg-surface-dim px-margin py-sm">
      <div className="flex items-center gap-4">
        <span className="material-symbols-outlined cursor-pointer rounded-full p-2 text-on-surface-variant transition-all hover:bg-surface-container-highest">
          menu
        </span>
        <h2 className="font-headline-lg text-headline-lg text-primary">{title}</h2>
      </div>
      <div className="flex items-center gap-6">
        <div className="relative">
          <span className="material-symbols-outlined cursor-pointer rounded-full p-2 text-on-surface-variant transition-all hover:bg-surface-container-highest">
            notifications
          </span>
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-error" />
        </div>
        <div className="flex items-center gap-3 rounded-full border border-white/5 bg-surface-container-high py-1 pl-4 pr-1">
          <span className="font-label-md text-label-md text-on-surface">Super Admin</span>
          <img
            alt="Admin User Profile"
            className="h-8 w-8 rounded-full border border-primary/30"
            src={ADMIN_PROFILE_AVATAR}
          />
        </div>
      </div>
    </header>
  )
}
