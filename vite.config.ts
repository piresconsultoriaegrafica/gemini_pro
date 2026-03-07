import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss(), VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      workbox: {
        maximumFileSizeToCacheInBytes: 4000000,
      },
      manifest: {
        name: 'Empresa Dashboard Pro',
        short_name: 'EmpresaPro',
        description: 'Sistema de Gestão e Dashboard para Empresas',
        theme_color: '#0f172a',
        icons: [
          {
            src: 'https://picsum.photos/seed/appicon192/192/192',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'https://picsum.photos/seed/appicon512/512/512',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'https://picsum.photos/seed/appicon512/512/512',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    }), cloudflare()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: {
        usePolling: true,
        ignored: ['**/database.sqlite', '**/database.sqlite-shm', '**/database.sqlite-wal'],
      },
    },
  };
});