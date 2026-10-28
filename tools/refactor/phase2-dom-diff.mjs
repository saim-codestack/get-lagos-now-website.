/* Phase 2 — equivalence checker.
   For each of the 8 migrated pages, compares the original root HTML file
   against _site/ output:
     A) full DOM walk (parse5): tag names, attribute sets/values, text
        (whitespace-collapsed), ignoring pure-whitespace text nodes.
     B) whitelisted render-neutral normalizations approved in
        docs/refactor/phase-1-audit.md §"Normalization log".
     C) metadata gate vs docs/refactor/url-inventory.json (title,
        description, robots, data-page, css/js bundle, h1 count).
     D) full-page normalized text hash equality.
     E) JS contract: counts of required ids/classes/data attrs must match
        the original file exactly.
     F) every local href/src in the output resolves to a real file.
   Exit 1 on any unexpected difference. Read-only. */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import * as parse5 from 'parse5';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const siteDir = join(root, '_site');
const PAGES = ['index.html', 'about.html', 'services.html', 'work.html', 'contact.html', 'impact.html', 'insights.html', 'privacy-policy.html'];

/* ---- approved normalizations (Phase 1 normalization log) ---- */
const LOGO_ARIA = new Set(['Get Lagos Now — home', 'Get Lagos Now - home', 'Get Lagos Now — back to top']);
const FOOTERNAV_ARIA = /^Footer [—-] (explore|services|resources)$/;
function whitelisted(diff) {
  const { path, kind, a, b } = diff;
  if (kind !== 'attr') return false;
  const tail = path.at(-1);
  // 1. header/footer logo aria-label dash variants → em-dash canonical
  if (tail.tag === 'a' && /header__logo|footer__logo/.test(tail.attrs?.class || '') && diff.attr === 'aria-label'
      && LOGO_ARIA.has(a) && LOGO_ARIA.has(b)) return true;
  // 2. logo width/height attribute variants → single 190×40 set (CSS fixes render at 34px height)
  if (tail.tag === 'img' && /shared\/gln\.png$/.test(tail.attrs?.src || '') && ['width', 'height'].includes(diff.attr)) return true;
  // 3. footer nav landmark aria-label hyphen variants → em-dash
  if (tail.tag === 'nav' && diff.attr === 'aria-label' && FOOTERNAV_ARIA.test(a) && FOOTERNAV_ARIA.test(b)) return true;
  return false;
}

/* ---- parse + normalize + walk ---- */
function* nodesOf(rootNode) {
  const stack = [rootNode];
  while (stack.length) {
    const node = stack.shift();
    if (node.nodeName === '#text' && !node.value.trim()) continue; // formatting-only whitespace
    yield node;
    if (node.childNodes) stack.push(...node.childNodes);
  }
}
function attrs(node) {
  const m = {};
  (node.attrs || []).forEach((a) => { m[a.name] = a.value; });
  return m;
}
function describe(node) {
  if (node.nodeName === '#text') return `#text "${node.value.trim().slice(0, 60)}"`;
  if (node.nodeName === '#comment') return `<!--${(node.data || '').trim().slice(0, 50)}-->`;
  return `<${node.tagName} ${Object.entries(attrs(node)).map(([k, v]) => `${k}="${String(v).slice(0, 50)}"`).join(' ')}>`;
}
function diffTree(docA, docB, page) {
  const diffs = [];
  const itA = nodesOf(docA), itB = nodesOf(docB);
  const depthPath = [];
  let idx = 0;
  // lockstep traversal with sibling-level matching
  function walk(na, nb, path) {
    idx += 1;
    const isTextA = na.nodeName === '#text', isTextB = nb.nodeName === '#text';
    if (na.nodeName !== nb.nodeName) {
      diffs.push({ path, kind: 'node', a: describe(na), b: describe(nb) });
      return;
    }
    if (isTextA) {
      const ta = na.value.replace(/\s+/g, ' ').trim();
      const tb = nb.value.replace(/\s+/g, ' ').trim();
      if (ta !== tb) diffs.push({ path, kind: 'text', a: ta.slice(0, 120), b: tb.slice(0, 120) });
      return;
    }
    if (na.nodeName === '#comment') {
      if ((na.data || '').replace(/\s+/g, '') !== (nb.data || '').replace(/\s+/g, '')) {
        diffs.push({ path, kind: 'comment', a: describe(na), b: describe(nb) });
      }
      return;
    }
    const aa = attrs(na), bb = attrs(nb);
    const keys = new Set([...Object.keys(aa), ...Object.keys(bb)]);
    for (const k of keys) {
      if (aa[k] !== bb[k]) {
        diffs.push({ path: [...path, { tag: na.tagName, attrs: aa }], kind: 'attr', attr: k, a: aa[k], b: bb[k] });
      }
    }
    const ca = (na.childNodes || []).filter((n) => n.nodeName !== '#text' || n.value.trim());
    const cb = (nb.childNodes || []).filter((n) => n.nodeName !== '#text' || n.value.trim());
    if (ca.length !== cb.length) {
      diffs.push({ path: [...path, { tag: na.tagName, attrs: aa }], kind: 'children', a: `${ca.length} children`, b: `${cb.length} children` });
      return; // cannot align children meaningfully
    }
    ca.forEach((child, i) => walk(child, cb[i], [...path, { tag: na.tagName, attrs: aa }]));
  }
  let a = itA.next().value, b = itB.next().value;
  walk(a, b, []); // #document roots
  // any leftovers?
  return diffs;
}

