import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 3000,
    open: false,
    // Allow proxied preview hosts (e.g. *.e2b.app) to reach the dev server.
    allowedHosts: true
  },
  preview: {
    host: true,
    port: 3000,
    allowedHosts: true
  }
});
