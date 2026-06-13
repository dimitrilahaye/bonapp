import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

const REPO_NAME = 'bonapp'
const isProd = process.env.NODE_ENV === 'production'

export default defineConfig({
  base: isProd ? `/${REPO_NAME}/` : '/',
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png', 'splash/*.png'],
      manifest: {
        name: 'BonApp — Menus de la semaine',
        short_name: 'BonApp',
        description: 'Planifiez vos menus de la semaine et partagez-les facilement.',
        theme_color: '#2D5A27',
        background_color: '#F7F5F0',
        display: 'standalone',
        orientation: 'portrait',
        start_url: isProd ? `/${REPO_NAME}/` : '/',
        scope: isProd ? `/${REPO_NAME}/` : '/',
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
        cleanupOutdatedCaches: true,
        runtimeCaching: []
      }
    })
  ]
})
