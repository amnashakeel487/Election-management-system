import { useEffect, useRef, useState } from 'react'

type Format = 'number' | 'compact' | 'text'

function formatValue(value: number, format: Format, formatCompact: (n: number) => string): string {
  if (format === 'compact') return formatCompact(value)
  if (format === 'number') return value.toLocaleString()
  return String(value)
}

export function LandingAnimatedStat({
  value,
  format = 'number',
  formatCompact,
  className = 'stat-num-big',
}: {
  value: number
  format?: Format
  formatCompact?: (n: number) => string
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const animatedRef = useRef(false)
  const [display, setDisplay] = useState(0)
  const compact = formatCompact ?? ((n) => n.toLocaleString())

  useEffect(() => {
    if (format === 'text' || !animatedRef.current) return
    setDisplay(Math.max(0, Math.round(value)))
  }, [value, format])

  useEffect(() => {
    if (format === 'text') {
      setDisplay(value)
      return
    }

    const el = ref.current
    if (!el) return

    let timer: number | undefined

    const run = () => {
      const target = Math.max(0, Math.round(value))
      if (target === 0) {
        setDisplay(0)
        return
      }
      let current = 0
      const step = Math.max(1, Math.ceil(target / 50))
      timer = window.setInterval(() => {
        current = Math.min(current + step, target)
        setDisplay(current)
        if (current >= target) {
          window.clearInterval(timer)
          animatedRef.current = true
        }
      }, 30)
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          run()
          observer.disconnect()
        }
      },
      { threshold: 0.35 },
    )
    observer.observe(el)
    return () => {
      observer.disconnect()
      if (timer) window.clearInterval(timer)
    }
  }, [value, format])

  const text =
    format === 'text'
      ? String(value)
      : formatValue(display, format, compact)

  return (
    <div ref={ref} className={className}>
      {text}
    </div>
  )
}
