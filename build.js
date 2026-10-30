'use strict';

const fs = require('fs');
const path = require('path');

const SITE_URL = 'https://cherryquery.com';
const SRC = path.join(__dirname, 'src');
const DIST = path.join(__dirname, 'dist');
const REPLACEMENTS = {
  __MS_STORE_URL__: 'https://apps.microsoft.com/detail/9P9TZ1C5CLX9',
};
const SITEMAP = [
  { loc: '/', priority: '1.0' },
  { loc: '/privacy/', priority: '0.5' },
  { loc: '/terms/', priority: '0.5' },
  { loc: '/security/', priority: '0.5' },
];
const TEXT_EXT = /\.(html?|css|js|svg|txt|xml|json|webmanifest)$/i;

function listFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? listFiles(full) : [full];
  });
}

fs.rmSync(DIST, { recursive: true, force: true });

for (const file of listFiles(SRC)) {
  const out = path.join(DIST, path.relative(SRC, file));
  fs.mkdirSync(path.dirname(out), { recursive: true });
  if (TEXT_EXT.test(file)) {
    let text = fs.readFileSync(file, 'utf8');
    for (const [token, value] of Object.entries(REPLACEMENTS)) {
      text = text.split(token).join(value);
    }
    fs.writeFileSync(out, text, 'utf8');
  } else {
    fs.copyFileSync(file, out);
  }
}

const today = new Date().toISOString().slice(0, 10);
const urls = SITEMAP.map(({ loc, priority }) => 
  `  <url><loc>${SITE_URL}${loc}</loc><lastmod>${today}</lastmod><priority>${priority}</priority></url>`
).join('\n');
fs.writeFileSync(path.join(DIST, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
fs.writeFileSync(path.join(DIST, 'robots.txt'),
  `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);

console.log(`Built ${SITE_URL} -> ${path.relative(process.cwd(), DIST) || DIST}`);
