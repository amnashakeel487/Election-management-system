export function AuthSessionLoading({ message = 'Loading secure session…' }: { message?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface text-on-surface">
      <span className="font-body-md text-body-md text-on-surface-variant">{message}</span>
    </div>
  )
}
