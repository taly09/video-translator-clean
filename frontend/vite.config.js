import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5174,
    strictPort: true, // אם הפורט תפוס – עצור, אל תעבור הלאה
    proxy: {
      '/api': {
        target: 'http://localhost:8765',
        changeOrigin: true,
        secure: false,
        cookieDomainRewrite: {
          '*': '', // 💥 קריטי: מסיר Domain מה־Set-Cookie
        },
      },
      '/login': {
        target: 'http://localhost:8765',
        changeOrigin: true,
        secure: false,
        cookieDomainRewrite: {
          '*': '',
        },
      },
      '/auth': {
        target: 'http://localhost:8765',
        changeOrigin: true,
        secure: false,
        cookieDomainRewrite: {
          '*': '',
        },
      },
    },
  },
})
