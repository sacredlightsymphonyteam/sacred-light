import styles from './Hero.module.css'

/**
 * Hero film — a muted, looping background video in the landscape frame, for
 * comparing the video treatment against the still image. Uses the privacy-
 * friendly youtube-nocookie domain.
 */
const YOUTUBE_ID = 'V2LsGyovTsE'

export default function Hero() {
  return (
    <figure className={styles.figure}>
      <div className={styles.frame}>
        <iframe
          className={styles.video}
          src={`https://www.youtube-nocookie.com/embed/${YOUTUBE_ID}?autoplay=1&mute=1&loop=1&playlist=${YOUTUBE_ID}&controls=0&rel=0&playsinline=1&modestbranding=1`}
          title="Sacred Light Symphony — hero film"
          allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
          allowFullScreen
        />
      </div>
    </figure>
  )
}
