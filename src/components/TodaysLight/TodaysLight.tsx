import styles from './TodaysLight.module.css'

/**
 * ONE LIGHT FROM THE BOOK OF GRATITUDE (Section 2b, ivory).
 *
 * A single framed message on the ivory surface. For launch this holds Marie's
 * letter — the first light. (Can become a dynamic featured message later.)
 */
export default function TodaysLight() {
  return (
    <section className="section light" aria-label="One Light from the Book of Gratitude">
      <div className="inner">
        <h2 className="section-h swirl reveal">
          One Light
          <br />
          from the Book of Gratitude
        </h2>

        <figure className={`${styles.frame} reveal`}>
          <p className={styles.date}>4 July 2026</p>
          <div className={styles.letter}>
            <p>Dearest Tina,</p>
            <p>
              Thank you for living your calling, for the songs you gave to the world, for the quiet
              invitations you left behind…
            </p>
            <p className={styles.verse}>
              To choose the light.
              <br />
              To become the light.
              <br />
              To dance…
            </p>
            <p>
              Your journey reminded me that every ending can become a beginning, that gratitude has
              the power to transform pain into presence and fear into faith.
            </p>
            <p>
              May this Book become a home for countless hearts, and may every message entrusted to it
              carry your invitation a little further into the world.
            </p>
            <p className={styles.sign}>
              Sharing your Light,
              <br />
              With joy and gratitude,
              <br />
              Marie
              <br />
              Switzerland
            </p>
          </div>
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
