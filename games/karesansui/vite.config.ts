import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: { port: 5270, strictPort: true },
  build: { outDir: 'dist', emptyOutDir: true },
});
