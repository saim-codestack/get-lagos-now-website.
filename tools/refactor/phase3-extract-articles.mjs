/* Phase 3 — blog article extraction.
   Reads the 49 approved articles/*.html (authoritative source, never tools/source/) and produces:
     src/_data/articles.json   — 49 records (verbatim bodyHtml + metadata + archive data)
     src/articles/<slug>.njk   — 49 slim templates (front matter: layout + slug)
   Writes only into src/; production articles/*.html are read-only.
   Bodies are never run through Markdown; verbatim HTML is emitted with | safe.
*/
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const articlesDir = join(root, 'articles');
const outData = join(root, 'src', '_data', 'articles.json');
const outTplDir = join(root, 'src', 'articles');

const stripLeadDotDot = (s) => (s.startsWith('../') ? s.slice(3) : s);
const slugFrom = (href) => href.replace(/^articles\//, '').replace(/\.html$/, '');

/* Raw field extractors — values are stored verbatim (entities preserved) so
   {{ value | safe }} in the template reproduces the original source. */
const attr = (html, re) => { const m = html.match(re); return m ? m[1] : null; };

const files = readdirSync(articlesDir).filter((f) => f.endsWith('.html')).sort();
if (files.length !== 49) throw new Error(`Expected 49 articles, found ${files.length}`);

const records = [];
for (const file of files) {
  const html = readFileSync(join(articlesDir, file), 'utf8');
  const slug = slugFrom(file);

  // --- head / meta ---
  const titleTag = attr(html, /<title>([\s\S]*?)<\/title>/);
  const title = attr(html, /<header class="article-heading container">[\s\S]*?<h1>([\s\S]*?)<\/h1>/);
  if (!title) throw new Error(`${file}: no article-heading h1`);
  if (titleTag !== `${title} | Get Lagos Now`) {
    throw new Error(`${file}: title tag mismatch\n  tag: ${titleTag}\n  h1:  ${title}`);
  }
  const description = attr(html, /<meta name="description" content="([\s\S]*?)"/) || '';
  const robotsM = html.match(/<meta name="robots" content="([^"]*)"/);
  const robots = robotsM ? robotsM[1] || null : null;
  const publishedTime = attr(html, /<meta property="article:published_time" content="([^"]+)"/);
  const modifiedTime = attr(html, /<meta property="article:modified_time" content="([^"]+)"/);
  if (!publishedTime || !modifiedTime) throw new Error(`${file}: missing article:published/modified_time`);
  const themeColor = html.match(/<meta name="theme-color"/) ? true : false;
  const preconnectFonts = html.match(/<link rel="preconnect" href="https:\/\/fonts\.googleapis\.com"/) ? true : false;
  const preconnectSource = html.match(/<link rel="preconnect" href="https:\/\/getlagosnow\.com"/) ? true : false;
  const date = attr(html, /<time datetime="([^"]+)">Published [^<]+<\/time>/);
  const updatedM = html.match(/<span>Updated ([^<]+)<\/span>/);
  const modified = updatedM ? updatedM[1] : date;
  const author = attr(html, /<span>By ([^<]+)<\/span>/);
  const categoryLabel = attr(html, /<header class="article-heading container">[\s\S]*?<p class="eyebrow">([^<]+)<\/p>/);
  if (!date || !modified || !author || !categoryLabel) {
    throw new Error(`${file}: missing meta field`);
  }

  // --- featured image (48/49; the BCorp review record has none) ---
  let featuredImage = null, featuredAlt = null, featuredWidth = null, featuredHeight = null, featuredCaption = null;
  const featBlock = html.match(/<figure class="article-featured">([\s\S]*?)<\/figure>/);
  if (featBlock) {
    const block = featBlock[1];
    const imgM = block.match(/<img[^>]*src="([^"]+)"[^>]*alt="([^"]*)"[^>]*>/);
    if (imgM) {
      featuredImage = stripLeadDotDot(imgM[1]);
      featuredAlt = imgM[2];
      const wM = block.match(/width="(\d+)"/);
      const hM = block.match(/height="(\d+)"/);
      featuredWidth = wM ? wM[1] : null;
      featuredHeight = hM ? hM[1] : null;
    }
    const capM = block.match(/<figcaption>([\s\S]*?)<\/figcaption>/);
    featuredCaption = capM ? capM[1] : null;
  }

  // --- body (verbatim, never Markdown) ---
  const bodyM = html.match(/<article class="article-body">([\s\S]*?)<\/article>/);
  if (!bodyM) throw new Error(`${file}: no article-body`);
  const bodyHtml = bodyM[1];

  // --- archive note ---
  const noteM = html.match(/<aside class="article-archive-note">([\s\S]*?)<\/aside>/);
  const archiveNoteText = noteM ? noteM[1] : null;

  // --- source link + article-source block (verbatim; link text varies per article) ---
  const srcM = html.match(/<a data-original-source="true" href="([^"]+)"/);
  const sourceUrl = srcM ? srcM[1] : null;
  const sourceBlock = html.match(/<div class="article-source">([\s\S]*?)<\/div>/);
  const articleSourceHtml = sourceBlock ? sourceBlock[1] : null;

  // --- related articles ---
  const related = [];
  const relBlock = html.match(/<nav class="article-related"[\s\S]*?<ul>([\s\S]*?)<\/ul>/);
  if (relBlock) {
    for (const m of relBlock[1].matchAll(/<li><a href="([^"]+)">([\s\S]*?)<\/a><\/li>/g)) {
      related.push({ href: m[1], text: m[2] });
    }
  }

  records.push({
    slug, title, description, robots, publishedTime, modifiedTime, date, modified,
    themeColor, preconnectFonts, preconnectSource,
    author, categoryLabel, categories: categoryLabel.split(' / ').map((s) => s.trim()),
    featuredImage, featuredAlt, featuredWidth, featuredHeight, featuredCaption,
    bodyHtml, archiveNoteText, sourceUrl, articleSourceHtml, related,
  });
}

