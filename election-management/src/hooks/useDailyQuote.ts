import { useEffect, useState } from 'react'
import { pickRandomFallbackQuote } from '@/data/fallbackQuotes'

const STORAGE_KEY = 'fv-quote-of-day'
const ZENQUOTES_URL = 'https://zenquotes.io/api/random'

export interface DailyQuoteData {
  text: string
  author: string
  fromCache: boolean
  fromFallback: boolean
}

interface CachedQuote {
  date: string
  text: string
  author: string
  fromFallback?: boolean
}

function todayKey(): string {
  return new Date().toLocaleDateString('en-CA')
}

function readCache(): CachedQuote | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CachedQuote
    if (!parsed.date || !parsed.text) return null
    return parsed
  } catch {
    return null
  }
}

function writeCache(entry: CachedQuote): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entry))
  } catch {
    /* quota / private mode */
  }
}

function decodeQuoteText(raw: string): string {
  return raw
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim()
}

async function fetchZenQuote(): Promise<{ text: string; author: string }> {
  const res = await fetch(ZENQUOTES_URL, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(10_000),
  })
  if (!res.ok) throw new Error(`Quote API responded with ${res.status}`)

  const data: unknown = await res.json()
  if (!Array.isArray(data) || data.length === 0) throw new Error('Invalid quote payload')

  const row = data[0] as { q?: string; a?: string }
  const text = decodeQuoteText(String(row.q ?? ''))
  const author = decodeQuoteText(String(row.a ?? 'Unknown')).trim() || 'Unknown'
  if (!text) throw new Error('Empty quote')

  return { text, author }
}

export function useDailyQuote(): {
  quote: DailyQuoteData | null
  loading: boolean
} {
  const [quote, setQuote] = useState<DailyQuoteData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const today = todayKey()

    const cached = readCache()
    if (cached?.date === today) {
      setQuote({
        text: cached.text,
        author: cached.author,
        fromCache: true,
        fromFallback: Boolean(cached.fromFallback),
      })
      setLoading(false)
      return
    }

    void (async () => {
      try {
        const fresh = await fetchZenQuote()
        if (cancelled) return
        writeCache({ date: today, text: fresh.text, author: fresh.author, fromFallback: false })
        setQuote({
          text: fresh.text,
          author: fresh.author,
          fromCache: false,
          fromFallback: false,
        })
      } catch {
        if (cancelled) return
        const fallback = pickRandomFallbackQuote()
        writeCache({
          date: today,
          text: fallback.text,
          author: fallback.author,
          fromFallback: true,
        })
        setQuote({
          text: fallback.text,
          author: fallback.author,
          fromCache: false,
          fromFallback: true,
        })
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  return { quote, loading }
}
