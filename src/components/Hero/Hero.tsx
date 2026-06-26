import { useState } from 'react'
import styles from './Hero.module.css'

/**
 * The Threshold.
 *
 * Not a header — a doorway. A framed video stage shows the poster artwork clean
 * (no overlay); the Vimeo film loads only on a deliberate play.
 *
 * Placeholders until final assets arrive:
 *   - VIMEO_ID:  set once Jonell uploads the final film to Vimeo.
 *   - /hero-poster.jpg: the Bob Gruen artwork (no quote). The final artwork with
 *     the quote integrated will replace it. Until then a soft gold-on-dark stage
 *     stands in gracefully if the image is missing.
 */
const VIMEO_ID = '' // e.g. '123456789' — supplied next week
const POSTER_SRC = '/hero-poster.jpg'

export default function Hero() {
  const [playing, setPlaying] = useState(false)
  const [posterFailed, setPosterFailed] = useState(false)

  const canPlay = VIMEO_ID.length > 0

  return (
    <section className={styles.stage} aria-label="Sacred Light Symphony">
      <div className={styles.frame}>
        {playing && canPlay ? (
          <iframe
            className={styles.video}
            src={`https://player.vimeo.com/video/${VIMEO_ID}?autoplay=1&title=0&byline=0&portrait=0`}
            title="Sacred Light Symphony"
            allow="autoplay; fullscreen; picture-in-picture"
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
    </section>
  )
}
