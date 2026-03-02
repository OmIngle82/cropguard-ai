/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Vidarbha Crop Doctor AI',
        short_name: 'Crop Doctor',
        description: 'Advanced AI Diagnosis for Cotton & Soybean Crops',
        theme_color: '#10b981',
        background_color: '#f8fafc',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        orientation: 'portrait',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  base: '/',
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Heavy ML library — loaded only when Diagnosis page is opened
          'tensorflow': ['@tensorflow/tfjs', '@tensorflow-models/mobilenet'],
          // Firebase SDK
          'firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          // Charting — loaded only in MarketWidget
          'recharts': ['recharts'],
          // Core React + Router
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // Markdown / Chat rendering
          'markdown': ['react-markdown', 'remark-gfm', 'remark-math', 'rehype-katex'],
        }
      }
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/tests/setup.ts',
  },
  server: {
    proxy: {
      '/api/ceda': {
        target: 'https://api.ceda.ashoka.edu.in',
        changeOrigin: true,
        secure: false, // Fix for ECONNRESET / SSL issues
        rewrite: (path) => path.replace(/^\/api\/ceda/, '')
      }
    }
  }
})

