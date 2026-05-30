import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      includeAssets: ["icon-192.png", "icon-512.png", "apple-touch-icon.png"],
      // El manifest se sirve desde public/manifest.json directamente
      manifest: false,
      workbox: {
        // Pre-cachea todos los assets del build para uso offline
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2}"],
        // Estrategia: al activar el SW nuevo, toma el control inmediatamente
        skipWaiting: true,
        clientsClaim: true,
        runtimeCaching: [
          {
            // Fuentes de Google si se añaden en el futuro
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
    }),
  ],
  server: {
    // Permite enlaces de tuneles para pruebas en celular.
    allowedHosts: [".loca.lt", ".ngrok-free.dev"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["src/utils/therapistUtils.ts"],
    },
  },
});
