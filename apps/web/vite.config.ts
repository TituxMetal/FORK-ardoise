import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite-plus'
import { aliases } from './aliases.plugin'
import { startApi } from './StartApi.plugin'

export default defineConfig({
  plugins: [react(), tailwindcss(), startApi(), aliases()],
  server: {
    port: 1337,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api/, '')
      }
    }
  }
})
