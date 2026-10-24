import fs from 'node:fs';

try {
  if (fs.existsSync('dist/index.html')) {
    fs.copyFileSync('dist/index.html', 'dist/404.html');
    console.log('✓ Successfully copied dist/index.html -> dist/404.html for GitHub Pages SPA routing');
  } else {
    console.error('Error: dist/index.html not found');
    process.exit(1);
  }
} catch (err) {
  console.error('Failed to copy dist/index.html to dist/404.html:', err);
  process.exit(1);
}
