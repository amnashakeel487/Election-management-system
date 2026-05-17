import { useEffect, useState } from 'react'

export interface LiveClockParts {
  weekday: string
  date: string
  time: string
}

function formatLiveClock(now: Date): LiveClockParts {
  return {
    weekday: now.toLocaleDateString(undefined, { weekday: 'long' }),
    date: now.toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
    time: now.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }),
  }
}

export function useLiveClock(): LiveClockParts {
  const [parts, setParts] = useState<LiveClockParts>(() => formatLiveClock(new Date()))

  useEffect(() => {
    const tick = () => setParts(formatLiveClock(new Date()))
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [])

  return parts
}
