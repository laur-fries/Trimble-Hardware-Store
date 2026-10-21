import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/Trimble-Hardware-Store/',
  server: {
    port: 5181,
    strictPort: false,
  },
});
