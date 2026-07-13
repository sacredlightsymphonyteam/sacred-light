import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import TopBanner from '../../components/TopBanner/TopBanner'
import ConstellationField from '../../components/ConstellationField/ConstellationField'
import ConstellationPanel from '../../components/ConstellationPanel/ConstellationPanel'
import Footer from '../../components/Footer/Footer'
import Seo from '../../components/Seo/Seo'
import { SITE_URL } from '../../lib/site'
import type { ConstellationLight } from '../../lib/supabase'
import styles from './Constellation.module.css'

/** Only the first 468 lights (18×26) get the one-time owner welcome. */
const WELCOME_MAX = 468

/**
 * The Living Constellation of Light (Phase 2).
 * STATE 1 (first arrival): the immersive field + title + invitation.
 * STATE 2 (exploration): hover a point for a name/country tooltip; click to
 * open its message panel while the field dims behind.
 * STATE 3 (personal URL `/constellation/light-XXXX`): the field zooms in to
 * that point and its panel opens automatically, with share + invite; the
 * contributor's first arrival (via the approval-email `?welcome` link) also
 * shows a one-time welcome banner.
 */
export default function Constellation() {
  const { ref } = useParams()
  const focusReference = ref ? ref.toUpperCase() : null // e.g. "LIGHT-0001"

  const [selected, setSelected] = useState<ConstellationLight | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [showWelcome, setShowWelcome] = useState(false)
  const [isOwner, setIsOwner] = useState(false)
  const [released, setReleased] = useState(false) // zoom back out after viewing your light

  const shareUrl = focusReference ? `${SITE_URL}/constellation/${focusReference.toLowerCase()}` : ''

  // Reset the release flag if the URL points at a different light.
  useEffect(() => setReleased(false), [focusReference])

  // Owner detection + one-time welcome (gated to the first WELCOME_MAX lights).
  useEffect(() => {
    if (!focusReference) return
    const num = parseInt(focusReference.replace(/\D/g, ''), 10) || 0
    const key = `slc_welcomed_${focusReference}`
    const already = localStorage.getItem(key) === '1'
    const params = new URLSearchParams(window.location.search)
    const hasWelcome = params.has('welcome')
    const eligible = num > 0 && num <= WELCOME_MAX

    // This browser owns the light if it's been welcomed before, or is arriving
    // now with the one-time marker. Friends open the clean URL and never match.
    setIsOwner(already || (hasWelcome && eligible))

    if (hasWelcome && eligible && !already) {
      setShowWelcome(true)
      localStorage.setItem(key, '1')
      const t = setTimeout(() => setShowWelcome(false), 5000)
      // Strip ?welcome so a refresh or a copied link stays clean.
      params.delete('welcome')
      const qs = params.toString()
      window.history.replaceState({}, '', `${window.location.pathname}${qs ? `?${qs}` : ''}`)
      return () => clearTimeout(t)
    }
    if (hasWelcome) {
      params.delete('welcome')
      const qs = params.toString()
      window.history.replaceState({}, '', `${window.location.pathname}${qs ? `?${qs}` : ''}`)
    }
  }, [focusReference])

  const onFocusReady = useCallback((light: ConstellationLight | null) => {
    if (light) setSelected(light)
    else setNotFound(true)
  }, [])

  // The panel is "personal" only when the open light is the focused one.
  const personal =
    selected && focusReference && selected.light_reference.toUpperCase() === focusReference
      ? { shareUrl, isOwner }
      : undefined

  return (
    <main>
      <Seo
        title="The Living Constellation of Light — Sacred Light Symphony"
        description="A growing field of light — one point for every message of gratitude in the Book of Gratitude."
        path="/constellation"
        image={`${SITE_URL}/hero-poster.jpg`}
      />

      <TopBanner />

      <section className={styles.stage} aria-label="The Living Constellation of Light">
        <div className={styles.fieldWrap}>
          <ConstellationField
            onSelect={setSelected}
            dimmed={selected !== null}
            focusRef={released ? null : focusReference}
            onFocusReady={onFocusReady}
          />
        </div>

        <div className={styles.top}>
          <h1 className={`section-h swirl ${styles.title}`}>The Living Constellation of Light</h1>
          <p className={styles.subtitle}>Each point of light carries a message of gratitude.</p>
        </div>

        <div className={styles.invite}>
          <p className={styles.inviteLines}>
            Your message matters.
            <br />
            Your light matters.
          </p>
          <Link to="/gratitude" className="sls-cta">
            Become a Messenger of Gratitude
          </Link>
        </div>

        {showWelcome && (
          <div className={styles.welcome} role="status">
            ✨ Welcome. Your light is among the first to illuminate the Living Constellation.
          </div>
        )}

        {notFound && (
          <div className={styles.notFound} role="status">
            <p className={styles.notFoundLead}>We couldn&rsquo;t find that light.</p>
            <p className={styles.notFoundBody}>
              Check the link in your approval email, or{' '}
              <Link to="/gratitude">add your light</Link>.
            </p>
          </div>
        )}
      </section>

      {selected && (
        <ConstellationPanel
          light={selected}
          onClose={() => {
            if (personal) setReleased(true)
            setSelected(null)
          }}
          personal={personal}
        />
      )}

      <Footer />
    </main>
  )
}
