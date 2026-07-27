import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import pkg from './package.json'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/lt-miniapp-plus/',
  server: {
    port: 5175,
    strictPort: true
  },
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version)
  }
})
