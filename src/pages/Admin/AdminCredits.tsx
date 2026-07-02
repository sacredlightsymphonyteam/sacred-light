import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase, CREDITS_TABLE, type CreditRow } from '../../lib/supabase'
import styles from './Admin.module.css'

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

type Draft = { tier_name: string; tier_order: string; name: string; role: string; is_placeholder: boolean }
const EMPTY: Draft = { tier_name: '', tier_order: '', name: '', role: '', is_placeholder: false }

/** Our Gratitude — manage the credit tiers shown in The Circle (Section 6). */
export default function AdminCredits() {
  const navigate = useNavigate()
  const [rows, setRows] = useState<CreditRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [form, setForm] = useState<Draft>(EMPTY)
  const [editId, setEditId] = useState<string | null>(null)
  const [edit, setEdit] = useState<Draft>(EMPTY)

  const load = useCallback(async () => {
    if (!supabase) {
      setError('Backend not connected. Set the Supabase environment variables.')
      setLoading(false)
      return
    }
    setLoading(true)
    setError('')
    const { data, error: err } = await supabase
      .from(CREDITS_TABLE)
      .select('*')
      .order('tier_order', { ascending: true })
      .order('created_at', { ascending: true })
    if (err) setError(err.message)
    else setRows((data ?? []) as CreditRow[])
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function add() {
    if (!supabase) return
    if (!form.tier_name.trim() || !form.name.trim()) {
      setError('Tier and name are both required.')
      return
    }
    setBusyId('new')
    const { error: err } = await supabase.from(CREDITS_TABLE).insert({
      tier_name: form.tier_name.trim(),
      tier_slug: slugify(form.tier_name),
      tier_order: Number(form.tier_order) || 0,
      name: form.name.trim(),
      role: form.role.trim() || null,
      is_placeholder: form.is_placeholder,
      is_visible: true,
    })
    setBusyId(null)
    if (err) {
      setError(err.message)
      return
    }
    setForm(EMPTY)
    void load()
  }

  function startEdit(r: CreditRow) {
    setEditId(r.id)
    setEdit({
      tier_name: r.tier_name,
      tier_order: String(r.tier_order),
      name: r.name,
      role: r.role ?? '',
      is_placeholder: r.is_placeholder,
    })
  }

  async function saveEdit(id: string) {
    if (!supabase) return
    setBusyId(id)
    const { error: err } = await supabase
      .from(CREDITS_TABLE)
      .update({
        tier_name: edit.tier_name.trim(),
        tier_slug: slugify(edit.tier_name),
        tier_order: Number(edit.tier_order) || 0,
        name: edit.name.trim(),
        role: edit.role.trim() || null,
        is_placeholder: edit.is_placeholder,
      })
      .eq('id', id)
    setBusyId(null)
    if (err) {
      setError(err.message)
      return
    }
    setEditId(null)
    void load()
  }

  async function toggleVisible(r: CreditRow) {
    if (!supabase) return
    setBusyId(r.id)
    const { error: err } = await supabase
      .from(CREDITS_TABLE)
      .update({ is_visible: !r.is_visible })
      .eq('id', r.id)
    setBusyId(null)
    if (err) {
      setError(err.message)
      return
    }
    setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, is_visible: !r.is_visible } : x)))
  }

  async function remove(r: CreditRow) {
    if (!supabase) return
    if (!window.confirm(`Delete “${r.name}” from ${r.tier_name}?`)) return
    setBusyId(r.id)
    const { error: err } = await supabase.from(CREDITS_TABLE).delete().eq('id', r.id)
    setBusyId(null)
    if (err) {
      setError(err.message)
      return
    }
    setRows((prev) => prev.filter((x) => x.id !== r.id))
  }

  async function signOut() {
    if (supabase) await supabase.auth.signOut()
    navigate('/admin/login', { replace: true })
  }

  // Group rows into tiers for display (rows already ordered by tier then insertion).
  const tiers: { slug: string; name: string; order: number; items: CreditRow[] }[] = []
  for (const r of rows) {
    let t = tiers[tiers.length - 1]
    if (!t || t.slug !== r.tier_slug) {
      t = { slug: r.tier_slug, name: r.tier_name, order: r.tier_order, items: [] }
      tiers.push(t)
    }
    t.items.push(r)
  }

  return (
    <main className={styles.dashWrap}>
      <title>Credits — Sacred Light Symphony</title>
      <meta name="robots" content="noindex,nofollow" />

      <header className={styles.dashHeader}>
        <div>
          <p className={styles.eyebrow}>Sacred Light Symphony</p>
          <h1 className={styles.dashTitle}>Our Gratitude — Credits</h1>
        </div>
        <div className={styles.headActions}>
          <Link to="/admin" className={styles.ghostBtn}>
            ← Messages
          </Link>
          <button className={styles.ghostBtn} onClick={signOut}>
            Sign out
          </button>
        </div>
      </header>

      <p className={styles.notice}>
        These names appear in The Circle → Our Gratitude on the homepage. Lower “order” shows first.
        Hidden names stay saved but don’t appear on the site. Tick “placeholder” to show a line in
        italic (e.g. “To be announced.”).
      </p>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.creditAdd}>
        <input
          placeholder="Tier (e.g. Founding Voices)"
          value={form.tier_name}
          onChange={(e) => setForm({ ...form, tier_name: e.target.value })}
        />
        <input
          className={styles.orderInput}
          type="number"
          placeholder="Order"
          value={form.tier_order}
          onChange={(e) => setForm({ ...form, tier_order: e.target.value })}
        />
        <input
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <input
          placeholder="Role (optional)"
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value })}
        />
        <label className={styles.phLabel}>
          <input
            type="checkbox"
            checked={form.is_placeholder}
            onChange={(e) => setForm({ ...form, is_placeholder: e.target.checked })}
          />
          placeholder
        </label>
        <button className={styles.approveBtn} disabled={busyId === 'new'} onClick={add}>
          Add
        </button>
      </div>

      {loading ? (
        <p className={styles.muted}>Loading…</p>
      ) : tiers.length === 0 ? (
        <p className={styles.muted}>No credits yet — add the first above.</p>
      ) : (
        <div className={styles.creditList}>
          {tiers.map((t) => (
            <div key={t.slug} className={styles.tierGroup}>
              <p className={styles.tierHeading}>
                {t.name} <span className={styles.tierOrder}>· order {t.order}</span>
              </p>
              {t.items.map((r) => (
                <div
                  key={r.id}
                  className={`${styles.creditItem} ${!r.is_visible ? styles.hiddenItem : ''}`}
                >
                  {editId === r.id ? (
                    <div className={styles.creditEdit}>
                      <input
                        value={edit.tier_name}
                        placeholder="Tier"
                        onChange={(e) => setEdit({ ...edit, tier_name: e.target.value })}
                      />
                      <input
                        className={styles.orderInput}
                        type="number"
                        placeholder="Order"
                        value={edit.tier_order}
                        onChange={(e) => setEdit({ ...edit, tier_order: e.target.value })}
                      />
                      <input
                        value={edit.name}
                        placeholder="Name"
                        onChange={(e) => setEdit({ ...edit, name: e.target.value })}
                      />
                      <input
                        value={edit.role}
                        placeholder="Role"
                        onChange={(e) => setEdit({ ...edit, role: e.target.value })}
                      />
                      <label className={styles.phLabel}>
                        <input
                          type="checkbox"
                          checked={edit.is_placeholder}
                          onChange={(e) => setEdit({ ...edit, is_placeholder: e.target.checked })}
                        />
                        placeholder
                      </label>
                      <button
                        className={styles.approveBtn}
                        disabled={busyId === r.id}
                        onClick={() => saveEdit(r.id)}
                      >
                        Save
                      </button>
                      <button className={styles.ghostBtn} onClick={() => setEditId(null)}>
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className={styles.creditMain}>
                        <strong>{r.name}</strong>
                        {r.role && <span className={styles.creditRole}> · {r.role}</span>}
                        {r.is_placeholder && <span className={styles.phTag}>placeholder</span>}
                        {!r.is_visible && <span className={styles.hiddenTag}>hidden</span>}
                      </span>
                      <span className={styles.creditActions}>
                        <button
                          className={styles.inBookBtn}
                          disabled={busyId === r.id}
                          onClick={() => toggleVisible(r)}
                        >
                          {r.is_visible ? 'Hide' : 'Show'}
                        </button>
                        <button className={styles.inBookBtn} onClick={() => startEdit(r)}>
                          Edit
                        </button>
                        <button
                          className={styles.rejectBtn}
                          disabled={busyId === r.id}
                          onClick={() => remove(r)}
                        >
                          Delete
                        </button>
                      </span>
                    </>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
