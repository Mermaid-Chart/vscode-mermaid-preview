import { defineConfig } from 'vite';
import {svelte} from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte()],
  build: {
    outDir: '../out/svelte',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        format: 'iife',
        entryFileNames: 'bundle.js',
        assetFileNames: '[name][extname]',
      },
    },
  },
});
