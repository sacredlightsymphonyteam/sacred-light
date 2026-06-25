import { Link } from 'react-router-dom'
import TopBanner from '../../components/TopBanner/TopBanner'
import Hero from '../../components/Hero/Hero'
import styles from './Home.module.css'

export default function Home() {
  return (
    <main className={styles.page}>
      <TopBanner />

      <Hero />

      <section className={styles.belowStage}>
        {/* Three words. Stacked. Widely spaced. Timeless. */}
        <div className={styles.wordStack} aria-label="Presence, Power, Light">
          <span className={styles.word}>Presence</span>
          <span className={styles.rule} aria-hidden="true" />
          <span className={styles.word}>Power</span>
          <span className={styles.rule} aria-hidden="true" />
          <span className={styles.word}>Light</span>
        </div>

        {/* The page's own voice — a gentle gratitude, quieter than Tina's. */}
        <p className={styles.gratitude}>
          With gratitude for a life that still moves through us.
        </p>

        {/* A button to be discovered, not pushed toward. */}
        <Link to="/gratitude" className={styles.cta}>
          Express Your Gratitude
        </Link>
      </section>
    </main>
  )
}
