import { Link } from 'react-router-dom'
import TopBanner from '../../components/TopBanner/TopBanner'
import ConstellationField from '../../components/ConstellationField/ConstellationField'
import Footer from '../../components/Footer/Footer'
import Seo from '../../components/Seo/Seo'
import { SITE_URL } from '../../lib/site'
import styles from './Constellation.module.css'

/**
 * The Living Constellation of Light (Phase 2). Step 2 = the field itself:
 * a cosmic canvas with the blue "Tina" cross at its heart and the real
 * contributor points of light in warm gold. Hover / click / personal-URL /
 * counter / search arrive in later steps.
 */
export default function Constellation() {
  return (
    <main>
      <Seo
        title="The Living Constellation of Light — Sacred Light Symphony"
        description="A growing field of light — one point for every message of gratitude in the Book of Gratitude."
        path="/constellation"
        image={`${SITE_URL}/hero-poster.jpg`}
      />

      <TopBanner />

      <section className={styles.stage} aria-label="The Living Constellation of Light">
        <div className={styles.fieldWrap}>
          <ConstellationField />
        </div>
        <div className={styles.overlay}>
          <h1 className={`section-h swirl ${styles.title}`}>The Living Constellation of Light</h1>
          <p className={styles.subtitle}>Each point of light carries a message of gratitude.</p>
        </div>
      </section>

      <section className="section light" aria-label="Add your light">
        <div className="inner">
          <p className={styles.invite}>
            Your message matters.
            <br />
            Your light matters.
          </p>
          <Link to="/gratitude" className="sls-cta">
            Become a Messenger of Gratitude
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  )
}
