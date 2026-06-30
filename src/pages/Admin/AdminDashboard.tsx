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
                <time className={styles.date}>{new Date(r.created_at).toLocaleString()}</time>
              </div>

              <p className={styles.message}>{r.message}</p>

              <div className={styles.meta}>
                <strong>{r.name}</strong>
                {r.location && <span> · {r.location}</span>}
                <span className={styles.email}> · {r.email}</span>
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
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  )
}
