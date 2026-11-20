import { Link } from 'react-router-dom'
import styles from './TopBanner.module.css'

/**
 * The threshold strip — a very thin dark banner across the full width.
 * A whisper that you are entering a space. The wordmark quietly links home.
 *
 * `invitation` (homepage only) replaces the tagline with the invitation to the
 * public Moment of Gratitude for Tina — 26 Nov 2026, The Horn, Küsnacht. Copy
 * verbatim from the client (20 Nov 2026). Remove it after the event.
 */
export default function TopBanner({ invitation = false }: { invitation?: boolean }) {
  return (
    <header className={`${styles.banner} ${invitation ? styles.inviting : ''}`}>
      <Link to="/" className={styles.title} aria-label="Sacred Light Symphony — home">
        Sacred&nbsp;&nbsp;·&nbsp;&nbsp;Light&nbsp;&nbsp;·&nbsp;&nbsp;Symphony
      </Link>

      {invitation ? (
        <div className={styles.invitation}>
          <p className={styles.welcome}>You are welcome</p>
          <p className={styles.moment}>A Moment of Gratitude for Tina</p>
          <span className={styles.rule} aria-hidden="true" />
          <p className={styles.sub}>Where Sound, Stillness, Light Meet</p>
          {/* One line on wide screens; stacked place / date / time on narrower ones. */}
          <p className={styles.details}>
            <span>The Horn, Küsnacht</span>
            <span className={styles.dot} aria-hidden="true">·</span>
            <time dateTime="2026-11-26">26.11.2026</time>
            <span className={styles.dot} aria-hidden="true">·</span>
            <span>From 16.16 until the sun sets</span>
          </p>
        </div>
      ) : (
        <p className={styles.sub}>Where light, sound and stillness meet.</p>
      )}
    </header>
  )
}
