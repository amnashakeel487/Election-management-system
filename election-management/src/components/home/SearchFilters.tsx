export function SearchFilters() {
  return (
    <section className="bg-surface-container-lowest/50 px-margin py-lg backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-gutter md:flex-row">
        <div className="relative w-full flex-1">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">
            search
          </span>
          <input
            type="text"
            placeholder="Search elections by title, region, or ID..."
            className="w-full rounded-xl border border-outline/20 bg-surface-container py-4 pl-12 pr-4 text-on-surface outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="flex w-full gap-4 md:w-auto">
          <select className="cursor-pointer appearance-none rounded-xl border border-outline/20 bg-surface-container px-6 py-4 text-on-surface outline-none transition-all focus:border-primary">
            <option>Status: All</option>
            <option>Active</option>
            <option>Upcoming</option>
            <option>Archived</option>
          </select>
          <button
            type="button"
            className="flex items-center gap-2 rounded-xl border border-outline/20 bg-surface-container-high px-6 py-4 text-on-surface transition-colors hover:bg-surface-container-highest"
          >
            <span className="material-symbols-outlined">filter_list</span>
            Filters
          </button>
        </div>
      </div>
    </section>
  )
}
