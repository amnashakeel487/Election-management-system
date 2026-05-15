import type { PublicElectionFilter } from '@/services/electionService'

interface SearchFiltersProps {
  query: string
  onQueryChange: (value: string) => void
  statusFilter: PublicElectionFilter
  onStatusChange: (value: PublicElectionFilter) => void
}

export function SearchFilters({ query, onQueryChange, statusFilter, onStatusChange }: SearchFiltersProps) {
  return (
    <section className="bg-surface-container-lowest/50 px-margin py-lg backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-gutter md:flex-row">
        <div className="relative w-full flex-1">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">
            search
          </span>
          <input
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search elections by title, category, or ID..."
            className="w-full rounded-xl border border-outline/20 bg-surface-container py-4 pl-12 pr-4 text-on-surface outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="flex w-full gap-4 md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value as PublicElectionFilter)}
            className="cursor-pointer appearance-none rounded-xl border border-outline/20 bg-surface-container px-6 py-4 text-on-surface outline-none transition-all focus:border-primary"
          >
            <option value="all">Status: All</option>
            <option value="active">Active</option>
            <option value="upcoming">Upcoming</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>
    </section>
  )
}
