import type { RouteRecord } from 'vite-react-ssg'
import Home from './pages/Home/Home'
import Gratitude from './pages/Gratitude/Gratitude'
import AdminLogin from './pages/Admin/AdminLogin'
import AdminDashboard from './pages/Admin/AdminDashboard'
import AdminCredits from './pages/Admin/AdminCredits'
import RequireAuth from './components/RequireAuth'

/**
 * Route table consumed by vite-react-ssg.
 *
 * Each `path` here is pre-rendered to a real static HTML file at build time, so
 * search engines and link-preview bots receive fully-formed pages (not an empty
 * #root that only fills in after JS runs). Add future pages as entries below.
 */
export const routes: RouteRecord[] = [
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/gratitude',
    element: <Gratitude />,
  },
  {
    path: '/admin/login',
    element: <AdminLogin />,
  },
  {
    path: '/admin',
    element: (
      <RequireAuth>
        <AdminDashboard />
      </RequireAuth>
    ),
  },
  {
    path: '/admin/credits',
    element: (
      <RequireAuth>
        <AdminCredits />
      </RequireAuth>
    ),
  },
]
