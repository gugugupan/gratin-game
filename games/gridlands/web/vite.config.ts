import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// 允许从上级 levels/ 目录导入关卡 JSON
export default defineConfig({
  base: './',
  plugins: [react()],
  server: { fs: { allow: ['..'] } },
});
