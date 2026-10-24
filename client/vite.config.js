import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

import fs from 'node:fs';

function githubPagesPlugin() {
  return {
    name: 'github-pages-404',
    closeBundle() {
      try {
        if (fs.existsSync('dist/index.html')) {
          fs.copyFileSync('dist/index.html', 'dist/404.html');
          console.log('✓ Copied dist/index.html to dist/404.html for GitHub Pages SPA routing');
        }
      } catch (err) {
        console.error('Failed to copy 404.html:', err);
      }
      setTimeout(() => process.exit(0), 200);
    },
  };
}

export default defineConfig({
  // GitHub Pages project-site base URL.
  base: '/Habit-Builder-Wealth-Growth-Tracker/',

  plugins: [react(), tailwindcss(), githubPagesPlugin()],

  resolve: {
    // Support imports such as @/components/Nav and @/context/ThemeContext.
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
