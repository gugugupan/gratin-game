import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: { port: 5300, strictPort: true },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    assetsInlineLimit: (file) => (/\.woff2?$/.test(file) ? false : undefined),
  },
});
