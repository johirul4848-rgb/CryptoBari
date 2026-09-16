import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.ADMIN_ACCESS_CODE': JSON.stringify(process.env.ADMIN_ACCESS_CODE || process.env.VITE_ADMIN_ACCESS_CODE || '@53595'),
      'process.env.ADMIN_PASSWORD': JSON.stringify(process.env.ADMIN_PASSWORD || process.env.VITE_ADMIN_PASSWORD || 'Jahid@5359'),
      'process.env.ADMIN_ACCESS_PIN': JSON.stringify(process.env.ADMIN_ACCESS_PIN || process.env.VITE_ADMIN_ACCESS_PIN || '479057'),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
