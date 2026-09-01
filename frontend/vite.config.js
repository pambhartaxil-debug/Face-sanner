import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/Face-sanner/',
  plugins: [
    react(),
    tailwindcss(),
  ],
})
