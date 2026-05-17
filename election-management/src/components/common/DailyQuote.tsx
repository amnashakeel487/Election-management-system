import { useDailyQuote } from '@/hooks/useDailyQuote'
import '@/styles/dashboard-widgets.css'

export type DailyQuoteVariant = 'default' | 'landing'

export interface DailyQuoteProps {
  variant?: DailyQuoteVariant
  className?: string
}

function QuoteIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M3 21c3 0 7-1 9-7 2-6-1-10-3-10-7 0-4 3-7 7-7 1 0 2 0 3" />
      <path d="M15 21c3 0 7-1 9-7 2-6-1-10-3-10-7 0-4 3-7 7-7 1 0 2 0 3" />
    </svg>
  )
}

export function DailyQuote({ variant = 'default', className = '' }: DailyQuoteProps) {
  const { quote, loading } = useDailyQuote()

  const rootClass = [
    'fv-widget',
    'fv-daily-quote',
    'fv-widget--fade',
    variant === 'landing' ? 'fv-widget--landing' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <blockquote className={rootClass} cite={quote?.author}>
      <p className="fv-daily-quote__label">Quote of the Day</p>
      <div className="fv-daily-quote__icon" aria-hidden>
        <QuoteIcon />
      </div>
      {loading ? (
        <div className="fv-daily-quote__skeleton" aria-busy="true" aria-label="Loading quote" />
      ) : (
        <>
          <p className="fv-daily-quote__text">&ldquo;{quote?.text}&rdquo;</p>
          {quote?.author ? <footer className="fv-daily-quote__author">{quote.author}</footer> : null}
        </>
      )}
    </blockquote>
  )
}
