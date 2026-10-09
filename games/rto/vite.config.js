import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: { port: 5250, strictPort: true },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    assetsInlineLimit: (file) => (/\.woff2?$/.test(file) ? false : undefined),
    rollupOptions: {
      input: {
        main: 'index.html',
        'share-ja': 'share/ja/index.html',
        'share-zh': 'share/zh/index.html',
        'share-en': 'share/en/index.html',
      },
    },
  },
});
