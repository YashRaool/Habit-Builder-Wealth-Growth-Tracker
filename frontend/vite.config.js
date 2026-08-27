import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  // GitHub Pages project-site base URL.
  base: '/Habit-Builder-Wealth-Growth-Tracker/',

  plugins: [react(), tailwindcss()],

  resolve: {
    // Support imports such as @/components/Nav and @/context/ThemeContext.
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
