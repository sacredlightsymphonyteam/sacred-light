import type { RouteRecord } from 'vite-react-ssg'
import Home from './pages/Home/Home'

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
]
