import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Pour GitHub Pages : remplacer 'lahune-conventions-pwa' par le nom de ton repo
export default defineConfig({
  base: '/lahune-conventions-pwa/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'LA HUNE — Conventions Boulogne & Concarneau',
        short_name: 'LA HUNE Conv.',
        description: 'Calcul des indemnités d\'assistance maritime à la pêche',
        theme_color: '#1C2E5C',
        background_color: '#FAF7F2',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/lahune-conventions-pwa/',
        start_url: '/lahune-conventions-pwa/',
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}']
      }
    })
  ]
});
