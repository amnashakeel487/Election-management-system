import { useEffect } from 'react'

/** Scroll-reveal for `.reveal` / `.reveal-left` / `.reveal-right` inside `.lp-root`. */
export function useLandingReveal(rootReady = true) {
  useEffect(() => {
    if (!rootReady) return

    const els = document.querySelectorAll('.lp-root .reveal, .lp-root .reveal-left, .lp-root .reveal-right')
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('visible')
            observer.unobserve(e.target)
          }
        })
      },
      { threshold: 0.12 },
    )
    els.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [rootReady])
}

export function useLandingCounter(rootReady = true) {
  useEffect(() => {
    if (!rootReady) return

    const els = document.querySelectorAll('.lp-root [data-target]')
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return
          const el = e.target as HTMLElement
          const target = parseInt(el.dataset.target ?? '', 10)
          if (!target) return
          let current = 0
          const step = Math.max(1, Math.ceil(target / 60))
          const timer = window.setInterval(() => {
            current = Math.min(current + step, target)
            el.textContent = current.toLocaleString()
            if (current >= target) window.clearInterval(timer)
          }, 25)
          observer.unobserve(el)
        })
      },
      { threshold: 0.5 },
    )
    els.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [rootReady])
}
