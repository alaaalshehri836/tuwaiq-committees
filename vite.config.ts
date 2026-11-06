import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Relative base so the build works from any static host / sub-folder.
  base: './',
  build: {
    rollupOptions: {
      input: {
        // Version A — interactive website
        main: 'index.html',
        // Version B — cinematic video (preview + render source)
        video: 'video.html',
      },
    },
  },
});