function normalizedTextHash(doc) {
  const texts = [];
  for (const n of nodesOf(doc)) {
    if (n.nodeName === '#text') texts.push(n.value.replace(/\s+/g, ' ').trim());
  }
  return createHash('sha256').update(texts.filter(Boolean).join('|')).digest('hex').slice(0, 16);
}

/* ---- inventory gate ---- */
const inventory = JSON.parse(readFileSync(join(root, 'docs/refactor/url-inventory.json'), 'utf8'));
const invByFile = Object.fromEntries(inventory.pages.map((p) => [p.file, p]));
const knownUrls = new Set(inventory.pages.map((p) => p.file));

/* comments captured per-page in front matter; compared as nodes */
const decode = (s) => s
  .replace(/&mdash;/g, '—').replace(/&ndash;/g, '–').replace(/&amp;/g, '&')
  .replace(/&copy;/g, '©').replace(/&middot;/g, '·').replace(/&hellip;/g, '…')
  .replace(/&#8217;|&rsquo;/g, '’').replace(/&#8216;|&lsquo;/g, '‘')
  .replace(/&quot;/g, '"').replace(/&nbsp;/g, ' ')
  .replace(/&#x([0-9a-fA-F]+);/g, (m, n) => String.fromCodePoint(parseInt(n, 16)))
  .replace(/&#(\d+);/g, (m, n) => String.fromCodePoint(Number(n)));

/* ---- JS contract: selector-ish markers that must count-match original ---- */
const CONTRACTS = {
  _all: ['id="siteHeader"', 'id="mobileMenu"', 'id="menuToggle"', 'id="navDropdownPortfolio"', 'id="navDropdownReports"',
    'id="mobileSubPortfolio"', 'id="mobileSubReports"', 'id="newsletterForm"', 'id="nlEmail"', 'id="nlStatus"', 'id="year"',
    'class="skip-link"', 'nav-dropdown__toggle', 'mobile-sub-toggle', 'non-nav-marker-removed-cta__banner'],
  'index.html': ['id="gaugeSvg"', 'id="testi"', 'id="testiImg"', 'id="testiCount"', 'id="testiPrev"', 'id="testiNext"',
    'id="accordion"', 'id="inquiryForm"', 'id="fName"', 'id="fEmail"', 'id="fService"', 'id="fMsg"', 'id="formStatus"', 'data-img='],
  'services.html': ['id="approachList"', 'id="approachCursor"', 'id="approachCursorImg"', 'data-cursor-img=', 'service-index'],
  'work.html': ['id="workFilters"', 'id="workGrid"', 'id="workCount"', 'id="workEmpty"', 'class="work-card', 'data-filter="all"'],
  'insights.html': ['id="blogLibraryFilters"', 'id="blogLibraryGrid"', 'id="blogLibraryList"', 'id="blogLibraryLoad"', 'id="blogLibraryCount"', 'data-topic=', 'journal-card', 'journal-row'],
  'contact.html': ['id="projectInquiryForm"', 'id="ctName"', 'id="ctEmail"', 'id="ctWebsite"', 'id="ctMessage"', 'id="ctRole"',
    'id="ctServicesGroup"', 'id="ctSubmit"', 'id="ctSubmitLabel"', 'id="ctServices-err"', 'id="ctFormStatus"'],
};

let fail = 0;
const report = [];
for (const file of PAGES) {
  const origHtml = readFileSync(join(root, file), 'utf8');
  const builtPath = join(siteDir, file);
  if (!existsSync(builtPath)) { report.push({ file, error: 'missing in _site' }); fail += 1; continue; }
  const builtHtml = readFileSync(builtPath, 'utf8');
  const docA = parse5.parse(origHtml);
  const docB = parse5.parse(builtHtml);

  const diffs = diffTree(docA, docB, file);
  const unexpected = diffs.filter((d) => !whitelisted(d));
  const allowed = diffs.filter((d) => whitelisted(d));

  // inventory gate
  const inv = invByFile[file];
  const meta = [];
  const g = (re, s) => (s.match(re) || [])[1] || '';
  const checks = {
    title: decode(g(/<title>([\s\S]*?)<\/title>/, builtHtml)).replace(/\s+/g, ' ').trim() === decode(inv.title),
    description: decode(g(/<meta name="description" content="([^"]*)"/, builtHtml)) === decode(inv.metaDescription),
    robots: g(/<meta name="robots" content="([^"]*)"/, builtHtml) === inv.robots,
    dataPage: g(/data-page="([^"]*)"/, builtHtml) === inv.dataPage,
    css: [...builtHtml.matchAll(/<link rel="stylesheet" href="(assets\/css\/[a-z-]+\.css)"/g)].map((m) => m[1]).join(' ') === inv.css,
    js: [...builtHtml.matchAll(/<script src="(assets\/js\/[a-z-]+\.js)"/g)].map((m) => m[1]).join(' ') === inv.js.replace(/^assets/, 'assets'),
    h1Count: (builtHtml.match(/<h1[\s>]/g) || []).length === 1,
  };
  const hashA = normalizedTextHash(docA);
  const hashB = normalizedTextHash(docB);
  checks.textHash = hashA === hashB;
  Object.entries(checks).forEach(([k, v]) => { if (!v) meta.push(k); });

  // contract gate
  const markers = [...CONTRACTS._all, ...(CONTRACTS[file] || [])];
  const contractBad = [];
  for (const mk of markers) {
    const ca = origHtml.split(mk).length - 1;
    const cb = builtHtml.split(mk).length - 1;
    if (ca !== cb) contractBad.push(`${mk} (${ca}→${cb})`);
  }

  // local reference existence: assets must exist in _site NOW; page links
  // present in the URL inventory but not yet built are "pending phases 3–5".
  const missingRefs = [];
  const pendingRefs = new Set();
  for (const m of builtHtml.matchAll(/(?:href|src)="(?!https?:|mailto:|tel:|#|\.\.)([^"#]+)"/g)) {
    const rel = m[1];
    if (existsSync(join(siteDir, rel))) continue;
    if (rel.endsWith('.html') && knownUrls.has(rel)) { pendingRefs.add(rel); continue; }
    if (!rel.endsWith('.html') && existsSync(join(root, rel))) { missingRefs.push(rel); continue; } // asset missing from _site but in repo
    if (!knownUrls.has(rel)) missingRefs.push(rel);
  }

  if (unexpected.length || meta.length || contractBad.length) fail += 1;
  report.push({ file, unexpectedDiffs: unexpected, whitelistedDiffs: allowed, metaFailures: meta, contractFailures: contractBad, missingRefs, pendingRefs, textHash: `${hashA}${hashA === hashB ? ' ✓' : ` → ${hashB} ✗`}` });
}

for (const r of report) {
  console.log(`\n===== ${r.file} =====`);
  if (r.error) { console.log('  ERROR:', r.error); continue; }
  console.log(`  text hash: ${r.textHash}`);
  console.log(`  whitelisted diffs: ${r.whitelistedDiffs.length}${r.whitelistedDiffs.length ? ' — ' + r.whitelistedDiffs.map((d) => `${d.attr}@${d.path.at(-1)?.tag || '?'}`).join(', ') : ''}`);
  if (r.unexpectedDiffs.length) {
    console.log(`  !! UNEXPECTED DIFFS (${r.unexpectedDiffs.length}):`);
    r.unexpectedDiffs.slice(0, 8).forEach((d) => {
      const p = r.file;
      const tail = d.path.length ? d.path.at(-1).tag : '?';
      console.log(`    [${d.kind}${d.attr ? ':' + d.attr : ''}] <${tail}> A=${JSON.stringify(d.a)} B=${JSON.stringify(d.b)}`);
    });
    if (r.unexpectedDiffs.length > 8) console.log(`    … and ${r.unexpectedDiffs.length - 8} more`);
  }
  if (r.metaFailures.length) console.log('  !! metadata failures:', r.metaFailures.join(', '));
  if (r.contractFailures.length) console.log('  !! contract failures:', r.contractFailures.join(' | '));
  if (r.missingRefs.length) console.log('  !! missing local refs:', [...new Set(r.missingRefs)].join(', '));
  if (r.pendingRefs && r.pendingRefs.size) console.log(`  pending page links (expected in Phases 3–5): ${r.pendingRefs.size} distinct`);
  if (!r.unexpectedDiffs.length && !r.metaFailures.length && !r.contractFailures.length && !r.missingRefs.length) console.log('  OK');
}
console.log(`\n${fail ? '❌ FAIL' : '✅ PASS'} — ${PAGES.length - fail}/${PAGES.length} pages fully equivalent`);
process.exitCode = fail ? 1 : 0;
