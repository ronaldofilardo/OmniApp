import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: '0.0.0.0', // Permite acesso de qualquer IP da rede local
    strictPort: true, // Não muda de porta automaticamente
    cors: true
  }
})
