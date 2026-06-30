import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { supabase, isSupabaseConfigured } from '../../lib/supabase'
import { useSession } from '../../hooks/useSession'
import styles from './Admin.module.css'

/** Admin sign-in — Supabase Auth (email/password). */
export default function AdminLogin() {
  const navigate = useNavigate()
  const { session, loading } = useSession()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (!loading && session) return <Navigate to="/admin" replace />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (!supabase) {
      setError('Backend not connected. Set the Supabase environment variables.')
      return
    }
    setBusy(true)
    const { error: authErr } = await supabase.auth.signInWithPassword({ email, password })
    if (authErr) {
      setError(authErr.message)
      setBusy(false)
      return
    }
    navigate('/admin', { replace: true })
  }

  return (
    <main className={styles.authWrap}>
      <title>Keeper of the Light — Sacred Light Symphony</title>
      <meta name="robots" content="noindex,nofollow" />

      <form className={styles.authCard} onSubmit={handleSubmit}>
        <p className={styles.eyebrow}>Sacred Light Symphony</p>
        <h1 className={styles.authTitle}>Keeper of the Light</h1>
        <p className={styles.authSub}>Sign in to review messages of gratitude.</p>

        {!isSupabaseConfigured && (
          <div className={styles.notice}>The backend isn’t connected yet.</div>
        )}

        <label className={styles.field}>
          <span>Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            required
          />
        </label>
        <label className={styles.field}>
          <span>Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>

        {error && <div className={styles.error}>{error}</div>}

        <button type="submit" className="sls-cta" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </main>
  )
}
