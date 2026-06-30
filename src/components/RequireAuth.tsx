import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useSession } from '../hooks/useSession'

/** Gates admin routes: redirects to the login page when not signed in. */
export default function RequireAuth({ children }: { children: ReactNode }) {
  const { session, loading } = useSession()

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100dvh',
          display: 'grid',
          placeItems: 'center',
          background: 'var(--charcoal)',
          color: 'var(--warm-grey)',
          fontFamily: 'var(--font-display)',
          fontStyle: 'italic',
          fontSize: '20px',
        }}
      >
        {/* Admin is never indexed — also covers the pre-rendered loading shell. */}
        <meta name="robots" content="noindex,nofollow" />
        Awakening…
      </div>
    )
  }

  if (!session) return <Navigate to="/admin/login" replace />

  return <>{children}</>
}
