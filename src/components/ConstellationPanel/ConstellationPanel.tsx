import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { ConstellationLight } from '../../lib/supabase'
import styles from './ConstellationPanel.module.css'

/** When the full messages are unveiled (Movement 4). */
const REVEAL_DATE = '26 November 2026'

const SHARE_TEXT = 'A light of gratitude shines in the Living Constellation. Come and see it.'

/** "LIGHT-0042" → "LIGHT · 0042" for display. */
function formatReference(ref: string): string {
  return ref.replace('-', ' · ')
}

/**
 * The message panel that opens when a point of light is clicked (STATE 2), or
 * automatically when arriving via a personal URL (STATE 3). In `personal` mode
 * it also shows the owner note, the "no two lights" philosophy line, an invite,
 * and share actions. Dismiss via ×, click-away, or Esc.
 */
export default function ConstellationPanel({
  light,
  onClose,
  personal,
}: {
  light: ConstellationLight
  onClose: () => void
  /** Present on a personal-URL page. `shareUrl` is the clean URL to share. */
  personal?: { shareUrl: string; isOwner: boolean }
}) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const country = light.country ? ` · ${light.country}` : ''

  const copyLink = async () => {
    if (!personal) return
    try {
      await navigator.clipboard.writeText(personal.shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard unavailable (e.g. insecure context) — leave feedback off.
    }
  }

  const whatsappHref = personal
    ? `https://wa.me/?text=${encodeURIComponent(`${SHARE_TEXT} ${personal.shareUrl}`)}`
    : ''
  const emailHref = personal
    ? `mailto:?subject=${encodeURIComponent('A light of gratitude')}&body=${encodeURIComponent(
        `${SHARE_TEXT}\n\n${personal.shareUrl}`,
      )}`
    : ''

  return (
    <div className={styles.scrim} onClick={onClose}>
      <div
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-label={`Point of light ${light.light_reference}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button ref={closeRef} type="button" className={styles.close} aria-label="Close" onClick={onClose}>
          ×
        </button>

        <p className={styles.reference}>{formatReference(light.light_reference)}</p>
        <p className={styles.who}>
          {light.name}
          {country}
        </p>

        {light.message_fragment && <p className={styles.fragment}>{light.message_fragment}</p>}

        <p className={styles.holding}>Their full message will be revealed on {REVEAL_DATE}.</p>

        {personal && (
          <div className={styles.personal}>
            {personal.isOwner && <p className={styles.ownerNote}>This is your light.</p>}
            <p className={styles.philosophy}>
              No two lights are the same. Each one carries a unique expression of gratitude.
            </p>

            <p className={styles.inviteLabel}>Invite another heart to add its light.</p>
            <div className={styles.share}>
              <a className={styles.shareBtn} href={whatsappHref} target="_blank" rel="noopener noreferrer">
                WhatsApp
              </a>
              <a className={styles.shareBtn} href={emailHref}>
                Email
              </a>
              <button type="button" className={styles.shareBtn} onClick={copyLink}>
                {copied ? 'Copied' : 'Copy link'}
              </button>
            </div>

            <Link to="/gratitude" className={styles.addOwn} onClick={onClose}>
              Add your own light
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
