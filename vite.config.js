import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  server: {
    port: 3002,
    proxy: {
      '/user': {
        target: 'http://localhost:8082',
        changeOrigin: true
      },
      '/email': {
        target: 'http://localhost:8082',
        changeOrigin: true
      },
      '/pet': {
        target: 'http://localhost:8082',
        changeOrigin: true
      },
      '/petService': {
        target: 'http://localhost:8082',
        changeOrigin: true
      },
      '/appointment': {
        target: 'http://localhost:8082',
        changeOrigin: true
      },
      '/orders': {
        target: 'http://localhost:8082',
        changeOrigin: true
      },
      '/adoption': {
        target: 'http://localhost:8082',
        changeOrigin: true
      },
      '/post': {
        target: 'http://localhost:8082',
        changeOrigin: true
      },
      '/comment': {
        target: 'http://localhost:8082',
        changeOrigin: true
      },
      '/like': {
        target: 'http://localhost:8082',
        changeOrigin: true
      }
    }
  }
})
