import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { isAppHost } from './lib/site'

const container = document.getElementById('root')!
const app = (
  <StrictMode>
    <App />
  </StrictMode>
)

// Marketing routes are prerendered at build time (scripts/prerender.mjs): hydrate them.
// The app host never serves prerendered HTML, but guard anyway.
if (container.hasChildNodes() && !isAppHost()) {
  hydrateRoot(container, app)
} else {
  createRoot(container).render(app)
}