// --- archive data from the published insights.html (cards / rows / featured) ---
const insightsHtml = readFileSync(join(root, 'insights.html'), 'utf8');
const bySlug = Object.fromEntries(records.map((r) => [r.slug, r]));

const setArchive = (slug, fields) => {
  if (!bySlug[slug]) throw new Error(`archive references unknown slug: ${slug}`);
  Object.assign(bySlug[slug], fields);
};

// featured block (editorial choice — sets the featured slug + hero overrides)
let featuredSlug = null;
const featuredBlock = insightsHtml.match(/<article class="journal-feature__grid reveal">([\s\S]*?)<\/article>/);
if (featuredBlock) {
  const fb = featuredBlock[1];
  const href = attr(fb, /href="([^"]+)"/);
  featuredSlug = href ? slugFrom(href) : null;
  const imgM = fb.match(/<img src="([^"]+)" alt="([^"]*)"/);
  const metaM = fb.match(/<span>([^<]+)<\/span><time datetime="([^"]+)">([^<]+)<\/time>/);
  const titleM = fb.match(/<h2[^>]*>([\s\S]*?)<\/h2>/);
  const excerptM = fb.match(/<\/h2>\s*<p>([\s\S]*?)<\/p>/);
  const heroW = fb.match(/width="(\d+)"/);
  const heroH = fb.match(/height="(\d+)"/);
  const ariaLabelM = fb.match(/aria-label="([^"]+)"/);
  if (href) setArchive(slugFrom(href), {
    inFeatured: true,
    heroAriaLabel: ariaLabelM ? ariaLabelM[1] : null,
    heroImage: imgM ? imgM[1] : null,
    heroAlt: imgM ? imgM[2] : null,
    heroWidth: heroW ? heroW[1] : null,
    heroHeight: heroH ? heroH[1] : null,
    heroMeta: metaM ? metaM[1] : null,
    heroDate: metaM ? metaM[2] : null,
    heroDateDisplay: metaM ? metaM[3] : null,
    heroTitle: titleM ? titleM[1] : null,
    heroExcerpt: excerptM ? excerptM[1] : null,
  });
}
if (!featuredSlug) throw new Error('could not determine featured article from insights.html');

