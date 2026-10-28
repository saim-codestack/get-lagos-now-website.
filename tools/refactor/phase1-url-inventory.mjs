/* Phase 1 (Eleventy refactor) — production URL inventory generator.
   Dev-only. Scans the 73 production HTML files (root, articles/, reports/)
   and emits docs/refactor/url-inventory.json + url-inventory.csv.
   Does not modify any production file. Re-run anytime to refresh. */
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

const rootPages = readdirSync(root).filter(f => f.endsWith('.html'));
const articlePages = readdirSync(join(root, 'articles')).filter(f => f.endsWith('.html')).map(f => `articles/${f}`);
const reportPages = readdirSync(join(root, 'reports')).filter(f => f.endsWith('.html')).map(f => `reports/${f}`);
const files = [...rootPages, ...articlePages.sort(), ...reportPages.sort()];

const pick = (re, s) => (s.match(re) || [])[1] || '';
const sha = s => createHash('sha256').update(s).digest('hex').slice(0, 16);
const textOf = html => html
  .replace(/<script[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&amp;/g, '&').replace(/&copy;/g, '©').replace(/&#8217;|&rsquo;/g, '’')
  .replace(/\s+/g, ' ').trim();

const rows = files.map(file => {
  const html = readFileSync(join(root, file), 'utf8');
  const css = [...html.matchAll(/<link rel="stylesheet" href="(?:\.\.\/)?(assets\/css\/[a-z-]+\.css)"/g)].map(m => m[1]);
  const js = [...html.matchAll(/<script src="(?:\.\.\/)?(assets\/js\/[a-z-]+\.js)"/g)].map(m => m[1]);
  const internalLinks = [...html.matchAll(/href="(?!https?:|mailto:|tel:|#)([^"#]+)/g)]
    .map(m => m[1].replace(/^\.\.\//, '')).filter(Boolean);
  const externalLinks = [...html.matchAll(/href="(https?:\/\/[^"]+)"/g)].map(m => m[1]);
  const images = [...html.matchAll(/<img [^>]*src="([^"]+)"/g)].map(m => m[1].replace(/^\.\.\//, ''));
  const text = textOf(html);
  return {
    url: '/' + (file === 'index.html' ? '' : file),
    file,
    group: file.startsWith('articles/') ? 'article'
      : file.startsWith('reports/') ? 'report-detail'
      : file,
    title: pick(/<title>([\s\S]*?)<\/title>/, html).replace(/\s+/g, ' ').trim(),
    metaDescription: pick(/<meta name="description" content="([^"]*)"/, html),
    robots: pick(/<meta name="robots" content="([^"]*)"/, html),
    publishedTime: pick(/property="article:published_time" content="([^"]*)"/, html),
    modifiedTime: pick(/property="article:modified_time" content="([^"]*)"/, html),
    dataPage: pick(/data-page="([^"]*)"/, html),
    bodyClass: pick(/<body class="([^"]*)"/, html),
    css: css.join(' '),
    js: js.join(' ') || 'assets/js/main.js',
    h1Count: (html.match(/<h1[\s>]/g) || []).length,
    h1: textOf(pick(/<h1[^>]*>([\s\S]*?)<\/h1>/, html)),
    counts: {
      internalLinks: internalLinks.length,
      distinctInternal: new Set(internalLinks).size,
      externalLinks: externalLinks.length,
      images: images.length,
      bytes: Buffer.byteLength(html),
      words: text.split(' ').length,
    },
    hashSource: sha(html),
    hashText: sha(text),
  };
});

// Sanity assertions — the inventory must describe the known production site.
const problems = [];
if (rows.length !== 73) problems.push(`expected 73 pages, found ${rows.length}`);
rows.forEach(r => { if (r.h1Count !== 1) problems.push(`${r.file}: ${r.h1Count} h1 elements`); });

const outDir = join(root, 'docs', 'refactor');
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'url-inventory.json'),
  JSON.stringify({ generated: new Date().toISOString(), phase: '1', pageCount: rows.length, problems, pages: rows }, null, 2));

const esc = v => `"${String(v).replace(/"/g, '""')}"`;
const csv = ['url,file,group,title,metaDescription,robots,dataPage,css,js,h1,internalLinks,externalLinks,images,bytes,words,hashText',
  ...rows.map(r => [r.url, r.file, r.group, r.title, r.metaDescription, r.robots, r.dataPage, r.css, r.js, r.h1,
    r.counts.distinctInternal, r.counts.externalLinks, r.counts.images, r.counts.bytes, r.counts.words, r.hashText].map(esc).join(','))
].join('\n');
writeFileSync(join(outDir, 'url-inventory.csv'), csv + '\n');

console.log(`inventory: ${rows.length} pages -> docs/refactor/url-inventory.{json,csv}`);
console.log(`totals: ${rows.reduce((a, r) => a + r.counts.bytes, 0)} bytes of HTML,`,
  `${rows.reduce((a, r) => a + r.counts.externalLinks, 0)} external link refs,`,
  `${rows.reduce((a, r) => a + r.counts.images, 0)} image refs`);
if (problems.length) { console.log('PROBLEMS:'); problems.forEach(p => console.log(' -', p)); process.exitCode = 1; }
else console.log('sanity: 73 pages, exactly one <h1> each — OK');
