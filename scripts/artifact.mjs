// Transforme dist-single/index.html en fragment publiable sur claude.ai (sans <html>/<head>/<body>).
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const html = readFileSync('dist-single/index.html', 'utf8');
const title = html.match(/<title>[\s\S]*?<\/title>/)?.[0] ?? '<title>Antisèche Data</title>';
const styles = [...html.matchAll(/<style[^>]*>[\s\S]*?<\/style>/g)].map((m) => m[0]).join('\n');
const scripts = [...html.matchAll(/<script[^>]*>[\s\S]*?<\/script>/g)].map((m) => m[0]).join('\n');
mkdirSync('dist-artifact', { recursive: true });
writeFileSync('dist-artifact/antiseche.html', `${title}\n${styles}\n<div id="root"></div>\n${scripts}\n`);
console.log('dist-artifact/antiseche.html', (Buffer.byteLength(readFileSync('dist-artifact/antiseche.html')) / 1024).toFixed(0) + ' Ko');
