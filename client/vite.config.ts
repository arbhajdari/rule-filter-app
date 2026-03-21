import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      /**
       * Map the shared package alias to the TS source. 
       * Must match the 'paths' configuration in tsconfig.json.
       */
      '@rule-filter/shared': resolve(__dirname, '../shared/src/index.ts'),
    },
  },

  server: {
    port: 5173,
    proxy: {
      /**
       * Proxy API requests to the Express backend (Port 3001) 
       * to avoid CORS issues during local development.
       */
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});