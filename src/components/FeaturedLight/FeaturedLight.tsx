import type { ReactNode } from 'react'
import styles from './FeaturedLight.module.css'

/**
 * The inner content of a "One Light" featured message — title, message, name —
 * rendered identically wherever it's used (homepage + admin preview). The caller
 * provides the frame. Formatting is carried by lightweight tags in the text:
 *   [g]…[/g] gold · [b]…[/b] bold · [i]…[/i] italic
 * The admin toolbar inserts these around a selection, so no one types them and
 * there's no HTML injection (only known tags become known elements).
 *
 * Defaults: title + name are gold; the message is charcoal (wrap [g] for gold).
 */
export type FeaturedContent = {
  title?: string | null
  message: string
  name?: string | null
  location?: string | null
  date?: string
}

export default function FeaturedLight({ title, message, name, date }: FeaturedContent) {
  return (
    <>
      {date && <p className={styles.date}>{date}</p>}
      {title && <p className={styles.title}>{renderRich(title)}</p>}
      <div className={styles.body}>
        {splitParagraphs(message).map((para, i) => (
          <p key={i} className={styles.msg}>
            {renderRich(para)}
          </p>
        ))}
      </div>
      {name && <p className={styles.attr}>{renderRich(name)}</p>}
    </>
  )
}

/** Split on blank lines into paragraphs (line breaks within are kept via CSS). */
export function splitParagraphs(text: string): string[] {
  const parts = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
  return parts.length ? parts : [text.trim()]
}

/** Render [g]/[b]/[i] tags to gold spans / bold / italic. Safe (known tags only). */
export function renderRich(text: string): ReactNode[] {
  const out: ReactNode[] = []
  const re = /\[(g|b|i)\]([\s\S]*?)\[\/\1\]/g
  let last = 0
  let m: RegExpExecArray | null
  let k = 0
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index))
    const tag = m[1]
    const inner = m[2]
    if (tag === 'g') out.push(<span key={k} className={styles.gold}>{inner}</span>)
    else if (tag === 'b') out.push(<strong key={k}>{inner}</strong>)
    else out.push(<em key={k}>{inner}</em>)
    last = re.lastIndex
    k++
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}
