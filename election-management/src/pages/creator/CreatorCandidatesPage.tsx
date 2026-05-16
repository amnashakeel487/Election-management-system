import { CreatorSidebar } from '@/components/creator/CreatorSidebar'
import { CandidateManager } from '@/components/creator/CandidateManager'
import { CREATOR_PROFILE_AVATAR } from '@/constants/electionAssets'
import { useAuth } from '@/hooks/useAuth'

export function CreatorCandidatesPage() {
  const { profile } = useAuth()

  return (
    <div className="overflow-x-hidden bg-background text-on-background">
      <CreatorSidebar />

      <main className="ml-[280px] flex min-h-screen flex-col">
        <header className="sticky top-0 z-40 flex h-20 items-center justify-between bg-surface-dim px-margin py-sm">
          <div className="flex items-center gap-4">
            <h2 className="font-headline-lg text-headline-lg text-primary">Candidate Management</h2>
          </div>
          <div className="flex items-center gap-4">
            <button type="button" className="relative rounded-full p-2 transition-all hover:bg-surface-container-highest">
              <span className="material-symbols-outlined text-on-surface">notifications</span>
            </button>
            <div className="flex items-center gap-3 border-l border-line pl-4">
              <img
                alt="User Avatar"
                className="h-10 w-10 rounded-full border border-primary/30 object-cover"
                src={CREATOR_PROFILE_AVATAR}
              />
              <div className="hidden lg:block">
                <p className="font-label-md text-label-md text-on-surface">{profile?.email ?? 'Creator'}</p>
                <p className="text-[10px] uppercase text-on-surface-variant">Elections Board</p>
              </div>
            </div>
          </div>
        </header>

        <div className="p-margin">{profile?.id ? <CandidateManager creatorId={profile.id} /> : null}</div>
      </main>
    </div>
  )
}
