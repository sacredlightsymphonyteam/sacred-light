import { useState } from 'react'
import { Link } from 'react-router-dom'
import TopBanner from '../../components/TopBanner/TopBanner'
import ConstellationField from '../../components/ConstellationField/ConstellationField'
import ConstellationPanel from '../../components/ConstellationPanel/ConstellationPanel'
import Footer from '../../components/Footer/Footer'
import Seo from '../../components/Seo/Seo'
import { SITE_URL } from '../../lib/site'
import type { ConstellationLight } from '../../lib/supabase'
import styles from './Constellation.module.css'

/**
 * The Living Constellation of Light (Phase 2).
 * STATE 1 (first arrival): the immersive field + title + invitation.
 * STATE 2 (exploration): hover a point for a name/country tooltip; click to
 * open its message panel while the field dims behind.
 * Personal-URL zoom, welcome banner, counter and Find-My-Light arrive next.
 */
export default function Constellation() {
  const [selected, setSelected] = useState<ConstellationLight | null>(null)

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
          <ConstellationField onSelect={setSelected} dimmed={selected !== null} />
        </div>

        <div className={styles.top}>
          <h1 className={`section-h swirl ${styles.title}`}>The Living Constellation of Light</h1>
          <p className={styles.subtitle}>Each point of light carries a message of gratitude.</p>
        </div>

        <div className={styles.invite}>
          <p className={styles.inviteLines}>
            Your message matters.
            <br />
            Your light matters.
          </p>
          <Link to="/gratitude" className="sls-cta">
            Become a Messenger of Gratitude
          </Link>
        </div>
      </section>

      {selected && <ConstellationPanel light={selected} onClose={() => setSelected(null)} />}

      <Footer />
    </main>
  )
}
