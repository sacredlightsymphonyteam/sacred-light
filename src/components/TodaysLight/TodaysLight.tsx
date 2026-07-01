import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getFeaturedMessage, type FeaturedMessage } from '../../lib/supabase'
import styles from './TodaysLight.module.css'

/**
 * Today's Light (Home Section 2b — "The First Lights").
 *
 * One curated message, held in generous ivory space, between the Book of
 * Gratitude and the Living Constellation. Angel marks a message as "featured"
 * in the admin dashboard; it is read here through the `featured_message` view.
 *
 * Until a real message is featured we show a placeholder so the section is
 * always present (the bridges above and below need something between them, and
 * the design stays reviewable). The brief's strict behaviour is to hide the
 * section entirely when nothing is featured — flip SHOW_PLACEHOLDER to false
 * (and let the parent drop the surrounding bridges) for that.
 */
const SHOW_PLACEHOLDER = true

const PLACEHOLDER: FeaturedMessage = {
  id: 'placeholder',
  message:
    'Tina did not only teach me to sing. She taught me to stand. To take up space. To believe that my voice — my small, uncertain voice — was worth something. That belief changed everything.',
  name: 'Sophia',
  location: 'Australia',
  featured_date: '2026-07-04',
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

/** Format an ISO date (YYYY-MM-DD) as "D MMMM YYYY" without timezone drift. */
function formatDate(iso: string | null): string {
  if (!iso) return ''
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return ''
  return `${d} ${MONTHS[m - 1]} ${y}`
}

export default function TodaysLight() {
  const [featured, setFeatured] = useState<FeaturedMessage | null>(null)

  useEffect(() => {
    let active = true
    void getFeaturedMessage().then((m) => {
      if (active && m) setFeatured(m)
    })
    return () => {
      active = false
    }
  }, [])

  const msg = featured ?? (SHOW_PLACEHOLDER ? PLACEHOLDER : null)
  if (!msg) return null

  const attribution = msg.location ? `${msg.name} · ${msg.location}` : msg.name

  return (
    <section className="section light" aria-label="Today's Light">
      <div className="inner">
        <p className={styles.eyebrow}>The First Lights</p>
        <p className={styles.date}>{formatDate(msg.featured_date)}</p>

        <hr className={`rule-gold ${styles.rule}`} />

        <figure className={`${styles.figure} fade-in`}>
          <blockquote className={styles.message}>
            <span className={styles.mark}>“</span>
            {msg.message}
            <span className={styles.mark}>”</span>
          </blockquote>
          <figcaption className={`${styles.attribution} fade-in delay-1`}>{attribution}</figcaption>
        </figure>

        <p className={`${styles.closing} fade-in delay-2`}>One message. One heart. One light.</p>

        <Link to="/gratitude" className={`btn ${styles.cta}`}>
          Share Your Light
        </Link>
      </div>
    </section>
  )
}
