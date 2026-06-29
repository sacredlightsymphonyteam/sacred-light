import { ViteReactSSG } from 'vite-react-ssg'
import { routes } from './App'
import './styles/global.css'

// ViteReactSSG renders these routes to static HTML at build time and hydrates
// them in the browser. The named `createRoot` export is the entry index.html points to.
export const createRoot = ViteReactSSG({ routes })
