// Prépare dist-pages/ : le site complet pour GitHub Pages (page + images), sans source ni PDF.
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
rmSync('dist-pages', { recursive: true, force: true });
mkdirSync('dist-pages', { recursive: true });
cpSync('dist-single/index.html', 'dist-pages/index.html');
if (existsSync('public/viz')) cpSync('public/viz', 'dist-pages/viz', { recursive: true });
writeFileSync('dist-pages/.nojekyll', '');
writeFileSync('dist-pages/README.md', '# Antisèche Python & Data\n\nSite publié : https://mobdico.github.io/antiseche/\n\nCe dépôt ne contient que le site compilé (généré automatiquement).\n');
console.log('dist-pages/ prêt');
