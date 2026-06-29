import { Link } from 'react-router-dom'
import TopBanner from '../../components/TopBanner/TopBanner'
import Hero from '../../components/Hero/Hero'
import BookOfGratitude from '../../components/BookOfGratitude/BookOfGratitude'
import Seo from '../../components/Seo/Seo'
import { SITE_NAME, SITE_URL } from '../../lib/site'
import styles from './Home.module.css'

// The homepage "fact sheets" Google reads. Marie's list also includes Event,
// Video, Book, FAQ, etc. — those get added on the pages where they belong.
const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: SITE_NAME,
  url: SITE_URL,
  description:
    'A participatory cultural initiative of gratitude, presence and light, inspired by the legacy of Tina Turner.',
  location: {
    '@type': 'Place',
    name: 'Küsnacht, Switzerland',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Küsnacht',
      addressCountry: 'CH',
    },
  },
}

const personSchema = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Tina Turner',
  description:
    'Singer and artist whose spiritual journey and legacy of gratitude and presence inspire Sacred Light Symphony.',
}

export default function Home() {
  return (
    <main className={styles.page}>
      <Seo
        title="Sacred Light Symphony — Gratitude, Presence & Light"
        description="A participatory experience of gratitude, presence and light — inspired by the legacy of Tina Turner, rooted in Küsnacht, Switzerland."
        path="/"
        jsonLd={[organizationSchema, personSchema]}
      />
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
          <Link to="/gratitude" className="sls-cta">
            Express Your Gratitude
          </Link>
        </section>
      </div>

      {/* SECTION 2 — The Book of Gratitude (charcoal). Flows from the dark
          closing of Fold 1 into the quiet gallery. */}
      <BookOfGratitude />
    </main>
  )
}
