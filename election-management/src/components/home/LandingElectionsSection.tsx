import { PublicElectionCatalog } from '@/components/home/PublicElectionCatalog'

/** Landing page teaser: six most recent public elections + link to full catalog. */
export function LandingElectionsSection() {
  return <PublicElectionCatalog limit={6} showViewAll hideToolbar sectionId="elections" />
}
