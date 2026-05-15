import pagesManifest from './pages.json'

export type DesignPageKey = keyof typeof pagesManifest

export const DESIGN_PAGES = pagesManifest

/** Resolve design HTML path relative to project root (for documentation / tooling). */
export function getDesignPath(pageKey: DesignPageKey): string {
  return DESIGN_PAGES[pageKey].designPath
}

/** Home maps to landing_page in /design (no /design/Home folder). */
export const HOME_DESIGN_KEY: DesignPageKey = 'home'
