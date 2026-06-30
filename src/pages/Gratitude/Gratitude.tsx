import TopBanner from '../../components/TopBanner/TopBanner'
import GratitudeForm from '../../components/GratitudeForm/GratitudeForm'
import Seo from '../../components/Seo/Seo'
import styles from './Gratitude.module.css'

/**
 * Share Your Light — the Book of Gratitude contribution funnel (Phase 1).
 * Charcoal "gallery" page continuing the register of Section 2.
 */
export default function Gratitude() {
  return (
    <main className={styles.page}>
      <Seo
        title="Share Your Light — Sacred Light Symphony"
        description="Leave a word of gratitude — it becomes a star in the living constellation of the Book of Gratitude."
        path="/gratitude"
      />
      <TopBanner />

      <section className={styles.intro} aria-label="Share Your Light">
        <p className={styles.tagline}>Become a Messenger of Light</p>
        <h1 className={styles.heading}>Share Your Light</h1>
        <p className={styles.lead}>
          Leave a word of gratitude. It will become a star in the field.
        </p>
      </section>

      <div className={styles.formWrap}>
        <GratitudeForm />
      </div>
    </main>
  )
}
