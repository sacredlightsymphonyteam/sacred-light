import { useState } from 'react'
import styles from './Hero.module.css'

/**
 * Hero video figure — landscape stage with the poster and the Tina quote
 * overlaid; the film loads on a deliberate play (so the music plays with the
 * tap), via the privacy-friendly youtube-nocookie domain.
 */
const YOUTUBE_ID = '9NawTQNF5F8' // "TINA SWIRLS with Music @ Bob Gruen Square"
const POSTER_SRC = '/hero-poster.jpg'

export default function Hero() {
  const [playing, setPlaying] = useState(false)
  const [posterFailed, setPosterFailed] = useState(false)
  const canPlay = YOUTUBE_ID.length > 0

  return (
    <figure className={styles.figure}>
      <div className={styles.frame}>
        {playing && canPlay ? (
          <iframe
            className={styles.video}
            src={`https://www.youtube-nocookie.com/embed/${YOUTUBE_ID}?autoplay=1&rel=0&playsinline=1`}
            title="Sacred Light Symphony — Tina Swirls"
            allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <>
            {!posterFailed && (
              <img
                className={styles.poster}
                src={POSTER_SRC}
                alt="Tina Turner amid swirling golden light"
                onError={() => setPosterFailed(true)}
              />
            )}

            {canPlay && (
              <button
                type="button"
                className={styles.play}
                onClick={() => setPlaying(true)}
                aria-label="Play the film"
              >
                <span className={styles.playGlyph} aria-hidden="true" />
              </button>
            )}
          </>
        )}
      </div>
    </figure>
  )
}
