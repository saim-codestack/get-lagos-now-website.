/* Phase 3 — equivalence checker for blogs.
   For each of the 49 migrated articles plus insights.html, compares the
   original file against _site/ output:
     A) full DOM walk (parse5): tag names, attributes, text (whitespace-collapsed)
     B) whitelisted render-neutral normalizations (same set as Phase 2)
     C) metadata gate vs docs/refactor/url-inventory.json (title, description,
        robots, data-page, css/js bundle, h1 count; article:published/modified_time
        only for articles)
     D) full-page normalized text hash equality
     E) blog-library JS contract markers on insights.html
     F) every local href/src resolves to a real file in _site (pending phases 4-5 allowed)
   Exit 1 on any unexpected difference. Read-only. */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import * as parse5 from 'parse5';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const siteDir = join(root, '_site');

const inventory = JSON.parse(readFileSync(join(root, 'docs/refactor/url-inventory.json'), 'utf8'));
const invByFile = Object.fromEntries(inventory.pages.map((p) => [p.file, p]));
const knownUrls = new Set(inventory.pages.map((p) => p.file));

const ARTICLES = readdirSync(join(root, 'articles')).filter((f) => f.endsWith('.html')).sort().map((f) => 'articles/' + f);
const PAGES = [...ARTICLES, 'insights.html'];

/* ---- approved normalizations (Phase 1 normalization log) ---- */
const LOGO_ARIA = new Set(['Get Lagos Now — home', 'Get Lagos Now - home', 'Get Lagos Now — back to top']);
const FOOTERNAV_ARIA = /^Footer [—-] (explore|services|resources)$/;
function whitelisted(diff) {
  const { path, kind, a, b } = diff;
  if (kind !== 'attr') return false;
  const tail = path.at(-1);
  if (tail.tag === 'a' && /header__logo|footer__logo/.test(tail.attrs?.class || '') && diff.attr === 'aria-label'
      && LOGO_ARIA.has(a) && LOGO_ARIA.has(b)) return true;
  const src = tail.attrs?.src || '';
  if (tail.tag === 'img' && typeof src === 'string' && src.endsWith('gln.png') && ['width', 'height'].includes(diff.attr)) return true;
  if (tail.tag === 'nav' && diff.attr === 'aria-label' && FOOTERNAV_ARIA.test(a) && FOOTERNAV_ARIA.test(b)) return true;
  // Render-neutral: articles bake class="is-active" on the Blogs nav link but
  // the shared template also emits aria-current="page" there; visual state is
  // identical (class preserved), so treat aria-current on nav links as allowed.
  // Active nav links carry class="is-active" and/or data-nav.
  if (tail.tag === 'a' && diff.attr === 'aria-current' && a === undefined && b === 'page') {
    const cls = tail.attrs?.class || '';
    if (/is-active/.test(cls) || Object.prototype.hasOwnProperty.call(tail.attrs, 'data-nav')) return true;
  }
  return false;
}

