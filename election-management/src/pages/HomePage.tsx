import { useState } from 'react'
import { Footer } from '@/components/layout/Footer'
import { TopNavBar } from '@/components/layout/TopNavBar'
import { ElectionsGrid } from '@/components/home/ElectionsGrid'
import { HeroSection } from '@/components/home/HeroSection'
import { SearchFilters } from '@/components/home/SearchFilters'
import { StatisticsBentoGrid } from '@/components/home/StatisticsBentoGrid'
import { TrustSection } from '@/components/home/TrustSection'
import type { PublicElectionFilter } from '@/services/electionService'

/** Public landing: catalog of elections + search + platform snapshot. */
export function HomePage() {
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<PublicElectionFilter>('all')

  return (
    <div className="min-h-screen bg-background text-on-background selection:bg-primary/30">
      <TopNavBar />
      <main className="pt-16">
        <HeroSection />

        <div id="elections-catalog" className="scroll-mt-20">
          <div className="border-t border-white/5 bg-surface-container-low/30 px-4 py-8 sm:px-margin sm:py-10">
            <div className="mx-auto max-w-6xl space-y-6">
              <StatisticsBentoGrid />
            </div>
          </div>

          <SearchFilters query={query} onQueryChange={setQuery} statusFilter={statusFilter} onStatusChange={setStatusFilter} />
          <ElectionsGrid query={query} statusFilter={statusFilter} />
        </div>

        <TrustSection />
      </main>
      <Footer />
    </div>
  )
}