// cards (4) — sequence 0-3
let cardOrder = 0;
for (const m of insightsHtml.matchAll(/<article class="journal-card" data-article-id="(\d+)" data-topics="([^"]*)">([\s\S]*?)<\/article>/g)) {
  const [, id, topics, body] = m;
  const href = attr(body, /href="([^"]+)"/);
  const imgM = body.match(/<img src="([^"]+)" alt="([^"]*)" width="(\d+)" height="(\d+)"[^>]*>/);
  const metaM = body.match(/<span>([^<]+)<\/span><time datetime="([^"]+)">([^<]+)<\/time>/);
  const titleM = body.match(/<h3 class="journal-card__title"><a href="[^"]*">([\s\S]*?)<\/a>/);
  const excerptM = body.match(/<p class="journal-card__excerpt">([\s\S]*?)<\/p>/);
  if (href) setArchive(slugFrom(href), {
    archiveImage: imgM ? imgM[1] : null,
    archiveAlt: imgM ? imgM[2] : null,
    archiveWidth: imgM ? imgM[3] : null,
    archiveHeight: imgM ? imgM[4] : null,
    archiveTopics: topics,
    archiveMeta: metaM ? metaM[1] : null,
    archiveDate: metaM ? metaM[2] : null,
    archiveDateDisplay: metaM ? metaM[3] : null,
    archiveTitle: titleM ? titleM[1] : null,
    archiveExcerpt: excerptM ? excerptM[1] : null,
    isCard: true, sequence: cardOrder++, archiveDataId: id,
  });
}

// rows (45) — sequence 100-144 (after cards)
let rowOrder = 0;
for (const m of insightsHtml.matchAll(/<article class="journal-row" data-article-id="(\d+)" data-topics="([^"]*)">([\s\S]*?)<\/article>/g)) {
  const [, id, topics, body] = m;
  const href = attr(body, /href="([^"]+)"/);
  const timeM = body.match(/<time datetime="([^"]+)">([^<]+)<\/time>/);
  const catM = body.match(/<\/time><span>([^<]+)<\/span>/);
  const titleM = body.match(/<h3><a href="[^"]*">([\s\S]*?)<\/a>/);
  if (href) setArchive(slugFrom(href), {
    archiveTopics: topics,
    archiveDate: timeM ? timeM[1] : null,
    archiveDateDisplay: timeM ? timeM[2] : null,
    archiveMeta: catM ? catM[1] : null,
    archiveTitle: titleM ? titleM[1] : null,
    isCard: false, sequence: 100 + rowOrder++, archiveDataId: id,
  });
}

// every article must appear in the archive (cards + rows = 49, disjoint)
const missingArchive = records.filter((r) => r.sequence === undefined);
if (missingArchive.length) throw new Error(`articles missing from archive: ${missingArchive.map((r) => r.slug).join(', ')}`);

// sort records newest-first by publication
records.sort((a, b) => (b.publishedTime || '').localeCompare(a.publishedTime || ''));

mkdirSync(join(root, 'src', '_data'), { recursive: true });
mkdirSync(outTplDir, { recursive: true });
writeFileSync(outData, JSON.stringify(records, null, 2) + '\n');

let written = 0;
for (const r of records) {
  const fm = { layout: 'layouts/article.njk', slug: r.slug };
  writeFileSync(join(outTplDir, `${r.slug}.njk`), '---json\n' + JSON.stringify(fm, null, 2) + '\n---\n');
  written += 1;
}

console.log('Phase 3 extraction complete.');
console.log('  source articles read:  ' + files.length);
console.log('  records written:       ' + records.length + ' -> ' + outData);
console.log('  templates written:     ' + written + ' -> ' + outTplDir + '/');
console.log('  featured article:      ' + featuredSlug);
console.log('  cards: ' + cardOrder + '  rows: ' + rowOrder + '  total archived: ' + (cardOrder + rowOrder));
console.log('  noindex: ' + (records.filter((r) => r.robots).map((r) => r.slug).join(', ') || 'none'));
console.log('  without featured image: ' + (records.filter((r) => !r.featuredImage).map((r) => r.slug).join(', ') || 'none'));
