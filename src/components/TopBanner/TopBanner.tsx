import styles from './TopBanner.module.css'

/**
 * The threshold strip — a very thin dark banner across the full width.
 * Not navigation. A whisper that you are entering a space, not arriving on a site.
 */
export default function TopBanner() {
  return (
    <header className={styles.banner}>
      <p className={styles.title}>
        Sacred&nbsp;&nbsp;·&nbsp;&nbsp;Light&nbsp;&nbsp;·&nbsp;&nbsp;Symphony
      </p>
      <p className={styles.sub}>Where light, sound and stillness meet.</p>
    </header>
  )
}
