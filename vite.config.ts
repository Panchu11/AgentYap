import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'popup.html'),
        sidebar: resolve(__dirname, 'sidebar.html'),
        content: resolve(__dirname, 'src/content/content_script.ts'),
        background: resolve(__dirname, 'src/background/background.ts')
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'content') {
            return 'src/content/content.js'
          }
          if (chunkInfo.name === 'background') {
            return 'src/background/background.js'
          }
          return 'assets/[name]-[hash].js'
        }
      }
    }
  },
  define: {
    'process.env': process.env
  }
})