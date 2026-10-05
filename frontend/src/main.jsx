import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { registerServiceWorker, checkServiceWorkerUpdates, unregisterServiceWorker } from './utils/pwaUtils'

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      if (import.meta.env.PROD) {
        // Production: register the offline-capable service worker.
        await registerServiceWorker()
        await checkServiceWorkerUpdates()
      } else {
        // Dev: a stale worker would serve cached HTML and break HMR.
        await unregisterServiceWorker()
      }
    } catch (error) {
      console.error('Service worker setup failed:', error)
    }
  })
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
