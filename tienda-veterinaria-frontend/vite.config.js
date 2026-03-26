import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },

  // CONFIGURACIÓN DEL SERVIDOR (ESTO ES LO QUE FALTA)
  server: {
    host: true, // Permite acceso por IP
    allowedHosts: true, // Permite todos los hosts (incluido ngrok)
  },

  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
    css: true,
  },
})