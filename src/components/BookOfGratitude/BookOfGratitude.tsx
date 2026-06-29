import { Link } from 'react-router-dom'
import styles from './BookOfGratitude.module.css'

/**
 * Section 2 — The Book of Gratitude.
 *
 * "Charcoal Reflection" — like entering a quiet gallery. All copy below is the
 * approved wording from the 28 June brief and must not be altered. Sizes,
 * colours and spacing follow the brief; shared tokens live in global.css.
 *
 * Pending asset: the Bob Gruen "Tina in Blue" photograph. A graceful placeholder
 * stands in until it arrives — replace `.imagePlaceholder` with an <img>.
 */
export default function BookOfGratitude() {
  return (
    <section className={styles.section} aria-label="The Book of Gratitude">
      <div className={styles.topFade} aria-hidden="true" />

      {/* Hero lines */}
      <div className={styles.measure}>
        <h2 className={styles.heroLine1}>A space for gratitude.</h2>
        <p className={styles.heroLine2}>Not spoken, but held.</p>

        {/* Four poetic lines */}
        <div className={styles.poeticList}>
          <p className={styles.poeticLine}>For what was given.</p>
          <p className={styles.poeticLine}>For what was lived.</p>
          <p className={styles.poeticLine}>For what remains.</p>
          <p className={styles.poeticLine}>For what still moves.</p>
        </div>

        {/* Introduction */}
        <div className={styles.intro}>
          <p className={styles.para}>
            Inspired by Tina Turner’s enduring belief that even in life’s darkest
            moments we can choose the light, the first Book of Gratitude invites
            people from around the world to honour the gift she awakened within
            them — and the light they now choose to pass on.
          </p>
          <p className={styles.para}>
            Behind the voice that inspired millions was a woman who showed us that
            it is possible to move through darkness toward light.
          </p>
          <p className={`${styles.para} ${styles.paraClosing}`}>
            The Book of Gratitude is an invitation to continue that journey.
          </p>
        </div>
      </div>

      {/* Image — Bob Gruen · Tina in Blue (placeholder until the asset arrives) */}
      <div className={styles.imageWrap}>
        <div className={styles.imagePlaceholder}>
          <span className={styles.imageLabel}>Bob Gruen · Tina in Blue</span>
        </div>
      </div>

      {/* Tina Turner quote — the emotional heart */}
      <div className={styles.measure}>
        <blockquote className={styles.quote}>
          “When everything is so dark,
          <br />
          you have to find some way
          <br />
          to make the light.”
          <cite className={styles.quoteAttr}>~ Tina Turner</cite>
        </blockquote>

        {/* Invitation */}
        <div className={styles.invitation}>
          <p className={styles.para}>
            Join a growing community from around the world in sharing your message
            of gratitude.
          </p>
          <p className={styles.para}>
            Share a memory, a reflection, a poem, a song, a photograph, a work of
            art, or simply a few heartfelt words expressing what Tina Turner
            awakened in you — and the light you now choose to pass on to others.
          </p>
          <p className={styles.para}>
            This is a carefully curated Living Archive of human gratitude.
          </p>
          <p className={styles.para}>
            Each contribution finds its place within this Living Archive and is
            represented by a single point of light. Together, we co-create the
            Living Constellation of Light — a growing visual expression of
            collective gratitude, connecting hearts across continents, cultures,
            and generations.
          </p>
          <p className={styles.para}>
            The first edition of the Book of Gratitude will be gracefully designed
            and unveiled to the world on 26 November 2026, Tina Turner’s birthday,
            as the ceremonial opening of the Book of Gratitude takes place in
            Küsnacht, Switzerland.
          </p>
        </div>

        {/* Poetic bridge */}
        <div className={styles.bridge}>
          <p className={styles.bridgeLine}>Until then,</p>
          <p className={styles.bridgeLine}>the constellation continues to grow,</p>
          <p className={styles.bridgeLine}>one message,</p>
          <p className={styles.bridgeLine}>one light,</p>
          <p className={`${styles.bridgeLine} ${styles.bridgeFinal}`}>
            one heart at a time.
          </p>
        </div>

        {/* CTA */}
        <div className={styles.ctaBlock}>
          <p className={styles.ctaLine}>Your message matters.</p>
          <p className={styles.ctaLine}>Your light matters.</p>
          <div className={styles.ctaButtonWrap}>
            <Link to="/gratitude" className="sls-cta">
              Become a Messenger of Gratitude
            </Link>
          </div>
          <p className={styles.ctaSubtitle}>A living archive of appreciation.</p>
        </div>
      </div>
    </section>
  )
}
