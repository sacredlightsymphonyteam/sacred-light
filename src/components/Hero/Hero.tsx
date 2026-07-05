import { useState } from 'react'
import styles from './Hero.module.css'

/**
 * Hero film — a poster with a quiet play button; clicking loads the film and
 * plays it with sound. Uses the privacy-friendly youtube-nocookie domain.
 */
const YOUTUBE_ID = 'QOK-Hy-68GI'

export default function Hero() {
  const [playing, setPlaying] = useState(false)

  return (
    <figure className={styles.figure}>
      <div className={styles.frame}>
        {playing ? (
          <iframe
            className={styles.video}
            src={`https://www.youtube-nocookie.com/embed/${YOUTUBE_ID}?autoplay=1&rel=0&playsinline=1&modestbranding=1`}
            title="Sacred Light Symphony — hero film"
            allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <button
            type="button"
            className={styles.playBtn}
            onClick={() => setPlaying(true)}
            aria-label="Play the film with sound"
          >
            <img className={styles.poster} src="/hero-poster.jpg" alt="" />
            <span className={styles.playIcon} aria-hidden="true">
              ▶
            </span>
          </button>
        )}
      </div>
    </figure>
  )
}
