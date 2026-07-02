import styles from './Footer.module.css'

/**
 * The Footer — a slim, dark closing bar (not a section). Social links, email,
 * the closing mark, and an auto-updating copyright line. Copy verbatim from the
 * Circle + Footer brief.
 *
 * Social URLs are placeholders (#) until Angel provides them; each opens in a
 * new tab.
 */
const SOCIALS: { label: string; href: string }[] = [
  { label: 'Instagram', href: '#' },
  { label: 'Facebook', href: '#' },
  { label: 'LinkedIn', href: '#' },
  { label: 'YouTube', href: '#' },
]

const EMAIL = 'sacredlightsymphony@protonmail.com'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className={styles.footer}>
      <nav className={styles.socials} aria-label="Social links">
        {SOCIALS.map((s, i) => (
          <span key={s.label}>
            {i > 0 && <span className={styles.sep}> · </span>}
            <a className={styles.social} href={s.href} target="_blank" rel="noopener noreferrer">
              {s.label}
            </a>
          </span>
        ))}
      </nav>

      <a className={styles.email} href={`mailto:${EMAIL}`}>
        {EMAIL}
      </a>

      <p className={styles.closing}>Presence · Light · Resonance</p>

      <p className={styles.copyright}>
        © {year} Sacred Light Symphony · A Seeds 4 The Future Initiative · Created on the shores of
        Lake Zurich, Switzerland
      </p>
    </footer>
  )
}
