import type { ReactNode } from 'react'
import styles from './FeaturedLight.module.css'

/**
 * The inner content of a "One Light" featured message, rendered identically on
 * the homepage and in the admin preview (single source of truth).
 *
 * When `html` is present (curated in the admin WYSIWYG editor) it is rendered
 * through a SAFE parser that only ever emits known elements — bold, italic,
 * gold spans, and line breaks. Unknown tags/attributes are dropped, so there's
 * no HTML injection and no dependency. Otherwise it falls back to the plain
 * title / message / name fields (title + name gold, message charcoal).
 */
export const GOLD_RGB = 'rgb(183, 154, 99)' // --w-gold, what the editor's Gold applies

export type FeaturedContent = {
  title?: string | null
  message?: string | null
  name?: string | null
  date?: string
  html?: string | null
}

export default function FeaturedLight({ title, message, name, date, html }: FeaturedContent) {
  if (html && html.trim()) {
    return (
      <>
        {date && <p className={styles.date}>{date}</p>}
        <div className={styles.displayBody}>{renderHtml(html)}</div>
      </>
    )
  }

  return (
    <>
      {date && <p className={styles.date}>{date}</p>}
      {title && <p className={styles.title}>{title}</p>}
      <div className={styles.body}>
        {splitParagraphs(message ?? '').map((para, i) => (
          <p key={i} className={styles.msg}>
            {para}
          </p>
        ))}
      </div>
      {name && <p className={styles.attr}>{name}</p>}
    </>
  )
}

/** Split on blank lines into paragraphs (line breaks within kept via CSS). */
export function splitParagraphs(text: string): string[] {
  const parts = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
  return parts.length ? parts : [text.trim()]
}

/** Is this element gold (coloured by the editor's Gold button)? */
export function isGold(el: HTMLElement): boolean {
  const c = el.style.color || el.getAttribute('color') || ''
  return c.replace(/\s+/g, ' ').toLowerCase() === GOLD_RGB || c.toLowerCase() === '#b79a63'
}

/**
 * Parse a stored HTML string into React nodes, keeping ONLY bold / italic /
 * gold / line breaks / blocks. Everything else becomes plain text. Client-only
 * (uses DOMParser); the featured content is fetched client-side, so this never
 * runs during the static build.
 */
export function renderHtml(html: string): ReactNode[] {
  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') return [html]
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html')
  return walk(doc.body)
}

function walk(node: Node): ReactNode[] {
  const out: ReactNode[] = []
  node.childNodes.forEach((child, i) => {
    if (child.nodeType === Node.TEXT_NODE) {
      out.push(child.textContent)
      return
    }
    if (child.nodeType !== Node.ELEMENT_NODE) return
    const el = child as HTMLElement
    const tag = el.tagName
    const kids = walk(el)
    if (tag === 'B' || tag === 'STRONG') out.push(<strong key={i}>{kids}</strong>)
    else if (tag === 'I' || tag === 'EM') out.push(<em key={i}>{kids}</em>)
    else if (tag === 'BR') out.push(<br key={i} />)
    else if (tag === 'DIV' || tag === 'P') out.push(<div key={i}>{kids}</div>)
    else if (isGold(el)) out.push(<span key={i} className={styles.gold}>{kids}</span>)
    else out.push(<span key={i}>{kids}</span>) // strip any other styling, keep text
  })
  return out
}
