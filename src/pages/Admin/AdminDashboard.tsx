import { Fragment, useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  supabase,
  CONTRIBUTIONS_TABLE,
  type ContributionRow,
  type ContributionStatus,
} from '../../lib/supabase'
import styles from './Admin.module.css'

type Filter = ContributionStatus | 'all' | 'in_book'
type SortKey = 'created_at' | 'name' | 'country' | 'email' | 'status' | 'message'

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
  const [search, setSearch] = useState('')
  const [countryFilter, setCountryFilter] = useState('')
  const [dupOnly, setDupOnly] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>('created_at')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [rows, setRows] = useState<ContributionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)

  const toggleExpand = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const displayName = (r: ContributionRow) =>
    [r.salutation, r.first_name, r.last_name].filter(Boolean).join(' ') || r.name

  // How many times each email appears in the loaded rows (to flag duplicates).
  const emailCounts = rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.email] = (acc[r.email] ?? 0) + 1
    return acc
  }, {})
  const countries = Array.from(new Set(rows.map((r) => r.country).filter(Boolean))).sort() as string[]

  const q = search.trim().toLowerCase()
  const sortVal = (r: ContributionRow): string => {
    switch (sortKey) {
      case 'name':
        return displayName(r).toLowerCase()
      case 'country':
        return (r.country ?? '').toLowerCase()
      case 'email':
        return r.email.toLowerCase()
      case 'status':
        return r.status
      case 'message':
        return r.message.toLowerCase()
      default:
        return r.created_at
    }
  }
  const visibleRows = rows
    .filter((r) =>
      !q
        ? true
        : [
            r.name,
            r.first_name,
            r.last_name,
            r.display_name,
            r.email,
            r.title,
            r.message,
            r.country,
            r.city,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
            .includes(q),
    )
    .filter((r) => (countryFilter ? r.country === countryFilter : true))
    .filter((r) => (dupOnly ? emailCounts[r.email] > 1 : true))
    .slice()
    .sort((a, b) => {
      const cmp = sortVal(a).localeCompare(sortVal(b))
      return sortDir === 'asc' ? cmp : -cmp
    })

  const sortBy = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir(key === 'created_at' ? 'desc' : 'asc')
    }
  }

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

  // Sortable column header — click to sort, click again to flip direction.
  const th = (key: SortKey, label: string) => (
    <th className={styles.th} onClick={() => sortBy(key)}>
      {label}
      <span className={styles.sortArrow}>
        {sortKey === key ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}
      </span>
    </th>
  )

  return (
    <main className={styles.dashWrap}>
      <title>Moderation — Sacred Light Symphony</title>
      <meta name="robots" content="noindex,nofollow" />

      <header className={styles.dashHeader}>
        <div>
          <p className={styles.eyebrow}>Sacred Light Symphony</p>
          <h1 className={styles.dashTitle}>Messages of Gratitude</h1>
        </div>
        <div className={styles.headActions}>
          <Link to="/admin/credits" className={styles.ghostBtn}>
            Credits
          </Link>
          <button className={styles.ghostBtn} onClick={signOut}>
            Sign out
          </button>
        </div>
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
        <input
          className={styles.search}
          type="search"
          placeholder="Search name, message, email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className={styles.filterSelect}
          value={countryFilter}
          onChange={(e) => setCountryFilter(e.target.value)}
          title="Filter by country"
        >
          <option value="">All countries</option>
          {countries.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <label className={styles.dupToggle} title="Show only emails that submitted more than once">
          <input type="checkbox" checked={dupOnly} onChange={(e) => setDupOnly(e.target.checked)} />
          Duplicate emails
        </label>
        <button className={styles.refresh} onClick={() => void load()} title="Refresh">
          ↻
        </button>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {loading ? (
        <p className={styles.muted}>Loading…</p>
      ) : visibleRows.length === 0 ? (
        <p className={styles.muted}>
          {rows.length === 0 ? 'No messages here yet.' : 'No messages match your search.'}
        </p>
      ) : (
        <>
          <p className={styles.count}>
            {visibleRows.length} {visibleRows.length === 1 ? 'message' : 'messages'}
            {q && ` matching “${search.trim()}”`}
          </p>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  {th('created_at', 'Date')}
                  {th('name', 'Name')}
                  {th('country', 'Country')}
                  {th('email', 'Email')}
                  {th('message', 'Message')}
                  {th('status', 'Status')}
                  <th className={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((r) => {
                  const dup = emailCounts[r.email] > 1
                  const isOpen = expanded.has(r.id)
                  return (
                    <Fragment key={r.id}>
                      <tr
                        className={`${styles.row} ${isOpen ? styles.rowOpen : ''}`}
                        onClick={() => toggleExpand(r.id)}
                      >
                        <td className={styles.tdDate}>
                          {new Date(r.created_at).toLocaleDateString()}
                        </td>
                        <td>
                          {displayName(r)}
                          {r.star_id != null && <span className={styles.starId}> ★{r.star_id}</span>}
                        </td>
                        <td>{r.country || '—'}</td>
                        <td className={styles.tdEmail}>
                          {r.email}
                          {dup && (
                            <span className={styles.dupBadge} title="Submitted more than once">
                              ×{emailCounts[r.email]}
                            </span>
                          )}
                        </td>
                        <td className={styles.tdMsg} title={r.message}>
                          {r.title ? `${r.title} — ` : ''}
                          {r.message}
                        </td>
                        <td>
                          <span className={`${styles.badge} ${styles[r.status]}`}>{r.status}</span>
                          {r.in_book && (
                            <span className={styles.inBookDot} title="In book">
                              {' ●'}
                            </span>
                          )}
                          {r.is_featured && (
                            <span className={styles.featStar} title="Today’s light">
                              {' ★'}
                            </span>
                          )}
                        </td>
                        <td className={styles.tdActions} onClick={(e) => e.stopPropagation()}>
                          {r.status !== 'approved' && (
                            <button
                              className={styles.iconApprove}
                              disabled={busyId === r.id}
                              onClick={() => setStatus(r.id, 'approved')}
                              title="Approve"
                            >
                              ✓
                            </button>
                          )}
                          {r.status !== 'rejected' && (
                            <button
                              className={styles.iconReject}
                              disabled={busyId === r.id}
                              onClick={() => setStatus(r.id, 'rejected')}
                              title="Reject"
                            >
                              ✕
                            </button>
                          )}
                          <button
                            className={styles.iconExpand}
                            onClick={() => toggleExpand(r.id)}
                            title={isOpen ? 'Collapse' : 'Expand'}
                          >
                            {isOpen ? '▲' : '▼'}
                          </button>
                        </td>
                      </tr>

                      {isOpen && (
                        <tr className={styles.detailRow}>
                          <td colSpan={7}>
                            <div className={styles.detail}>
                              {r.title && <p className={styles.msgTitle}>{r.title}</p>}
                              <p className={styles.message}>{r.message}</p>

                              <div className={styles.meta}>
                                <strong>{displayName(r)}</strong>
                                {(r.city || r.country) && (
                                  <span> · {[r.city, r.country].filter(Boolean).join(', ')}</span>
                                )}
                                <span className={styles.email}> · {r.email}</span>
                                {r.display_name && <span> · displayed as “{r.display_name}”</span>}
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
                              </div>

                              {r.attachments.length > 0 && (
                                <div className={styles.attachments}>
                                  {r.attachments.map((u) =>
                                    isImage(u) ? (
                                      <a key={u} href={u} target="_blank" rel="noreferrer">
                                        <img src={u} alt="attachment" />
                                      </a>
                                    ) : (
                                      <a
                                        key={u}
                                        href={u}
                                        target="_blank"
                                        rel="noreferrer"
                                        className={styles.fileLink}
                                      >
                                        View file ↗
                                      </a>
                                    ),
                                  )}
                                </div>
                              )}

                              <div className={styles.actions}>
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
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </main>
  )
}
