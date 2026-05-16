import { useCallback, useRef, useState } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { getElectionJoinUrl } from '@/utils/electionInvite'

interface ElectionQrInvitePanelProps {
  electionId: string
  electionTitle: string
  /** Compact layout for sidebars */
  compact?: boolean
}

export function ElectionQrInvitePanel({
  electionId,
  electionTitle,
  compact = false,
}: ElectionQrInvitePanelProps) {
  const joinUrl = getElectionJoinUrl(electionId)
  const qrWrapRef = useRef<HTMLDivElement>(null)
  const [copied, setCopied] = useState(false)
  const [hint, setHint] = useState<string | null>(null)

  const copyInviteLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(joinUrl)
      setCopied(true)
      setHint('Invite link copied to clipboard.')
      window.setTimeout(() => setCopied(false), 2500)
    } catch {
      setHint('Could not copy — select the link and copy manually.')
    }
  }, [joinUrl])

  const downloadQrImage = useCallback(() => {
    const canvas = qrWrapRef.current?.querySelector('canvas')
    if (!canvas) {
      setHint('QR code is not ready yet. Try again.')
      return
    }
    const png = canvas.toDataURL('image/png')
    const slug = electionTitle.replace(/[^\w-]+/g, '-').replace(/^-|-$/g, '').slice(0, 48) || 'election'
    const anchor = document.createElement('a')
    anchor.href = png
    anchor.download = `${slug}-invite-qr.png`
    anchor.click()
    setHint('QR image downloaded.')
  }, [electionTitle])

  const shareInvite = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join: ${electionTitle}`,
          text: `Scan or open to register for ${electionTitle} on FortressVote.`,
          url: joinUrl,
        })
        setHint('Share dialog opened.')
        return
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return
      }
    }
    await copyInviteLink()
  }, [copyInviteLink, electionTitle, joinUrl])

  const qrSize = compact ? 160 : 200

  return (
    <section
      className={
        compact
          ? 'rounded-2xl border border-line bg-surface-container-low p-4'
          : 'rounded-[24px] border border-line bg-surface-container-low p-6'
      }
      aria-labelledby={`qr-invite-${electionId}`}
    >
      <div className={compact ? 'mb-3' : 'mb-5'}>
        <h3
          id={`qr-invite-${electionId}`}
          className={
            compact
              ? 'font-label-md text-label-md font-bold text-on-surface'
              : 'font-headline-md text-headline-md text-on-surface'
          }
        >
          Invite link &amp; QR code
        </h3>
        <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
          Voters can scan with a phone camera or open the link to register. Works on iOS and Android.
        </p>
      </div>

      <label className="mb-2 block font-label-sm text-label-sm text-on-surface-variant">Join URL</label>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <input
          type="url"
          readOnly
          value={joinUrl}
          className="min-w-0 flex-1 rounded-xl border border-line bg-surface-container-highest px-3 py-2.5 font-mono text-[12px] text-on-surface"
          onFocus={(e) => e.target.select()}
          aria-label="Election join link"
        />
        <button
          type="button"
          onClick={() => void copyInviteLink()}
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 font-label-md text-label-md text-on-primary transition-opacity hover:opacity-90"
        >
          <span className="material-symbols-outlined text-[18px]">{copied ? 'check' : 'content_copy'}</span>
          {copied ? 'Copied' : 'Copy invite link'}
        </button>
      </div>

      <div className={`flex flex-col items-center gap-4 ${compact ? '' : 'sm:flex-row sm:items-start sm:gap-8'}`}>
        <div
          ref={qrWrapRef}
          className="rounded-2xl border border-line bg-white p-4 shadow-sm"
          role="img"
          aria-label={`QR code for ${electionTitle} join page`}
        >
          <QRCodeCanvas
            value={joinUrl}
            size={qrSize}
            level="M"
            marginSize={2}
            bgColor="#ffffff"
            fgColor="#0f172a"
          />
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-[200px]">
          <button
            type="button"
            onClick={downloadQrImage}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-line bg-surface-container-highest px-4 py-3 font-label-md text-label-md text-on-surface transition-colors hover:bg-elevated/50"
          >
            <span className="material-symbols-outlined text-[20px]">download</span>
            Download QR
          </button>
          <button
            type="button"
            onClick={() => void shareInvite()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 font-label-md text-label-md text-primary transition-colors hover:bg-primary/15"
          >
            <span className="material-symbols-outlined text-[20px]">share</span>
            Share QR
          </button>
          <p className="text-center font-label-sm text-label-sm text-on-surface-variant sm:text-left">
            <span className="material-symbols-outlined mr-1 align-middle text-[16px]">qr_code_scanner</span>
            Point any camera app at the code
          </p>
        </div>
      </div>

      {hint ? (
        <p className="mt-4 font-body-sm text-body-sm text-tertiary" role="status">
          {hint}
        </p>
      ) : null}
    </section>
  )
}
