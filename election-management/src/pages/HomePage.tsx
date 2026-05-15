import { Footer } from '@/components/layout/Footer'
import { TopNavBar } from '@/components/layout/TopNavBar'
import { ElectionsGrid } from '@/components/home/ElectionsGrid'
import { HeroSection } from '@/components/home/HeroSection'
import { SearchFilters } from '@/components/home/SearchFilters'
import { StatisticsBentoGrid } from '@/components/home/StatisticsBentoGrid'
import { TrustSection } from '@/components/home/TrustSection'

/** Converted from design/landing_page/code.html (Home). */
export function HomePage() {
  return (
    <div className="bg-background text-on-background selection:bg-primary/30">
      <TopNavBar />
      <main className="pt-16">
        <HeroSection />
        <StatisticsBentoGrid />
        <SearchFilters />
        <ElectionsGrid />
        <TrustSection />
      </main>
      <Footer />
    </div>
  )
}
