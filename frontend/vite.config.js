import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
    cors: true,
  },
  build: {
    outDir: 'build',
    sourcemap: false,
  },
  // Compatibilidade com variáveis de ambiente VITE_ e legacy REACT_APP_
  envPrefix: ['VITE_', 'REACT_APP_'],
});
