import { Link } from 'react-router-dom'

export function Footer() {
  return (
    <footer className="bg-nav text-on-nav">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-margin sm:py-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12 md:gap-8">
          <div className="md:col-span-4">
            <span className="font-headline-md text-headline-md font-extrabold tracking-tight text-on-nav">FortressVote</span>
            <p className="mt-3 max-w-sm font-body-sm text-body-sm text-on-nav/65">
              Secure election hosting with verified registration, anonymous ballots, and transparent results where
              configured.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:col-span-8">
            <div>
              <h3 className="mb-3 font-label-sm uppercase tracking-wider text-on-nav/50">Product</h3>
              <ul className="space-y-2 font-body-sm text-on-nav/70">
                <li>
                  <a className="transition-colors hover:text-on-nav" href="#elections-catalog">
                    Elections
                  </a>
                </li>
                <li>
                  <Link className="transition-colors hover:text-on-nav" to="/results">
                    Results
                  </Link>
                </li>
                <li>
                  <Link className="transition-colors hover:text-on-nav" to="/register">
                    Register
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="mb-3 font-label-sm uppercase tracking-wider text-on-nav/50">Legal</h3>
              <ul className="space-y-2 font-body-sm text-on-nav/70">
                <li>
                  <a className="transition-colors hover:text-on-nav" href="#">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a className="transition-colors hover:text-on-nav" href="#">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a className="transition-colors hover:text-on-nav" href="#">
                    Security
                  </a>
                </li>
              </ul>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <h3 className="mb-3 font-label-sm uppercase tracking-wider text-on-nav/50">Connect</h3>
              <div className="flex gap-3">
                <div className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-on-nav/20 text-on-nav/70 transition-colors hover:border-tertiary/50 hover:text-tertiary">
                  <span className="material-symbols-outlined text-lg">public</span>
                </div>
                <div className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-on-nav/20 text-on-nav/70 transition-colors hover:border-tertiary/50 hover:text-tertiary">
                  <span className="material-symbols-outlined text-lg">shield_with_heart</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="border-t border-on-nav/15">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-6 font-body-sm text-on-nav/55 sm:flex-row sm:px-margin">
          <p>© {new Date().getFullYear()} FortressVote. All rights reserved.</p>
          <div className="flex flex-wrap justify-center gap-6">
            <a href="#" className="transition-colors hover:text-on-nav">
              Cookies
            </a>
            <a href="#" className="transition-colors hover:text-on-nav">
              Accessibility
            </a>
            <a href="#" className="transition-colors hover:text-on-nav">
              Voter rights
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
