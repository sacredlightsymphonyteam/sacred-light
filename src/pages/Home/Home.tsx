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
  sameAs: [
    'https://www.instagram.com/sacredlightsymphony/',
    'https://www.facebook.com/SacredLightSymphony',
    'https://www.youtube.com/@SacredLightSymphony',
  ],
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

        {/* Three words — stacked, widely spaced, timeless. On load they breathe
            in one at a time (soft fade, no movement) — a revelation, not motion. */}
        <div className={styles.words} aria-label="Presence, Power, Light">
          <span className={`${styles.word} ${styles.appear}`} style={{ animationDelay: '0.4s' }}>
            Presence
          </span>
          <span
            className={`${styles.wordRule} ${styles.appear}`}
            style={{ animationDelay: '0.75s' }}
            aria-hidden="true"
          />
          <span className={`${styles.word} ${styles.appear}`} style={{ animationDelay: '1.1s' }}>
            Power
          </span>
          <span
            className={`${styles.wordRule} ${styles.appear}`}
            style={{ animationDelay: '1.45s' }}
            aria-hidden="true"
          />
          <span className={`${styles.word} ${styles.appear}`} style={{ animationDelay: '1.8s' }}>
            Light
          </span>
        </div>

        <p className={`${styles.heroPhrase} reveal`}>
          With gratitude for a life
          <br />
          that still moves through us.
        </p>

        <div className={styles.heroCta}>
          <Link to="/gratitude" className="sls-cta">
            Become a Messenger of Gratitude
          </Link>
        </div>
      </section>

      <div className="bridge-to-dark" aria-hidden="true" />

      {/* ── Movement 2 — Charcoal Reflection (Book of Gratitude) ── */}
      <section className="section dark" aria-label="The Book of Gratitude">
        <div className="inner">
          <h2 className="section-h reveal">A space for gratitude</h2>
          <p className={`poetic-sub gold ${styles.heroSub} reveal`}>
            Not spoken,
            <br />
            but held
          </p>

          <div className={`${styles.stanzaGroup} ${styles.bigStanza} ${styles.forWhat} reveal`}>
            <p className="stanza">For what was given</p>
            <p className="stanza">For what was lived</p>
            <p className="stanza">For what remains</p>
            <p className="stanza">For what still moves us</p>
          </div>

          <hr className="rule-gold reveal" />

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

        <figure className={`${styles.bookFigure} reveal`}>
          <img
            className={styles.bookImage}
            src="/tina-in-blue.jpg"
            alt="Tina Turner in silhouette against a cross of blue stage light — photograph by Bob Gruen"
            width={1920}
            height={1080}
            loading="lazy"
          />
        </figure>

        <div className="inner">
          <blockquote className={`${styles.quote} reveal`}>
            “When everything is so dark,
            <br />
            you have to find some way
            <br />
            to make the light.”
            <cite className={styles.quoteCite}>~ Tina Turner</cite>
          </blockquote>
        </div>
      </section>

      {/* Charcoal dissolves into ivory — the breath before One Light */}
      <div className="bridge-to-light" aria-hidden="true" />

      {/* ── Section 2b — One Light from the Book of Gratitude (framed, ivory) ── */}
      <TodaysLight />

      {/* Ivory dissolves back into charcoal */}
      <div className="bridge-to-dark" aria-hidden="true" />

      {/* ── The Book of Gratitude, continued — charcoal, flowing into the Constellation ── */}
      <section className="section dark" aria-label="The Book of Gratitude, continued">
        <div className="inner">
          <h2 className="section-h swirl reveal">The Book of Gratitude</h2>
          <p className={`poetic-sub gold ${styles.heroSub} reveal`}>
            Let your light join thousands of hearts around the world.
          </p>

          <div className={`${styles.paraGroup} reveal`}>
            <p className="poetic">
              Join a growing community from around the world in sharing your message of gratitude.
            </p>
            <p className="poetic">
              Share a memory, a reflection, a poem, a song, a photograph, a work of art, or simply a
              few heartfelt words expressing what Tina awakened in you — and the light you now choose
              to pass on to others.
            </p>
            <p className="poetic-sub gold-glow">
              A Carefully Curated Living Archive of Human Gratitude
            </p>
            <p className="poetic">
              Each contribution finds its place within this Living Archive and is represented by a
              single point of light. Together, we co-create the Living Constellation of Light — a
              growing visual expression of collective gratitude, connecting hearts across continents,
              cultures, and generations.
            </p>
            <p className={`poetic ${styles.goldNote}`}>
              The first edition of the Book of Gratitude will be ceremonially unveiled on 26 November
              2026, Thanksgiving and Tina Turner’s birthday, following the ceremonial opening of the
              Book of Gratitude beside Lake Zurich in Küsnacht, Switzerland, the place Tina called home
              for more than two decades.
            </p>
          </div>

          <div className={`${styles.stanzaGroup} ${styles.bigStanza} reveal`}>
            <p className="stanza">Until then,</p>
            <p className="stanza">the constellation continues to grow,</p>
            <p className="stanza gold">one message,</p>
            <p className="stanza gold">one light,</p>
            <p className="stanza gold">one heart at a time.</p>
          </div>

          <hr className="rule-gold reveal" />

          <div className={`${styles.ctaBlock} reveal`}>
            <p className={styles.ctaLines}>
              Your message matters.
              <br />
              Your light matters.
            </p>
            <Link to="/gratitude" className="sls-cta">
              Become a Messenger of Gratitude
            </Link>
            <p className={`poetic-sub gold-glow ${styles.ctaSub}`}>A Living Archive of Appreciation</p>

            <div className={`${styles.words} ${styles.wordsMid}`} aria-label="Gratitude, Light, Resonance">
              <span className={`${styles.word} reveal fade-soft`} style={{ transitionDelay: '0ms' }}>
                Gratitude
              </span>
              <span
                className={`${styles.wordRule} reveal fade-soft`}
                style={{ transitionDelay: '400ms' }}
                aria-hidden="true"
              />
              <span className={`${styles.word} reveal fade-soft`} style={{ transitionDelay: '800ms' }}>
                Light
              </span>
              <span
                className={`${styles.wordRule} reveal fade-soft`}
                style={{ transitionDelay: '1200ms' }}
                aria-hidden="true"
              />
              <span
                className={`${styles.word} reveal fade-soft`}
                style={{ transitionDelay: '1600ms' }}
              >
                Resonance
              </span>
            </div>
          </div>
        </div>
      </section>

      <div className="bridge-to-midnight" aria-hidden="true" />

      {/* ── Movement 3 — Midnight Wonder (Living Constellation) ── */}
      <section
        id="constellation"
        className="section midnight"
        aria-label="The Living Constellation of Light"
      >
        <div className="inner wide">
          <h2 className="section-h swirl">The Living Constellation of Light</h2>
          <p className={`poetic-sub gold ${styles.heroSub} reveal`}>A preview of what is emerging</p>

          <hr className="rule-gold reveal" />

          <div className={`${styles.stanzaGroup} ${styles.bigStanza} reveal`}>
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
            <p className="poetic gold">Your light becomes part of the first Living Constellation.</p>
          </div>

          <div className={`${styles.ctaBlock} reveal`}>
            <p className={styles.ctaLines}>
              Your light matters.
              <br />
              Your light lives on.
            </p>
            <Link to="/gratitude" className="sls-cta">
              Become a Messenger of Gratitude
            </Link>
          </div>
        </div>
      </section>

      <div className="bridge-to-light" aria-hidden="true" />

      {/* ── Movement 4 — Ivory Return (The Unveiling) ── */}
      <section className="section light" aria-label="The Unveiling">
        <div className="inner">
          <h2 className="section-h swirl">The Unveiling</h2>
          <p className={`poetic-sub gold ${styles.heroSub} reveal`}>A moment the world will share,</p>
          <p className="poetic-sub gold reveal">where gratitude becomes presence.</p>

          <hr className="rule-gold reveal" />

          <div className={`${styles.paraGroup} reveal`}>
            <p className="poetic">
              On Thanksgiving, 26 November 2026 — Tina Turner’s birthday — Sacred Light Symphony will
              unfold beside Lake Zurich in Switzerland and be shared with Messengers of Gratitude
              around the world through a global livestream.
            </p>
          </div>

          <div className={`${styles.stanzaGroup} ${styles.spacedStanza} reveal`}>
            <p className="stanza">Thousands of hearts</p>
            <p className="stanza">One living constellation</p>
            <p className="stanza gold">A new expression of human gratitude</p>
          </div>

          <div className={`${styles.paraGroup} reveal`}>
            <p className="poetic">
              The first edition of the Book of Gratitude will be ceremonially opened in Küsnacht, the
              place Tina Turner chose as her home.
            </p>
            <p className="poetic">
              What begins today as individual expressions of gratitude will gently come together
              through a series of shared experiences, each offering a different expression of
              gratitude, connection and presence.
            </p>
            <p className="poetic">
              Artist Sharon Davson, Guardian of the Book of Gratitude, will invite guests to become
              part of a living collective artwork, celebrating joy, presence and unity through the
              universal language of art. Created together during the celebration, the artwork will
              remain as a lasting testament to our shared humanity.
            </p>
            <p className="poetic">
              The celebration will also invite people around the world to pause together in a shared
              moment of resonance, connecting hearts across continents through one simple, universal
              expression.
            </p>
          </div>
        </div>
      </section>

      {/* ── Section 6 — The Circle (narrative close + Our Gratitude) ── */}
      <TheCircle />

      <Footer />
    </main>
  )
}
