import { Link } from 'react-router-dom'
import TopBanner from '../../components/TopBanner/TopBanner'
import Hero from '../../components/Hero/Hero'
import styles from './Home.module.css'

export default function Home() {
  return (
    <main className={styles.page}>
      {/* FOLD 1 — fills one screen on mobile; ends on a black section. */}
      <div className={styles.fold1}>
        <TopBanner />

        <Hero />

        {/* Ivory — three words. Stacked. Widely spaced. Timeless. */}
        <section className={styles.words} aria-label="Presence, Power, Light">
          <div className={styles.wordStack}>
            <span className={styles.word}>Presence</span>
            <span className={styles.rule} aria-hidden="true" />
            <span className={styles.word}>Power</span>
            <span className={styles.rule} aria-hidden="true" />
            <span className={styles.word}>Light</span>
          </div>
        </section>

        {/* Black — the page's own voice + a quiet CTA. Closes Fold 1 and
            transitions gently into the ivory Fold 2 below. */}
        <section className={styles.closing}>
          <p className={styles.gratitude}>
            With gratitude for a life that still moves through us.
          </p>
          <Link to="/gratitude" className={styles.cta}>
            Express Your Gratitude
          </Link>
        </section>
      </div>

      {/* FOLD 2 — ivory again. The gentle handoff: the Book of Gratitude opens.
          A quiet intro for now; the contribution funnel builds out from here. */}
      <section className={styles.fold2} aria-label="The Book of Gratitude">
        <p className={styles.foldEyebrow}>The Book of Gratitude</p>
        <h2 className={styles.foldTitle}>A space for gratitude.</h2>
        <p className={styles.foldSub}>
          Not spoken,
          <br />
          but held.
        </p>
      </section>
    </main>
  )
}
