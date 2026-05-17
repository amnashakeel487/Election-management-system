import { useCallback, useRef, useState } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { getElectionJoinUrl } from '@/utils/electionInvite'

interface CreatorElectionDetailQrSectionProps {
  electionId: string
  electionTitle: string
}

export function CreatorElectionDetailQrSection({
  electionId,
  electionTitle,
}: CreatorElectionDetailQrSectionProps) {
  const joinUrl = getElectionJoinUrl(electionId)
  const qrWrapRef = useRef<HTMLDivElement>(null)
  const [copied, setCopied] = useState(false)
  const [hint, setHint] = useState<string | null>(null)

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(joinUrl)
      setCopied(true)
      setHint('Invite link copied.')
      window.setTimeout(() => setCopied(false), 2500)
    } catch {
      setHint('Could not copy — select the link manually.')
    }
  }, [joinUrl])

  const downloadQr = useCallback(() => {
    const canvas = qrWrapRef.current?.querySelector('canvas')
    if (!canvas) {
      setHint('QR code is not ready yet.')
      return
    }
    const slug =
      electionTitle.replace(/[^\w-]+/g, '-').replace(/^-|-$/g, '').slice(0, 48) || 'election'
    const anchor = document.createElement('a')
    anchor.href = canvas.toDataURL('image/png')
    anchor.download = `${slug}-invite-qr.png`
    anchor.click()
    setHint('QR image downloaded.')
  }, [electionTitle])

  const shareQr = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join: ${electionTitle}`,
          text: `Register for ${electionTitle} on VoteSecure.`,
          url: joinUrl,
        })
        return
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return
      }
    }
    await copyLink()
  }, [copyLink, electionTitle, joinUrl])

  return (
    <div className="qr-module">
      <div className="qr-left">
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: 'var(--ced-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.7px',
            marginBottom: 10,
          }}
        >
          Invite Link
        </div>
        <div className="qr-link-box">
          <div className="qr-link-icon">
            <svg viewBox="0 0 24 24" aria-hidden>
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
          </div>
          <span className="qr-link-text">{joinUrl}</span>
        </div>
        <div className="qr-link-btns">
          <button
            type="button"
            className="p-btn primary"
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={() => void copyLink()}
          >
            {copied ? 'Copied' : 'Copy Link'}
          </button>
          <a
            href={joinUrl}
            className="p-btn"
            style={{ flex: 1, justifyContent: 'center', textDecoration: 'none' }}
            target="_blank"
            rel="noreferrer"
          >
            Open Link
          </a>
        </div>
        {hint ? <p style={{ marginTop: 10, fontSize: 11, color: 'var(--ced-subtle)' }}>{hint}</p> : null}
        <p style={{ marginTop: 16, fontSize: 12, color: 'var(--ced-muted)', lineHeight: 1.5 }}>
          Voters can scan with a phone camera or open the link to register. Works on iOS and Android.
        </p>
      </div>
      <div className="qr-right">
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: 'var(--ced-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.7px',
            marginBottom: 10,
            textAlign: 'center',
          }}
        >
          QR Code
        </div>
        <div className="qr-preview" ref={qrWrapRef}>
          <QRCodeCanvas value={joinUrl} size={168} level="M" includeMargin />
        </div>
        <div className="qr-btns">
          <button
            type="button"
            className="p-btn primary"
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={downloadQr}
          >
            Download QR
          </button>
          <button
            type="button"
            className="p-btn"
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={() => void shareQr()}
          >
            Share QR
          </button>
        </div>
      </div>
    </div>
  )
}