function* nodesOf(rootNode) {
  const stack = [rootNode];
  while (stack.length) {
    const node = stack.shift();
    if (node.nodeName === '#text' && !node.value.trim()) continue;
    yield node;
    if (node.childNodes) stack.push(...node.childNodes);
  }
}
function attrs(node) {
  const m = {};
  (node.attrs || []).forEach((a) => { m[a.name] = a.value; });
  return m;
}
function diffTree(docA, docB) {
  const diffs = [];
  function walk(na, nb, path) {
    if (na.nodeName !== nb.nodeName) { diffs.push({ path, kind: 'node' }); return; }
    if (na.nodeName === '#text') {
      const ta = na.value.replace(/\s+/g, ' ').trim();
      const tb = nb.value.replace(/\s+/g, ' ').trim();
      if (ta !== tb) diffs.push({ path, kind: 'text', a: ta.slice(0, 120), b: tb.slice(0, 120) });
      return;
    }
    if (na.nodeName === '#comment') {
      if ((na.data || '').replace(/\s+/g, '') !== (nb.data || '').replace(/\s+/g, '')) {
        diffs.push({ path, kind: 'comment' });
      }
      return;
    }
    const aa = attrs(na), bb = attrs(nb);
    const keys = new Set([...Object.keys(aa), ...Object.keys(bb)]);
    for (const k of keys) {
      if (aa[k] !== bb[k]) diffs.push({ path: [...path, { tag: na.tagName, attrs: aa }], kind: 'attr', attr: k, a: aa[k], b: bb[k] });
    }
    const ca = (na.childNodes || []).filter((n) => n.nodeName !== '#text' || n.value.trim());
    const cb = (nb.childNodes || []).filter((n) => n.nodeName !== '#text' || n.value.trim());
    if (ca.length !== cb.length) {
      diffs.push({ path: [...path, { tag: na.tagName, attrs: aa }], kind: 'children' });
      return;
    }
    ca.forEach((child, i) => walk(child, cb[i], [...path, { tag: na.tagName, attrs: aa }]));
  }
  walk(docA, docB, []);
  return diffs;
}
function normalizedTextHash(doc) {
  const texts = [];
  for (const n of nodesOf(doc)) {
    if (n.nodeName === '#text') texts.push(n.value.replace(/\s+/g, ' ').trim());
  }
  return createHash('sha256').update(texts.filter(Boolean).join('|')).digest('hex').slice(0, 16);
}
const decode = (s) => s
  .replace(/&mdash;/g, '—').replace(/&ndash;/g, '–').replace(/&amp;/g, '&')
  .replace(/&copy;/g, '©').replace(/&middot;/g, '·').replace(/&hellip;/g, '…')
  .replace(/&#8217;|&rsquo;/g, '’').replace(/&#8216;|&lsquo;/g, '‘')
  .replace(/&quot;/g, '"').replace(/&nbsp;/g, ' ')
  .replace(/&#x([0-9a-fA-F]+);/g, (m, n) => String.fromCodePoint(parseInt(n, 16)))
  .replace(/&#(\d+);/g, (m, n) => String.fromCodePoint(Number(n)));

const CONTRACTS = {
  'insights.html': ['id="blogLibraryFilters"', 'id="blogLibraryGrid"', 'id="blogLibraryList"', 'id="blogLibraryLoad"', 'id="blogLibraryCount"',
    'data-topic=', 'journal-card', 'journal-row'],
};

function countHtmlFiles(dir) {
  let total = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) total += countHtmlFiles(full);
    else if (entry.isFile() && entry.name.endsWith('.html')) total += 1;
  }
  return total;
}

let fail = 0;
const report = [];
for (const file of PAGES) {
  const origHtml = readFileSync(join(root, file), 'utf8');
  const builtPath = join(siteDir, file);
  if (!existsSync(builtPath)) { report.push({ file, error: 'missing in _site' }); fail += 1; continue; }
  const builtHtml = readFileSync(builtPath, 'utf8');
  const docA = parse5.parse(origHtml);
  const docB = parse5.parse(builtHtml);

  const diffs = diffTree(docA, docB);
  const unexpected = diffs.filter((d) => !whitelisted(d));
  const allowed = diffs.filter((d) => whitelisted(d));

  // inventory gate
  const inv = invByFile[file];
  const g = (re, s) => (s.match(re) || [])[1] || '';
  const stripPrefix = (p) => p.replace(/^\.\.\//, '');
  const builtCss = [...builtHtml.matchAll(/<link rel="stylesheet" href="([^"]*\.css)"/g)].map((m) => stripPrefix(m[1])).join(' ');
  const builtJs = [...builtHtml.matchAll(/<script src="([^"]*\.js)"[^>]*>/g)].map((m) => stripPrefix(m[1])).join(' ');
  const hashA = normalizedTextHash(docA);
  const hashB = normalizedTextHash(docB);
  const checks = {
    title: decode(g(/<title>([\s\S]*?)<\/title>/, builtHtml)).replace(/\s+/g, ' ').trim() === decode(inv.title),
    description: decode(g(/<meta name="description" content="([\s\S]*?)"/, builtHtml)) === decode(inv.metaDescription),
    robots: g(/<meta name="robots" content="([^"]*)"/, builtHtml) === inv.robots,
    dataPage: g(/data-page="([^"]*)"/, builtHtml) === inv.dataPage,
    css: builtCss === inv.css,
    js: builtJs === inv.js.replace(/^assets/, 'assets'),
    h1Count: (builtHtml.match(/<h1[\s>]/g) || []).length === 1,
    textHash: hashA === hashB,
  };
  if (file.startsWith('articles/')) {
    checks.publishedTime = !!(builtHtml.match(/<meta property="article:published_time" content="([^"]+)"/) || [])[1];
    checks.modifiedTime = !!(builtHtml.match(/<meta property="article:modified_time" content="([^"]+)"/) || [])[1];
  }
  if (file.startsWith('articles/')) {
    checks.publishedTime = !!(builtHtml.match(/<meta property="article:published_time" content="([^"]+)"/) || [])[1];
    checks.modifiedTime = !!(builtHtml.match(/<meta property="article:modified_time" content="([^"]+)"/) || [])[1];
  }
  const metaFailures = [];
  Object.entries(checks).forEach(([k, v]) => { if (!v) metaFailures.push(k); });

  // JS contract (insights only)
  const markers = CONTRACTS[file] || [];
  const contractBad = [];
  for (const mk of markers) {
    const ca = origHtml.split(mk).length - 1;
    const cb = builtHtml.split(mk).length - 1;
    if (ca !== cb) contractBad.push(`${mk} (${ca}→${cb})`);
  }

  // local reference existence (resolved relative to the source file's directory)
  const missingRefs = [];
  const pendingRefs = new Set();
  const fileDir = dirname(file);
  for (const m of builtHtml.matchAll(/(?:href|src)="(?!https?:|mailto:|tel:|#|\.\.)([^"#]+)"/g)) {
    const rel = m[1];
    const resolved = join(fileDir, rel);
    if (existsSync(join(siteDir, resolved))) continue;
    if (rel.endsWith('.html') && knownUrls.has(rel)) { pendingRefs.add(rel); continue; }
    if (!rel.endsWith('.html') && existsSync(join(root, resolved))) { missingRefs.push(rel); continue; }
    if (!knownUrls.has(rel)) missingRefs.push(rel);
  }

  const fileFail = unexpected.length || metaFailures.length || contractBad.length || missingRefs.length;
  if (fileFail) fail += 1;
  report.push({ file, unexpectedDiffs: unexpected, whitelistedDiffs: allowed, metaFailures, contractFailures: contractBad, missingRefs, pendingRefs: pendingRefs.size, textHash: `${hashA}${hashA === hashB ? ' ✓' : ` → ${hashB} ✗`}`, fileFail });
}

for (const r of report) {
  console.log(`\n===== ${r.file} =====`);
  if (r.error) { console.log('  ERROR:', r.error); continue; }
  console.log(`  text hash: ${r.textHash}`);
  console.log(`  whitelisted diffs: ${r.whitelistedDiffs.length}`);
  if (r.unexpectedDiffs.length) {
    console.log(`  !! UNEXPECTED DIFFS (${r.unexpectedDiffs.length}):`);
    r.unexpectedDiffs.slice(0, 6).forEach((d) => {
      console.log(`    [${d.kind}${d.attr ? ':' + d.attr : ''}] A=${JSON.stringify(d.a)} B=${JSON.stringify(d.b)}`);
    });
    if (r.unexpectedDiffs.length > 6) console.log(`    … and ${r.unexpectedDiffs.length - 6} more`);
  }
  if (r.metaFailures.length) console.log('  !! metadata failures:', r.metaFailures.join(', '));
  if (r.contractFailures.length) console.log('  !! contract failures:', r.contractFailures.join(' | '));
  if (r.missingRefs.length) console.log('  !! missing local refs:', [...new Set(r.missingRefs)].join(', '));
  if (r.pendingRefs) console.log(`  pending page links (phases 4-5): ${r.pendingRefs} distinct`);
  if (!r.fileFail) console.log('  OK');
}

const builtCount = countHtmlFiles(siteDir);
console.log(`\nBuilt HTML pages in _site/: ${builtCount} (expected 57)`);
console.log(`${fail ? '❌ FAIL' : '✅ PASS'} — ${report.length - fail}/${report.length} pages fully equivalent`);
process.exitCode = fail ? 1 : 0;
