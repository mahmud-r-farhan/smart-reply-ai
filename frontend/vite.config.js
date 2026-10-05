import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// The dev/preview servers proxy `/api` to the local backend so the web client
// works out of the box without CORS configuration or an API key.
const backendTarget = process.env.VITE_BACKEND_ORIGIN || 'http://localhost:5006'

const proxy = {
  '/api': {
    target: backendTarget,
    changeOrigin: true,
  },
  '/health': {
    target: backendTarget,
    changeOrigin: true,
  },
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // Ensure service worker is not processed as module
    rollupOptions: {
      input: {
        main: '/index.html',
      },
    },
  },
  server: {
    host: true,
    port: 5173,
    // Allow preview/proxy hosts (e.g. *.e2b.app) to load the dev server.
    allowedHosts: true,
    proxy,
  },
  preview: {
    host: true,
    port: 4173,
    allowedHosts: true,
    proxy,
  },
})
