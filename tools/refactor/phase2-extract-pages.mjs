/* Phase 2 — page extraction: converts the 8 approved root pages into
   Eleventy Nunjucks templates. Page <main> content is copied VERBATIM
   (minus the trailing CTA section, which becomes the shared cta-banner
   component). Head fields (title/description/css/js) are parsed from the
   original files so no value is retyped by hand.
   Read-only with respect to production files; writes only into src/. */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

/* decode the handful of named/numeric entities used in titles & descriptions
   so Nunjucks emits plain characters (parse-identical DOM text). */
const decode = (s) => s
  .replace(/&mdash;/g, '—').replace(/&ndash;/g, '–').replace(/&amp;/g, '&')
  .replace(/&copy;/g, '©').replace(/&middot;/g, '·').replace(/&hellip;/g, '…')
  .replace(/&#8217;|&rsquo;/g, '’').replace(/&#8216;|&lsquo;/g, '‘')
  .replace(/&quot;/g, '"').replace(/&nbsp;/g, ' ');

/* Baked-in nav states and per-page CTA variants, mapped exactly as they
   exist in the approved V1.0 markup (quirks preserved deliberately). */
const PAGES = {
  'index.html': {
    nav: { logoCurrent: true, desktop: 'home', mobile: 'home', mobileClass: false },
    cta: { titleId: 'cta-title', title: "Let's Talk.", wrapper: false, href: '#contact', strong: 'Start a project', sub: 'Portland, Oregon' },
    preconnectSource: false, themeColor: true,
  },
  'about.html': {
    nav: { desktop: 'about', mobile: 'about', mobileClass: true, footerCurrent: { explore: 'about.html' } },
    cta: { sectionClass: 'ab-cta', titleId: 'cta-title', title: "Let's Talk.", wrapper: 'plain', lineClass: 'ab-cta__line', line: "Let's create something meaningful together.", href: 'contact.html#contact-form', strong: 'Start a project', sub: 'Portland, Oregon' },
    preconnectSource: true, themeColor: true,
  },
  'services.html': {
    nav: { desktop: 'services', mobile: 'services', mobileClass: false },
    cta: { variant: 'services', sectionClass: 'svc-cta', bannerClass: 'svc-cta__banner', wrapperClass: 'svc-cta__content reveal', eyebrow: 'Have a project in mind?', titleId: 'svc-cta-title', titleClass: 'cta__title cta__title--long', title: "Let's make your next digital move count.", lineClass: 'svc-cta__text', line: "Whether you're building something new or improving what already exists, let's explore what's possible together.", href: 'contact.html#contact-form', strong: 'Start a Conversation', sub: 'Portland, Oregon' },
    preconnectSource: false, themeColor: true,
  },
  'work.html': {
    nav: { dropdownToggle: 'work', dropdownCurrent: 'work.html', footerCurrent: { explore: 'work.html' } },
    cta: { sectionClass: 'work-cta', titleId: 'cta-title', title: "Let's Talk.", wrapper: 'class', wrapperClass: 'work-cta__main', lineClass: 'work-cta__line', line: "Have a project in mind? Let's create something meaningful together.", href: 'contact.html#contact-form', strong: 'Start a project', sub: 'Portland, Oregon' },
    preconnectSource: false, themeColor: true,
  },
  'contact.html': {
    nav: { headerCtaActive: true, footerCurrent: { explore: 'contact.html' } },
    cta: { sectionClass: 'ct-cta', titleId: 'cta-title', title: "Let's Talk.", wrapper: 'plain', lineClass: 'ct-cta__line', line: "Ready to bring your ideas to life? We'd love to hear from you.", href: '#contact-form', strong: 'Start a project', sub: 'Tell us about your idea.' },
    preconnectSource: true, themeColor: true,
  },
  'impact.html': {
    nav: { desktop: 'impact', mobile: 'impact', mobileClass: true, footerCurrent: { explore: 'impact.html' } },
    cta: { sectionClass: 'impact-cta', titleId: 'impact-cta-title', title: "Let's Talk.", wrapper: 'class', wrapperClass: 'impact-cta__main', lineClass: 'impact-cta__line', line: "Have a project in mind? Let's create something meaningful together.", href: 'contact.html#contact-form', strong: 'Start a project', sub: 'Portland, Oregon' },
    preconnectSource: true, themeColor: true,
  },
  'insights.html': {
    nav: { desktop: 'insights', mobile: 'insights', mobileClass: true, footerCurrent: { explore: 'insights.html' } },
    cta: { sectionClass: 'journal-cta', titleId: 'cta-title', title: "Let's Talk.", wrapper: 'plain', lineClass: 'journal-cta__line', line: "Great ideas deserve great execution. Let's create something meaningful together.", href: 'contact.html#contact-form', strong: 'Start a project', sub: 'Portland, Oregon' },
    preconnectSource: true, themeColor: true,
  },
  'privacy-policy.html': {
    nav: { dropdownToggle: 'work', footerCurrent: { services: 'portfolio-nonprofit.html' } },
    cta: { sectionClass: 'pc-cta', titleId: 'cta-title', title: "Let's Talk.", wrapper: 'plain', lineClass: 'pc-cta__line', line: "Have a project in mind? Let's create something meaningful together.", href: 'contact.html', strong: 'Start a project', sub: 'Portland, Oregon' },
    preconnectSource: false, preconnectFonts: false, themeColor: false, robots: 'noindex,follow',
  },
};

const files = Object.keys(PAGES);
mkdirSync(join(root, 'src'), { recursive: true });

for (const file of files) {
  const html = readFileSync(join(root, file), 'utf8');
  const cfg = PAGES[file];

  const title = decode(html.match(/<title>([\s\S]*?)<\/title>/)[1]);
  const description = decode(html.match(/<meta name="description" content="([^"]*)"/)[1]);
  const dataPage = html.match(/data-page="([^"]*)"/)[1];
  const css = [...html.matchAll(/<link rel="stylesheet" href="assets\/css\/([a-z-]+\.css)"/g)].map((m) => m[1]);
  const js = [...html.matchAll(/<script src="assets\/js\/([a-z-]+\.js)"[^>]*>/g)].map((m) => m[1]);

  // <main> inner content, verbatim; trailing CTA section becomes the component.
  const mainStart = html.indexOf('<main id="main">') + '<main id="main">'.length;
  const mainEnd = html.lastIndexOf('</main>');
  let content = html.slice(mainStart, mainEnd);
  const ctaAt = content.search(/<section class="cta[^"]*"/);
  if (ctaAt === -1) throw new Error(`${file}: no closing CTA section found`);
  const ctaText = content.slice(ctaAt).replace(/<\/section>[\s\S]*$/, '</section>');
  if ((ctaText.match(/<section/g) || []).length !== 1) throw new Error(`${file}: CTA section contains nested <section>`);
  content = content.slice(0, ctaAt).replace(/\s+$/, '') + '\n';

  // Nunjucks syntax must never appear inside verbatim content.
  for (const bad of ['{{', '{%', '{#']) {
    if (content.includes(bad)) throw new Error(`${file}: template-syntax collision ${bad}`);
  }

  const navComment = (html.match(/(<!--[^>]*-->)\s*<header class="site-header"/) || [])[1] || null;
  const footerComment = (html.match(/(<!--[^>]*-->)\s*<footer class="footer"/) || [])[1] || null;
  const footerCredit = decode(html.match(/footer__credit">([^<]*)/)[1]);

  const fm = {
    layout: 'layouts/base.njk',
    title, description, dataPage, css, js,
    robots: cfg.robots || null,
    themeColor: cfg.themeColor !== false,
    preconnectFonts: cfg.preconnectFonts !== false,
    preconnectSource: !!cfg.preconnectSource,
    navComment, footerComment, footerCredit,
    nav: cfg.nav,
    cta: cfg.cta,
  };
  const out = `---json\n${JSON.stringify(fm, null, 2)}\n---\n${content}`;
  writeFileSync(join(root, 'src', file.replace(/\.html$/, '.njk')), out);
  console.log(`extracted ${file} -> src/${file.replace(/\.html$/, '.njk')} (${content.length} chars of verbatim <main>)`);
}
console.log('done: 8 page templates written to src/');
