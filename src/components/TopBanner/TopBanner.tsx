import { Link } from 'react-router-dom'
import styles from './TopBanner.module.css'

/**
 * The threshold strip — a very thin dark banner across the full width.
 * A whisper that you are entering a space. The wordmark quietly links home.
 */
export default function TopBanner() {
  return (
    <header className={styles.banner}>
      <Link to="/" className={styles.title} aria-label="Sacred Light Symphony — home">
        Sacred&nbsp;&nbsp;·&nbsp;&nbsp;Light&nbsp;&nbsp;·&nbsp;&nbsp;Symphony
      </Link>
      <p className={styles.sub}>Where light, sound and stillness meet.</p>
    </header>
  )
}
