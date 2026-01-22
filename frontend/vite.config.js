import { defineConfig } from 'vite'
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
        name: 'Sinergi Foundation Inventaris',
        short_name: 'SF Inventaris',
        description: 'Aplikasi Manajemen Aset & Inventaris Sinergi Foundation',
        theme_color: '#009846',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        orientation: 'portrait',
        icons: [
          {
            src: '/android-chrome-192x192.png', // 👈 Ambil dari screenshot Bapak
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/android-chrome-512x512.png', // 👈 Ambil dari screenshot Bapak
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/android-chrome-512x512.png', // Icon maskable (opsional, pakai yg sama gapapa)
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
})