import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getVisibleCredits, type CreditRow } from '../../lib/supabase'
import styles from './TheCircle.module.css'

/**
 * Section 6 — The Circle. Two halves that flow as one: the narrative close,
 * then Our Gratitude (the credits). Copy verbatim from the Circle brief.
 *
 * Credits render from the Supabase `credits` table (admin-editable). The
 * built-in list below is the fallback / pre-render seed, so the section is
 * correct on first paint and without a backend.
 */
type CreditName = { name: string; role?: string; tba?: boolean }
type Tier = { slug: string; label: string; names: CreditName[] }

/** Group flat credit rows (already tier/insert ordered) into display tiers. */
function groupCredits(rows: CreditRow[]): Tier[] {
  const tiers: Tier[] = []
  for (const r of rows) {
    let tier = tiers[tiers.length - 1]
    if (!tier || tier.slug !== r.tier_slug) {
      tier = { slug: r.tier_slug, label: r.tier_name, names: [] }
      tiers.push(tier)
    }
    tier.names.push({ name: r.name, role: r.role ?? undefined, tba: r.is_placeholder })
  }
  return tiers
}

const FALLBACK_TIERS: Tier[] = [
  {
    slug: 'founding-voices',
    label: 'Founding Voices',
    names: [
      { name: 'Bob Gruen', role: 'Photographer' },
      { name: 'Rob Verhorst', role: 'Photographer' },
      { name: 'Markus Ernst', role: 'Mayor of Küsnacht' },
    ],
  },
  {
    slug: 'creative-collaborators',
    label: 'Creative Collaborators',
    names: [{ name: 'Serena Russignan & Mike Sommer' }],
  },
  {
    slug: 'artists-of-light',
    label: 'Artists of Light',
    names: [{ name: 'Sharon Davson', role: 'Guardian of the Book of Gratitude' }],
  },
  {
    slug: 'founding-partners',
    label: 'Founding Partners',
    names: [{ name: 'To be announced.', tba: true }],
  },
]

export default function TheCircle() {
  // Reveal-on-scroll (incl. the staggered credit cascade) is handled site-wide
  // by useScrollReveal + the global `reveal` class (see global.css).
  const [tiers, setTiers] = useState<Tier[]>(FALLBACK_TIERS)

  useEffect(() => {
    let active = true
    void getVisibleCredits().then((rows) => {
      if (active && rows.length) setTiers(groupCredits(rows))
    })
    return () => {
      active = false
    }
  }, [])

  return (
    <section className={`section light ${styles.circle}`} aria-label="The Circle">
      <div className="inner">
        {/* ── Half 1 — the narrative close ── */}
        <p className={`section-h swirl ${styles.circleTitle} reveal`}>The Circle</p>
        <p className={`${styles.opening} reveal`}>The first light is only the beginning.</p>

        <hr className={`rule-gold short ${styles.openingRule}`} />

        <div className={styles.body}>
          <p className={`${styles.para} reveal`}>
            What begins with a single message of gratitude will continue to grow, one heart at a time.
          </p>
          <p className={`${styles.para} reveal`}>Each new contribution becomes another light.</p>
        </div>

        <div className={`${styles.bigLines} reveal`}>
          <p>Each new light becomes part of the Living Constellation.</p>
        </div>

        <div className={`${styles.bigLines} reveal`}>
          <p>Together, we are illuminating the world,</p>
          <p>one message,</p>
          <p>one heart,</p>
          <p>one light at a time.</p>
        </div>

        <div className={styles.body}>
          <p className={`${styles.para} reveal`}>
            Together, we are gently bringing into being a new way of expressing gratitude, inspired by
            Tina Turner’s enduring light and spirit, and shared by hearts around the world.
          </p>
        </div>

        <hr className={`rule-gold ${styles.divide}`} />

        {/* ── Half 2 — Our Gratitude (the credits) ── */}
        <p className={`section-h swirl ${styles.circleTitle} reveal`}>With Gratitude</p>
        <p className={`${styles.intro} reveal`}>
          Sacred Light Symphony extends its heartfelt appreciation to the artists, visionaries, patrons
          and friends whose generosity, creativity and trust have helped illuminate this journey from
          its very beginning,
        </p>

        {tiers.map((tier) => (
          <div key={tier.slug} className={styles.tier} data-tier={tier.slug}>
            <p className={`${styles.tierLabel} reveal`}>{tier.label}</p>
            <div className={styles.names}>
              {tier.names.map((n, i) => (
                <p
                  key={n.name}
                  className={`${styles.creditName} reveal ${n.tba ? styles.tba : ''}`}
                  style={{ transitionDelay: `${80 + i * 80}ms` }}
                >
                  {n.tba ? (
                    n.name
                  ) : (
                    <>
                      <span className={styles.nm}>{n.name}</span>
                      {n.role && (
                        <>
                          <span className={styles.sep}> · </span>
                          <span className={styles.role}>{n.role}</span>
                        </>
                      )}
                    </>
                  )}
                </p>
              ))}
            </div>
          </div>
        ))}

        {/* ── The Messengers line ── */}
        <hr className={`rule-gold short ${styles.short}`} />
        <p className={`${styles.messengers} reveal`}>
          …and to every Messenger of Gratitude
          <br />
          whose light continues to illuminate the Living Constellation.
        </p>

        {/* ── Invitation + closing benediction ── */}
        <div className={`${styles.circleCta} reveal`}>
          <Link to="/gratitude" className="sls-cta">
            Become a Messenger of Gratitude
          </Link>
        </div>
        <div className={styles.closing}>
          <p className={`poetic-sub gold-glow ${styles.closingPhrase} reveal`}>
            Where gratitude becomes light
          </p>
          <p className={`${styles.closingPass} reveal`}>
            May the light you received become the light you pass on.
          </p>
        </div>
      </div>
    </section>
  )
}
