import { useEffect, useState } from 'react'
import { getFeaturedMessage, type FeaturedMessage } from '../../lib/supabase'
import FeaturedLight from '../FeaturedLight/FeaturedLight'
import styles from './TodaysLight.module.css'

/**
 * ONE LIGHT FROM THE BOOK OF GRATITUDE (Section 2b, ivory).
 *
 * Shows the admin-featured message (rendered by the shared FeaturedLight, so it
 * matches the admin preview exactly). Falls back to Marie's letter when nothing
 * is featured or the backend isn't reachable. Admins rotate/format the featured
 * message from /admin — publishing a new One Light is a one-click action.
 */
export default function TodaysLight() {
  const [featured, setFeatured] = useState<FeaturedMessage | null>(null)

  useEffect(() => {
    let active = true
    void getFeaturedMessage().then((m) => {
      if (active) setFeatured(m)
    })
    return () => {
      active = false
    }
  }, [])

  return (
    <section className="section light" aria-label="One Light from the Book of Gratitude">
      <div className="inner">
        <h2 className="section-h swirl reveal">
          One Light
          <br />
          from the
          <br />
          Book of Gratitude
        </h2>

        <figure className={`${styles.frame} reveal`}>
          {featured ? (
            <FeaturedLight
              title={featured.title}
              message={featured.message}
              name={featured.name}
              html={featured.featured_html}
              date={featured.featured_date ? formatDate(featured.featured_date) : undefined}
            />
          ) : (
            <>
              <p className={styles.date}>4 July 2026</p>
              <div className={styles.letter}>
                <p>Dearest Tina,</p>
                <p>
                  Thank you for living your calling, for the songs you gave to the world, for the quiet
                  invitations you left behind…
                </p>
                <p className={styles.verse}>
                  To choose the Light…
                  <br />
                  To become the Light…
                  <br />
                  To dance…
                </p>
                <p>
                  May the Book of Gratitude become a home for countless hearts and may every message
                  entrusted to it carry your invitation a little further into the world.
                </p>
                <p className={styles.sign}>
                  Sharing your Light,
                  <br />
                  With joy, love and gratitude,
                  <span className={styles.signName}>Marie</span>
                </p>
              </div>
            </>
          )}
        </figure>

        <div className={`${styles.trio} reveal`}>
          <p>One message</p>
          <p>One heart</p>
          <p>One light</p>
        </div>
      </div>
    </section>
  )
}

/** e.g. "7 July 2026" */
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}
