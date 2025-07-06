import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: 5174,
    strictPort: true, // עצור אם הפורט תפוס
    proxy: {
      '/api': {
        target: 'http://localhost:8765',
        changeOrigin: true,
        secure: false,
        cookieDomainRewrite: 'localhost',
        ws: true
      },
      '/login': {
        target: 'http://localhost:8765',
        changeOrigin: true,
        secure: false,
        cookieDomainRewrite: 'localhost',
        ws: true
      },
      '/auth': {
        target: 'http://localhost:8765',
        changeOrigin: true,
        secure: false,
        cookieDomainRewrite: 'localhost',
        ws: true
      }
    }
  }
})
