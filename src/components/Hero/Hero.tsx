import { useState } from 'react'
import styles from './Hero.module.css'

/**
 * Hero image figure — the Bob Gruen "Tina Swirling" artwork held in the
 * landscape frame. The click-to-play film was removed; this shows the still
 * image (as before) until the final video is provided.
 */
const POSTER_SRC = '/hero-poster.jpg'

export default function Hero() {
  const [posterFailed, setPosterFailed] = useState(false)

  return (
    <figure className={styles.figure}>
      <div className={styles.frame}>
        {!posterFailed && (
          <img
            className={styles.poster}
            src={POSTER_SRC}
            alt="Tina Turner amid swirling golden light"
            onError={() => setPosterFailed(true)}
          />
        )}
      </div>
    </figure>
  )
}
