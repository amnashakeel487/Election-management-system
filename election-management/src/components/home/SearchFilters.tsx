import type { PublicElectionFilter } from '@/services/electionService'

const FILTERS: { value: PublicElectionFilter; label: string; short: string }[] = [
  { value: 'all', label: 'All elections', short: 'All' },
  { value: 'upcoming', label: 'Upcoming', short: 'Upcoming' },
  { value: 'active', label: 'Active', short: 'Active' },
  { value: 'completed', label: 'Completed', short: 'Done' },
]

interface SearchFiltersProps {
  query: string
  onQueryChange: (value: string) => void
  statusFilter: PublicElectionFilter
  onStatusChange: (value: PublicElectionFilter) => void
}

export function SearchFilters({ query, onQueryChange, statusFilter, onStatusChange }: SearchFiltersProps) {
  return (
    <section className="border-b border-white/5 bg-surface-container-lowest/40 px-4 py-6 backdrop-blur-md sm:px-margin sm:py-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-5">
        <div>
          <h2 className="font-headline-md text-headline-md text-on-surface sm:font-headline-lg sm:text-headline-lg">
            Browse elections
          </h2>
          <p className="mt-1 max-w-2xl font-body-sm text-body-sm text-on-surface-variant sm:font-body-md sm:text-body-md">
            Filter by status, search by title or category, then open an election for registration and voting details.
          </p>
        </div>

        <label className="relative block w-full">
          <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant sm:left-4">
            search
          </span>
          <input
            type="search"
            enterKeyHint="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search by title, description, category, or ID…"
            className="w-full rounded-xl border border-white/10 bg-surface-container py-3.5 pl-11 pr-4 text-base text-on-surface outline-none ring-primary/0 transition-[box-shadow,border-color] focus:border-primary/40 focus:ring-2 focus:ring-primary/30 sm:py-4 sm:pl-12 sm:text-body-md"
          />
        </label>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-label-sm text-label-sm text-on-surface-variant sm:hidden">Status</p>
          <div
            className="flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:flex-wrap sm:overflow-visible [&::-webkit-scrollbar]:hidden"
            role="tablist"
            aria-label="Election status filter"
          >
            {FILTERS.map((f) => {
              const active = statusFilter === f.value
              return (
                <button
                  key={f.value}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => onStatusChange(f.value)}
                  className={
                    active
                      ? 'snap-start shrink-0 rounded-xl bg-primary px-4 py-2.5 font-label-md text-label-md font-bold text-on-primary shadow-md shadow-primary/25'
                      : 'snap-start shrink-0 rounded-xl border border-white/10 bg-surface-container px-4 py-2.5 font-label-md text-label-md text-on-surface-variant transition-colors hover:border-primary/30 hover:text-on-surface'
                  }
                >
                  <span className="sm:hidden">{f.short}</span>
                  <span className="hidden sm:inline">{f.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
