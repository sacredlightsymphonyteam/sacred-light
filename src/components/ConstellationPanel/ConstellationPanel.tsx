import { useEffect, useRef } from 'react'
import type { ConstellationLight } from '../../lib/supabase'
import styles from './ConstellationPanel.module.css'

/** When the full messages are unveiled (Movement 4). */
const REVEAL_DATE = '26 November 2026'

/** "LIGHT-0042" → "LIGHT · 0042" for display. */
function formatReference(ref: string): string {
  return ref.replace('-', ' · ')
}

/**
 * The message panel that opens when a point of light is clicked (STATE 2).
 * Shows the light's reference, contributor name/country, and — if the curator
 * chose one during approval — a short fragment of the message. The full message
 * stays sealed until the unveiling. Dismiss via ×, click-away, or Esc.
 */
export default function ConstellationPanel({
  light,
  onClose,
}: {
  light: ConstellationLight
  onClose: () => void
}) {
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const country = light.country ? ` · ${light.country}` : ''

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
      </div>
    </div>
  )
}
