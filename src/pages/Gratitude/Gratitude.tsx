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
        title="Share Your Gratitude — Sacred Light Symphony"
        description="Share your message of gratitude — it becomes a light within the Living Constellation of the Book of Gratitude."
        path="/gratitude"
      />
      <TopBanner />

      <div className={styles.formWrap}>
        <GratitudeForm />
      </div>
    </main>
  )
}
