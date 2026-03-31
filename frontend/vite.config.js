import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    sourcemap: false, // 🚨 CRITICAL: Hide source code mapping
    minify: 'esbuild', // Minify code natively with Vite
    target: 'esnext'
  },
  esbuild: {
    drop: ['console', 'debugger'], // 🧹 Remove logging output (debugger removed here as well by default but we'll manually inject an anti-devtool script that evades this build rule because we write it differently)
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
