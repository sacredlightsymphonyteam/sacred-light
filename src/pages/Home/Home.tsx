import { Link } from 'react-router-dom'
import TopBanner from '../../components/TopBanner/TopBanner'
import Hero from '../../components/Hero/Hero'
import TodaysLight from '../../components/TodaysLight/TodaysLight'
import TheCircle from '../../components/TheCircle/TheCircle'
import Footer from '../../components/Footer/Footer'
import Seo from '../../components/Seo/Seo'
import { useScrollReveal } from '../../hooks/useScrollReveal'
import { SITE_NAME, SITE_URL } from '../../lib/site'
import styles from './Home.module.css'

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
    address: { '@type': 'PostalAddress', addressLocality: 'Küsnacht', addressCountry: 'CH' },
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
  useScrollReveal()
  return (
    <main>
      <Seo
        title="Sacred Light Symphony — Gratitude, Presence & Light"
        description="A participatory experience of gratitude, presence and light — inspired by the legacy of Tina Turner, rooted in Küsnacht, Switzerland."
        path="/"
        jsonLd={[organizationSchema, personSchema]}
      />

      <h1 className="sr-only">Sacred Light Symphony</h1>

      {/* Top banner — a thin dark frame (site wordmark), not a nav bar */}
      <TopBanner />

      {/* ── Movement 1 — Ivory Arrival (Hero) ── */}
      <section className={`section light ${styles.heroSection}`}>
        <Hero />

        {/* Three words — stacked, widely spaced, timeless */}
        <div className={styles.words} aria-label="Presence, Power, Light">
          <span className={styles.word}>Presence</span>
          <span className={styles.wordRule} aria-hidden="true" />
          <span className={styles.word}>Power</span>
          <span className={styles.wordRule} aria-hidden="true" />
          <span className={styles.word}>Light</span>
        </div>

        <p className={styles.heroPhrase}>
          With gratitude for a life that still moves through us.
        </p>
      </section>

      <div className="bridge-to-dark" aria-hidden="true" />

      {/* ── Movement 2 — Charcoal Reflection (Book of Gratitude) ── */}
      <section className="section dark" aria-label="The Book of Gratitude">
        <div className="inner">
          <h2 className="section-h reveal">A space for gratitude.</h2>
          <p className="stanza reveal">Not spoken, but held.</p>

          <hr className="rule-gold reveal" />

          <div className={`${styles.stanzaGroup} reveal`}>
            <p className="stanza">For what was given.</p>
            <p className="stanza">For what was lived.</p>
            <p className="stanza">For what remains.</p>
            <p className="stanza">For what still moves.</p>
          </div>

          <div className={`${styles.paraGroup} reveal`}>
            <p className="poetic">
              Inspired by Tina Turner’s enduring belief that even in life’s darkest moments we can
              choose the light, the first Book of Gratitude invites people from around the world to
              honour the gift she awakened within them — and the light they now choose to pass on.
            </p>
            <p className="poetic">
              Behind the voice that inspired millions was a woman who showed us that it is possible to
              move through darkness toward light.
            </p>
            <p className="poetic">The Book of Gratitude is an invitation to continue that journey.</p>
          </div>
        </div>
      </section>

      {/* Charcoal dissolves into ivory — the breath arrives before the blue image */}
      <div className="bridge-to-light" aria-hidden="true" />

      {/* ── Section 2b — Today's Light (a warm first light before Tina in Blue) ── */}
      <TodaysLight />

      {/* Ivory dissolves back into charcoal */}
      <div className="bridge-to-dark" aria-hidden="true" />

      <section className="section dark" aria-label="The Book of Gratitude, continued">
        <div className="inner">
          <div className={`${styles.image16} reveal`}>
            <span className={styles.imageLabel}>Bob Gruen · Tina in Blue</span>
          </div>

          <blockquote className={`${styles.quote} reveal`}>
            “When everything is so dark,
            <br />
            you have to find some way
            <br />
            to make the light.”
            <cite className={styles.quoteCite}>~ Tina Turner</cite>
          </blockquote>

          <hr className="rule-gold reveal" />

          <div className={`${styles.paraGroup} reveal`}>
            <p className="poetic">
              Join a growing community from around the world in sharing your message of gratitude.
            </p>
            <p className="poetic">
              Share a memory, a reflection, a poem, a song, a photograph, a work of art, or simply a
              few heartfelt words expressing what Tina Turner awakened in you — and the light you now
              choose to pass on to others.
            </p>
            <p className="poetic">This is a carefully curated Living Archive of human gratitude.</p>
            <p className="poetic">
              Each contribution finds its place within this Living Archive and is represented by a
              single point of light. Together, we co-create the Living Constellation of Light — a
              growing visual expression of collective gratitude, connecting hearts across continents,
              cultures, and generations.
            </p>
            <p className="poetic">
              The first edition of the Book of Gratitude will be gracefully designed and unveiled to
              the world on 26 November 2026, Tina Turner’s birthday, as the ceremonial opening of the
              Book of Gratitude takes place in Küsnacht, Switzerland.
            </p>
          </div>

          <div className={`${styles.stanzaGroup} reveal`}>
            <p className="stanza">Until then,</p>
            <p className="stanza">the constellation continues to grow,</p>
            <p className="stanza">one message,</p>
            <p className="stanza">one light,</p>
            <p className="stanza gold">one heart at a time.</p>
          </div>

          <hr className="rule-gold reveal" />

          <div className={`${styles.ctaBlock} reveal`}>
            <p className={styles.ctaLines}>
              Your message matters.
              <br />
              Your light matters.
            </p>
            <Link to="/gratitude" className="btn">
              Become a Messenger of Gratitude
            </Link>
            <p className={styles.ctaSub}>A living archive of appreciation.</p>
          </div>
        </div>
      </section>

      <div className="bridge-to-midnight" aria-hidden="true" />

      {/* ── Movement 3 — Midnight Wonder (Living Constellation) ── */}
      <section className="section midnight" aria-label="The Living Constellation of Light">
        <div className="inner wide">
          <h2 className="section-h">The Living Constellation of Light</h2>
          <p className={`poetic italic ${styles.heroSub} reveal`}>A preview of what is emerging.</p>

          <hr className="rule-gold reveal" />

          <div className={`${styles.stanzaGroup} reveal`}>
            <p className="stanza">Every act of gratitude leaves a trace.</p>
            <p className="stanza gold">Every trace becomes a light.</p>
          </div>

          <div className={`${styles.imageFull} reveal`}>
            <span className={styles.imageLabel}>The Living Constellation</span>
          </div>

          <div className={`${styles.paraGroup} reveal`}>
            <p className="poetic">
              Together, we are gently bringing into presence a new expression of human gratitude —
              something the world has never experienced before.
            </p>
            <p className="poetic">Your light becomes part of the first Living Constellation.</p>
          </div>

          <div className={`${styles.ctaBlock} reveal`}>
            <p className={styles.ctaLines}>
              Your message matters.
              <br />
              Your light matters.
            </p>
            <Link to="/gratitude" className="btn">
              Become a Messenger of Gratitude
            </Link>
          </div>
        </div>
      </section>

      <div className="bridge-to-light" aria-hidden="true" />

      {/* ── Movement 4 — Ivory Return (The Unveiling) ── */}
      <section className="section light" aria-label="The Unveiling">
        <div className="inner">
          <h2 className="section-h">The Unveiling</h2>
          <p className={`hero-sub ${styles.heroSub} reveal`}>A moment the world will share.</p>
          <p className="stanza reveal">Where gratitude becomes presence.</p>

          <hr className="rule-gold reveal" />

          <div className={`${styles.paraGroup} reveal`}>
            <p className="poetic">
              On 26 November 2026, Tina Turner’s birthday, the first edition of the Book of Gratitude
              will be ceremonially opened in Küsnacht, Switzerland — her adopted home.
            </p>
            <p className="poetic">
              What begins today as individual expressions of gratitude will, on that evening, become
              one living work of art.
            </p>
          </div>

          <div className={`${styles.stanzaGroup} reveal`}>
            <p className="stanza">Thousands of voices.</p>
            <p className="stanza">One shared heart.</p>
            <p className="stanza gold">One memorable moment.</p>
          </div>

          <div className={`${styles.paraGroup} reveal`}>
            <p className="poetic">
              The Living Constellation of Light will be revealed for the very first time — where every
              message of gratitude becomes a point of light within one shared, luminous whole.
            </p>
            <p className="poetic">
              At the heart of the evening stands Sharon Davson — Guardian of the Book of Gratitude.
            </p>
            <p className="poetic">
              The ceremony will unfold beside Lake Zurich — and through a global livestream, the world
              is invited.
            </p>
          </div>
          <a className={`${styles.learnMore} reveal`} href="#">
            Learn more →
          </a>

          <hr className="rule-gold reveal" />

          <div className={`${styles.stanzaGroup} reveal`}>
            <p className="gratitude-line">Your words have the power to become light.</p>
            <p className="stanza">Perhaps your light will be one of the first.</p>
          </div>
        </div>
      </section>

      {/* ── Section 6 — The Circle (narrative close + Our Gratitude) ── */}
      <TheCircle />

      <Footer />
    </main>
  )
}
