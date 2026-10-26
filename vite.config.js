import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    svelte(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'راجل ولا مش راجل',
        short_name: 'راجل',
        lang: 'ar',
        dir: 'rtl',
        display: 'standalone',
        start_url: '/',
        background_color: '#f6f4ee',
        theme_color: '#1f4e5f',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: { globPatterns: ['**/*.{js,css,html,png,woff2,woff,ttf}'] }
    })
  ],
  test: { environment: 'node' }
});
