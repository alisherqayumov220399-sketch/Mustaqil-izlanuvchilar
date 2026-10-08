import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function spa404Plugin() {
  return {
    name: 'spa-404-fallback',
    closeBundle() {
      try {
        const distIndex = path.resolve(__dirname, 'dist/index.html')
        const dist404 = path.resolve(__dirname, 'dist/404.html')
        if (fs.existsSync(distIndex)) {
          fs.copyFileSync(distIndex, dist404)
        }
      } catch (e) {
        console.warn('404.html copy skipped:', e.message)
      }
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), spa404Plugin()],
  base: './',
  server: {
    port: 5173,
    open: true,
    host: true,
  },
  preview: {
    port: 4173,
    open: true,
    host: true,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('lucide-react')) return 'vendor-icons'
            if (id.includes('read-excel-file') || id.includes('write-excel-file')) return 'vendor-excel'
            if (id.includes('react') || id.includes('react-dom')) return 'vendor-react'
            return 'vendor-other'
          }
        }
      }
    },
    chunkSizeWarningLimit: 800
  }
})

