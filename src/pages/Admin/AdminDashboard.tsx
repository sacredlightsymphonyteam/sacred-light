import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  supabase,
  CONTRIBUTIONS_TABLE,
  type ContributionRow,
  type ContributionStatus,
} from '../../lib/supabase'
import styles from './Admin.module.css'

type Filter = ContributionStatus | 'all' | 'in_book'

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'in_book', label: 'In book' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'all', label: 'All' },
]

const isImage = (url: string) => /\.(png|jpe?g|gif|webp|avif|svg)(\?|$)/i.test(url)

/** Moderation dashboard — review, approve/reject, and curate the Book. */
export default function AdminDashboard() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState<Filter>('pending')
  const [rows, setRows] = useState<ContributionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!supabase) {
      setError('Backend not connected. Set the Supabase environment variables.')
      setLoading(false)
      return
    }
    setLoading(true)
    setError('')
    let query = supabase
      .from(CONTRIBUTIONS_TABLE)
      .select('*')
      .order('created_at', { ascending: false })
    if (filter === 'in_book') query = query.eq('status', 'approved').eq('in_book', true)
    else if (filter !== 'all') query = query.eq('status', filter)

    const { data, error: err } = await query
    if (err) setError(err.message)
    else setRows((data ?? []) as ContributionRow[])
    setLoading(false)
  }, [filter])

  useEffect(() => {
    void load()
  }, [load])

  async function setStatus(id: string, status: ContributionStatus) {
    if (!supabase) return
    setBusyId(id)
    const patch = status === 'rejected' ? { status, in_book: false } : { status }
    const { error: err } = await supabase.from(CONTRIBUTIONS_TABLE).update(patch).eq('id', id)
    setBusyId(null)
    if (err) {
      setError(err.message)
      return
    }
    if (filter !== 'all' && filter !== status && filter !== 'in_book') {
      setRows((prev) => prev.filter((r) => r.id !== id))
    } else {
      void load()
    }
  }

  async function toggleInBook(id: string, value: boolean) {
    if (!supabase) return
    setBusyId(id)
    const { error: err } = await supabase
      .from(CONTRIBUTIONS_TABLE)
      .update({ in_book: value })
      .eq('id', id)
    setBusyId(null)
    if (err) {
      setError(err.message)
      return
    }
    if (filter === 'in_book' && !value) setRows((prev) => prev.filter((r) => r.id !== id))
    else setRows((prev) => prev.map((r) => (r.id === id ? { ...r, in_book: value } : r)))
  }

  // Today's Light — feature one approved message on the homepage. Only one may
  // be featured at a time, so clear the current one first (the DB also enforces
  // this with a partial unique index), then reload so every card's badge is fresh.
  async function toggleFeatured(id: string, value: boolean) {
    if (!supabase) return
    setBusyId(id)
    if (value) {
      const { error: clearErr } = await supabase
        .from(CONTRIBUTIONS_TABLE)
        .update({ is_featured: false })
        .eq('is_featured', true)
      if (clearErr) {
        setBusyId(null)
        setError(clearErr.message)
        return
      }
    }
    const today = new Date().toISOString().slice(0, 10)
    const patch = value ? { is_featured: true, featured_date: today } : { is_featured: false }
    const { error: err } = await supabase.from(CONTRIBUTIONS_TABLE).update(patch).eq('id', id)
    setBusyId(null)
    if (err) {
      setError(err.message)
      return
    }
    void load()
  }

  async function signOut() {
    if (supabase) await supabase.auth.signOut()
    navigate('/admin/login', { replace: true })
  }

  return (
    <main className={styles.dashWrap}>
      <title>Moderation — Sacred Light Symphony</title>
      <meta name="robots" content="noindex,nofollow" />

      <header className={styles.dashHeader}>
        <div>
          <p className={styles.eyebrow}>Sacred Light Symphony</p>
          <h1 className={styles.dashTitle}>Messages of Gratitude</h1>
        </div>
        <button className={styles.ghostBtn} onClick={signOut}>
          Sign out
        </button>
      </header>

      <div className={styles.tabs}>
        {FILTERS.map((f) => (
          <button
            key={f.key}
            className={`${styles.tab} ${filter === f.key ? styles.tabActive : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
        <button className={styles.refresh} onClick={() => void load()} title="Refresh">
          ↻
        </button>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {loading ? (
        <p className={styles.muted}>Loading…</p>
      ) : rows.length === 0 ? (
        <p className={styles.muted}>No messages here yet.</p>
      ) : (
        <div className={styles.list}>
          {rows.map((r) => (
            <article key={r.id} className={styles.card}>
              <div className={styles.cardHead}>
                <span className={`${styles.badge} ${styles[r.status]}`}>{r.status}</span>
                {r.star_id != null && <span className={styles.starId}>★ {r.star_id}</span>}
                {r.in_book && <span className={styles.inBookTag}>in book</span>}
                {r.is_featured && <span className={styles.featuredTag}>★ today’s light</span>}
                <time className={styles.date}>{new Date(r.created_at).toLocaleString()}</time>
              </div>

              {r.title && <p className={styles.msgTitle}>{r.title}</p>}
              <p className={styles.message}>{r.message}</p>

              <div className={styles.meta}>
                <strong>
                  {[r.salutation, r.first_name, r.last_name].filter(Boolean).join(' ') || r.name}
                </strong>
                {(r.city || r.country) && (
                  <span> · {[r.city, r.country].filter(Boolean).join(', ')}</span>
                )}
                <span className={styles.email}> · {r.email}</span>
              </div>

              {(r.website || r.social || r.music_url || r.video_url) && (
                <div className={styles.details}>
                  {r.website && (
                    <a href={r.website} target="_blank" rel="noreferrer">
                      Website ↗
                    </a>
                  )}
                  {r.social && <span>{r.social}</span>}
                  {r.music_url && (
                    <a href={r.music_url} target="_blank" rel="noreferrer">
                      Music ↗
                    </a>
                  )}
                  {r.video_url && (
                    <a href={r.video_url} target="_blank" rel="noreferrer">
                      Video ↗
                    </a>
                  )}
                </div>
              )}

              <div className={styles.flags}>
                {r.language && <span>form: {r.language}</span>}
                {r.display_language && <span>display: {r.display_language}</span>}
                <span>{r.newsletter_opt_in ? '✓ newsletter' : 'no newsletter'}</span>
                {r.consent_translate && <span>✓ translation ok</span>}
                {r.display_name && <span>displayed as “{r.display_name}”</span>}
              </div>

              {r.attachments.length > 0 && (
                <div className={styles.attachments}>
                  {r.attachments.map((u) =>
                    isImage(u) ? (
                      <a key={u} href={u} target="_blank" rel="noreferrer">
                        <img src={u} alt="attachment" />
                      </a>
                    ) : (
                      <a key={u} href={u} target="_blank" rel="noreferrer" className={styles.fileLink}>
                        View file ↗
                      </a>
                    ),
                  )}
                </div>
              )}

              <div className={styles.actions}>
                {r.status !== 'approved' && (
                  <button
                    className={styles.approveBtn}
                    disabled={busyId === r.id}
                    onClick={() => setStatus(r.id, 'approved')}
                  >
                    Approve
                  </button>
                )}
                {r.status !== 'rejected' && (
                  <button
                    className={styles.rejectBtn}
                    disabled={busyId === r.id}
                    onClick={() => setStatus(r.id, 'rejected')}
                  >
                    Reject
                  </button>
                )}
                {r.status === 'approved' && (
                  <button
                    className={r.in_book ? styles.inBookActive : styles.inBookBtn}
                    disabled={busyId === r.id}
                    onClick={() => toggleInBook(r.id, !r.in_book)}
                  >
                    {r.in_book ? '✓ In book' : 'Add to book'}
                  </button>
                )}
                {r.status === 'approved' && (
                  <button
                    className={r.is_featured ? styles.featuredActive : styles.featuredBtn}
                    disabled={busyId === r.id}
                    onClick={() => toggleFeatured(r.id, !r.is_featured)}
                    title="Show this message as Today’s Light on the homepage"
                  >
                    {r.is_featured ? '★ Featured today' : '☆ Feature'}
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  )
}
