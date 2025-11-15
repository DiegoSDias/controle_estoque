import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  server: {
    proxy: {
      // Isso vai redirecionar qualquer requisição que comece com /dashboard,
      // /produtos, /clientes, /fornecedores, /vendas
      // para o seu backend em http://localhost:3000
      '^/(dashboard|produtos|clientes|fornecedores|vendas)': {
        target: 'http://localhost:3000/',
        changeOrigin: true,
        secure: false,
      },
    }
  }
})
