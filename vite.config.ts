import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@exercises': resolve(__dirname, './src/exercises'),
      '@components': resolve(__dirname, './src/components'),
      '@lib': resolve(__dirname, './src/lib'),
    },
  },
  server: {
    port: 3000,
    open: true,
    fs: {
      allow: ['..', './exercise-files'],
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  optimizeDeps: {
    include: ['typescript', 'chokidar'],
  },
})