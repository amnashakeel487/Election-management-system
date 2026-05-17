import type { ReactNode } from 'react'

interface AuthLayoutProps {
  children: ReactNode
}

/** Auth pages: light page shell + branded footer. */
export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="auth-layout flex min-h-screen flex-col bg-background font-body-md text-on-background">
      <main className="relative flex flex-grow items-center justify-center overflow-hidden px-4 py-8 sm:px-md sm:py-xl">
        <div className="absolute inset-0 z-0">
          <div className="absolute right-[-5%] top-[-10%] h-[500px] w-[500px] rounded-full bg-primary/12 blur-[120px]" />
          <div className="absolute bottom-[-10%] left-[-5%] h-[400px] w-[400px] rounded-full bg-secondary/12 blur-[100px]" />
        </div>
        <div className="z-10 w-full max-w-[540px]">{children}</div>
      </main>
      <footer className="flex w-full flex-col items-center justify-between border-t border-on-nav/15 bg-nav px-margin py-lg text-on-nav/70 md:flex-row">
        <span className="mb-md font-label-md text-label-md font-bold text-on-nav md:mb-0">FortressVote</span>
        <div className="flex flex-wrap justify-center gap-lg">
          <span className="font-body-sm text-body-sm text-on-nav/65">
            System status: <span className="font-mono text-tertiary">Operational</span>
          </span>
          <span className="font-body-sm text-body-sm text-on-nav/65">
            Encryption: <span className="font-mono text-tertiary">AES-256-GCM</span>
          </span>
        </div>
      </footer>
    </div>
  )
}
