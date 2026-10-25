import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      port: 4040,
      cors: true,
      allowedHosts: [
        'rudeox.cloud',
        '.rudeox.cloud',
        'localhost',
        '127.0.0.1',
      ],
    },
    preview: {
      port: 4040,
      cors: true,
      allowedHosts: [
        'rudeox.cloud',
        '.rudeox.cloud',
        'localhost',
        '127.0.0.1',
      ],
    },
  };
});
