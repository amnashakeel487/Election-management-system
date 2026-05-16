import { useCallback, useRef, useState } from 'react'
import type { ElectionResultsPayload } from '@/types/electionResults'
import { buildResultsExportMeta } from '@/services/resultsExportService'
import type { ResultsExportMeta } from '@/utils/resultsExportCsv'
import { buildResultsSummary } from '@/utils/resultsDisplay'
import { buildResultsCsv, downloadResultsCsv } from '@/utils/resultsExportCsv'
import { downloadResultsPdfFromElement, printResultsElement } from '@/utils/resultsExportPdf'
import { ResultsExportReport } from './ResultsExportReport'

interface ResultsExportToolbarProps {
  results: ElectionResultsPayload
  /** `default` for results page; `admin` for admin dashboard styling */
  variant?: 'default' | 'admin'
  className?: string
}

function slugify(title: string): string {
  return title.replace(/[^\w-]+/g, '-').replace(/^-|-$/g, '').slice(0, 48) || 'election'
}

export function ResultsExportToolbar({
  results,
  variant = 'default',
  className = '',
}: ResultsExportToolbarProps) {
  const reportRef = useRef<HTMLDivElement>(null)
  const [busy, setBusy] = useState<'pdf' | 'csv' | 'print' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [reportMeta, setReportMeta] = useState<ResultsExportMeta>(() => ({
    exportedAt: new Date().toISOString(),
    creatorName: '…',
    creatorEmail: '…',
    creatorOrganization: null,
  }))

  const { outcome } = buildResultsSummary(results)

  const waitForReportPaint = () =>
    new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    })

  const runExport = useCallback(
    async (action: 'pdf' | 'csv' | 'print') => {
      setBusy(action)
      setError(null)
      try {
        const meta = await buildResultsExportMeta(results)
        setReportMeta(meta)
        const slug = slugify(results.title)
        const date = new Date().toISOString().slice(0, 10)

        if (action === 'csv') {
          const csv = buildResultsCsv(results, meta, outcome)
          downloadResultsCsv(csv, results.title)
          return
        }

        await waitForReportPaint()

        const el = reportRef.current
        if (!el) {
          throw new Error('Report template not ready')
        }

        if (action === 'pdf') {
          await downloadResultsPdfFromElement(el, `${slug}-results-${date}.pdf`)
        } else {
          printResultsElement(el, `${results.title} — Results`)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Export failed')
      } finally {
        setBusy(null)
      }
    },
    [results, outcome],
  )

  const btnBase =
    variant === 'admin'
      ? 'btn btn-sm'
      : 'inline-flex items-center gap-1.5 rounded-xl border border-line px-4 py-2.5 font-label-md text-label-md transition-colors hover:bg-surface-container disabled:opacity-60'

  const btnPrimary =
    variant === 'admin' ? 'btn btn-primary btn-sm' : `${btnBase} border-primary/30 bg-primary/10 text-primary`

  return (
    <div className={className}>
      <div
        className={
          variant === 'admin'
            ? 'flex flex-wrap gap-2'
            : 'flex flex-wrap items-center gap-2'
        }
      >
        <button
          type="button"
          className={variant === 'admin' ? 'btn btn-primary btn-sm' : btnPrimary}
          disabled={busy != null}
          onClick={() => void runExport('pdf')}
        >
          <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
          {busy === 'pdf' ? 'Generating…' : 'Download PDF'}
        </button>
        <button
          type="button"
          className={variant === 'admin' ? 'btn btn-ghost btn-sm' : btnBase}
          disabled={busy != null}
          onClick={() => void runExport('csv')}
        >
          <span className="material-symbols-outlined text-[18px]">table_chart</span>
          {busy === 'csv' ? 'Exporting…' : 'Download CSV'}
        </button>
        <button
          type="button"
          className={variant === 'admin' ? 'btn btn-ghost btn-sm' : btnBase}
          disabled={busy != null}
          onClick={() => void runExport('print')}
        >
          <span className="material-symbols-outlined text-[18px]">print</span>
          {busy === 'print' ? 'Preparing…' : 'Print results'}
        </button>
      </div>

      {error ? (
        <p
          className={variant === 'admin' ? 'mt-2' : 'mt-2 font-body-sm text-body-sm text-error'}
          style={variant === 'admin' ? { fontSize: 12, color: 'var(--danger)' } : undefined}
          role="alert"
        >
          {error}
        </p>
      ) : null}

      {/* Off-screen report for PDF / print capture */}
      <div
        aria-hidden
        style={{
          position: 'fixed',
          left: -10000,
          top: 0,
          pointerEvents: 'none',
          zIndex: -1,
        }}
      >
        <ResultsExportReport ref={reportRef} results={results} meta={reportMeta} outcome={outcome} />
      </div>
    </div>
  )
}
