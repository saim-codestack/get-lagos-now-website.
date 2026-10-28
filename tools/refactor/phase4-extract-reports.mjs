/* Phase 4 — report extraction.
   Reads the 11 approved reports/*.html (authoritative source, never tools/source/) and produces:
     src/_data/reports.json   — 11 records (verbatim bodyHtml + metadata)
     src/reports/<slug>.njk   — 11 slim templates (front matter: layout + slug)
   Writes only into src/; production reports/*.html are read-only.
   Bodies are never run through Markdown; verbatim HTML is emitted with | safe.
*/
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const reportsDir = join(root, 'reports');
const outData = join(root, 'src', '_data', 'reports.json');
const outTplDir = join(root, 'src', 'reports');

const attr = (html, re) => { const m = html.match(re); return m ? m[1] : null; };

const files = readdirSync(reportsDir).filter((f) => f.endsWith('.html')).sort();
if (files.length !== 11) throw new Error(`Expected 11 reports, found ${files.length}`);

const records = [];
for (const file of files) {
  const html = readFileSync(join(reportsDir, file), 'utf8');
  const slug = file.replace(/\.html$/, '');

  // --- head / meta ---
  const titleTag = attr(html, /<title>([\s\S]*?)<\/title>/);
  const title = attr(html, /<h1>([\s\S]*?)<\/h1>/);
  if (!title) throw new Error(`${file}: no h1`);
  if (titleTag !== `${title} | Get Lagos Now`) {
    throw new Error(`${file}: title tag mismatch\n  tag: ${titleTag}\n  h1:  ${title}`);
  }
  const description = attr(html, /<meta name="description" content="([\s\S]*?)"/) || '';
  const robotsM = html.match(/<meta name="robots" content="([^"]*)"/);
  const robots = robotsM ? robotsM[1] || null : null;
  const themeColor = html.match(/<meta name="theme-color"/) ? true : false;
  const preconnectFonts = html.match(/<link rel="preconnect" href="https:\/\/fonts\.googleapis\.com"/) ? true : false;
  const preconnectSource = html.match(/<link rel="preconnect" href="https:\/\/getlagosnow\.com"/) ? true : false;

  // --- report-heading fields ---
  const eyebrow = attr(html, /<header class="report-heading container">[\s\S]*?<p class="eyebrow">([\s\S]*?)<\/p>/);
  const deck = attr(html, /<p class="report-deck">([\s\S]*?)<\/p>/);
  const sourceM = html.match(/<a data-original-source href="([^"]+)"/);
  const sourceUrl = sourceM ? sourceM[1] : null;
  if (!eyebrow || !deck || !sourceUrl) {
    throw new Error(`${file}: missing heading field`);
  }
  // Some reports (e.g. 2025) carry an extra un-classed paragraph after the
  // report-source block inside report-heading.
  const headerM = html.match(/<header class="report-heading container">([\s\S]*?)<\/header>/);
  const headerContent = headerM ? headerM[1] : '';
  const headingNote = [...headerContent.matchAll(/<p(?:\s+class="([^"]*)")?>([\s\S]*?)<\/p>/g)]
    .find(([, cls]) => !cls)?.[2] || null;

  // --- body (verbatim, full report-body element including attributes) ---
  const bodyM = html.match(/<article class="report-body"[\s\S]*?<\/article>/);
  if (!bodyM) throw new Error(`${file}: no report-body`);
  const bodyHtml = bodyM[0];

  const ariaLabelM = bodyM[0].match(/aria-label="([^"]+)"/);
  const ariaLabel = ariaLabelM ? ariaLabelM[1] : `${title} content`;

  records.push({
    slug, title, description, robots, themeColor, preconnectFonts, preconnectSource,
    eyebrow, deck, headingNote, sourceUrl, ariaLabel, bodyHtml,
  });
}

// newest-first (2025 → 2021), then community reports
records.sort((a, b) => (b.title || '').localeCompare(a.title || ''));

mkdirSync(join(root, 'src', '_data'), { recursive: true });
mkdirSync(outTplDir, { recursive: true });
writeFileSync(outData, JSON.stringify(records, null, 2) + '\n');

let written = 0;
for (const r of records) {
  const fm = { layout: 'layouts/report.njk', slug: r.slug };
  writeFileSync(join(outTplDir, `${r.slug}.njk`), '---json\n' + JSON.stringify(fm, null, 2) + '\n---\n');
  written += 1;
}

console.log('Phase 4 extraction complete.');
console.log('  source reports read:  ' + files.length);
console.log('  records written:      ' + records.length + ' -> ' + outData);
console.log('  templates written:    ' + written + ' -> ' + outTplDir + '/');
console.log('  robots:               ' + (records.filter((r) => r.robots).map((r) => r.slug).join(', ') || 'none'));
console.log('  slugs:                ' + records.map((r) => r.slug).join(', '));
