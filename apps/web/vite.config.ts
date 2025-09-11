import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';

export default defineConfig({
  plugins: [solid()],
  server: {
    port: 3000,
    proxy: {
      '/api': 'http://localhost:3001',
      '/storage': 'http://localhost:3001',
    },
  },
  build: {
    target: 'esnext',
  },
});

