/**
 * Writes dist/<route>/index.html for every marketing route, using the SSR bundle in dist-ssr/.
 * Head tags (title, meta, canonical, hreflang) are moved from the rendered body into <head>.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const ssrDir = path.join(root, 'dist-ssr');
const { render, routes } = await import(pathToFileURL(path.join(ssrDir, 'entry-server.js')).href);

const template = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
const vercelRoutes = fs.readFileSync(path.join(root, 'vercel.json'), 'utf8');

// Tags React emits for PageSEO; anything matching is lifted into <head>.
const HEAD_TAG = /<title>[\s\S]*?<\/title>|<meta (?:name|property)="(?:description|og:[^"]+|twitter:[^"]+)"[^>]*\/?>|<link rel="(?:canonical|alternate)"[^>]*\/?>/g;
// Template fallbacks that a page-specific tag replaces.
const TEMPLATE_DUPES = /\s*<title>[\s\S]*?<\/title>|\s*<meta (?:name="description"|property="og:[^"]+"|name="twitter:[^"]+")[^>]*>/g;

let count = 0;
for (const route of routes) {
  const body = render(route);
  const headTags = body.match(HEAD_TAG) ?? [];
  const cleanBody = body.replace(HEAD_TAG, '');
  const lang = route === '/th' || route.startsWith('/th/') ? 'th' : 'en';

  const html = template
    .replace(/<html lang="[^"]*">/, `<html lang="${lang}">`)
    .replace(TEMPLATE_DUPES, '')
    .replace('</head>', `    ${headTags.join('\n    ')}\n  </head>`)
    .replace('<div id="root"></div>', `<div id="root">${cleanBody}</div>`);

  // dist/index.html stays the clean SPA shell (app.pimsuea.com shares this build).
  // '/' → dist/home.html, '/th/pricing' → dist/th/pricing.html; vercel.json routes them for the marketing host only.
  const outFile = route === '/' ? path.join(dist, 'home.html') : path.join(dist, `${route.slice(1)}.html`);
  if (!route.split('/').filter(Boolean).every((seg) => vercelRoutes.includes(seg))) {
    throw new Error(`vercel.json has no marketing route for ${route}`);
  }
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, html);
  count += 1;
  console.log(`prerendered ${route} (${headTags.length} head tags)`);
}

fs.rmSync(ssrDir, { recursive: true, force: true });
console.log(`prerender: ${count} pages written`);
