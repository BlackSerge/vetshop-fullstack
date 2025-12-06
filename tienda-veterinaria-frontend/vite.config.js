import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],

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