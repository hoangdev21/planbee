import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    sourcemap: false, // 🚨 CRITICAL: Hide source code mapping
    target: 'esnext'
    // Let Vite use its native Vite 8 minifier (Oxc/lightningcss) instead of forcing esbuild
  },
  server: {
    watch: {
      usePolling: true,
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      }
    },
    hmr: {
      overlay: true,
    }
  }
});
