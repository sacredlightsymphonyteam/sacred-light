import { useEffect, useState } from 'react'
import { getFeaturedMessage, type FeaturedMessage } from '../../lib/supabase'
import styles from './TodaysLight.module.css'

/**
 * ONE LIGHT FROM THE BOOK OF GRATITUDE (Section 2b, ivory).
 *
 * Shows the message an admin has marked as "featured" (chosen in the dashboard).
 * Until one is featured — or if the backend isn't reachable — it falls back to
 * Marie's letter, the first light. Admins rotate the featured message from
 * /admin, so publishing a new One Light is a one-click action (no code change).
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
            <>
              {featured.featured_date && (
                <p className={styles.date}>{formatDate(featured.featured_date)}</p>
              )}
              <div className={styles.letter}>
                {featured.title && <p className={styles.featuredTitle}>{featured.title}</p>}
                {splitParagraphs(featured.message).map((para, i) => (
                  <p key={i} className={styles.featuredMsg}>
                    {renderGold(para)}
                  </p>
                ))}
                <p className={styles.featuredAttr}>
                  {featured.name}
                  {featured.location ? ` · ${featured.location}` : ''}
                </p>
              </div>
            </>
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

/**
 * Split a submitted message into paragraphs on blank lines, so it renders with
 * the same paragraph rhythm as Marie's letter. Single line breaks within a
 * paragraph are preserved by CSS (white-space: pre-line). Falls back to the
 * whole message as one paragraph when there are no blank lines.
 */
function splitParagraphs(text: string): string[] {
  const parts = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
  return parts.length ? parts : [text.trim()]
}

/**
 * Render a paragraph, turning any text wrapped in **double asterisks** gold.
 * Lets a curator choose which lines are gold per message (title + name are
 * always gold via the template); everything else stays charcoal.
 */
function renderGold(text: string) {
  // Split on **…** keeping the captured inner text; odd indices are the matches.
  return text.split(/\*\*(.+?)\*\*/gs).map((part, i) =>
    i % 2 === 1 ? (
      <span key={i} className={styles.goldText}>
        {part}
      </span>
    ) : (
      part
    ),
  )
}
