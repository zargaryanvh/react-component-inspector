import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@zargaryanvh/react-component-inspector': path.resolve(__dirname, '../src/index.ts'),
    },
    preserveSymlinks: false,
  },
  server: {
    port: 7890,
    strictPort: true,
    open: true,
    fs: {
      allow: ['..'],
    },
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@mui/material',
      '@mui/material/styles',
      '@mui/icons-material/ContentCopy',
    ],
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('development'),
  },
});
