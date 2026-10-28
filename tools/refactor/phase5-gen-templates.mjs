/* Phase 5 — generate portfolio .njk templates from the original root HTML.
   Reads each original, extracts <main id="main">...</main> content verbatim,
   replaces the inline <section class="cta pc-cta"> with the cta-banner include,
   removes inline header/footer (replaced by includes), and writes src/portfolio-*.njk.
   Read-only on the source HTML; generates new template files. */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

const pages = [
  {
    src: 'portfolio-energy-efficiency.html',
    out: 'src/portfolio-energy-efficiency.njk',
    title: 'Energy Efficiency Portfolio | Get Lagos Now',
    desc: "Explore Get Lagos Now's published work for Energy Trust of Oregon, CLEAResult, ESS Inc., OACD, and related industries, spanning websites, branding, marketing, and digital strategy.",
    css: ['style.css', 'responsive.css', 'portfolio-category.css'],
    js: ['main.js'],
    themeColor: true, preconnectFonts: true, preconnectSource: true,
    current: 'portfolio-energy-efficiency.html',
    dropdownToggle: 'work',
    footerKey: 'services',
    bodyClass: 'portfolio-category-page',
    headExtra: '<script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>',
  },
  {
    src: 'portfolio-nonprofit.html',
    out: 'src/portfolio-nonprofit.njk',
    title: 'Non-Profit Portfolio | Get Lagos Now',
    desc: "Explore Get Lagos Now's non-profit portfolio: accessible websites for Wallace Medical & Dental and The Children's Institute, plus campaigns, branding, and digital strategy for mission-driven organizations.",
    css: ['style.css', 'responsive.css', 'portfolio-category.css'],
    js: ['main.js'],
    themeColor: true, preconnectFonts: true, preconnectSource: true,
    current: 'portfolio-nonprofit.html',
    dropdownToggle: 'work',
    footerKey: 'services',
    bodyClass: 'portfolio-category-page portfolio-nonprofit',
  },
  {
    src: 'portfolio-medical-dental.html',
    out: 'src/portfolio-medical-dental.njk',
    title: 'Medical & Dental Portfolio | Get Lagos Now',
    desc: 'Explore verified websites, branding, and digital services for Wallace Medical &amp; Dental, Medical Teams International, and healthcare organizations.',
    css: ['style.css', 'responsive.css', 'portfolio-category.css', 'portfolio-complete.css'],
    js: ['main.js'],
    themeColor: true, preconnectFonts: true, preconnectSource: false,
    current: 'portfolio-medical-dental.html',
    footerKey: 'services',
    bodyClass: 'portfolio-category-page portfolio-complete',
  },
  {
    src: 'portfolio-gln-projects.html',
    out: 'src/portfolio-gln-projects.njk',
    title: 'GLN Projects Portfolio | Get Lagos Now',
    desc: 'Browse the complete original Get Lagos Now project library: graphics, marketing and advertising, tech planning, and websites.',
    css: ['style.css', 'responsive.css', 'portfolio-category.css', 'portfolio-complete.css'],
    js: ['main.js', 'portfolio-library.js'],
    themeColor: true, preconnectFonts: true, preconnectSource: false,
    current: 'portfolio-gln-projects.html',
    footerKey: 'services',
    bodyClass: 'portfolio-category-page portfolio-complete',
    scripts: ['main.js', 'portfolio-library.js'],
  },
];

const cta = {
  sectionClass: 'pc-cta', titleId: 'cta-title', title: "Let's Talk.", wrapper: true,
  lineClass: 'pc-cta__line',
  line: `Have a project in mind? Let's create something meaningful together.`,
  href: 'contact.html', strong: 'Start a project', sub: 'Portland, Oregon',
};

function fm(p) {
  const obj = {
    title: p.title, description: p.desc, dataPage: 'work', css: p.css, js: p.js,
    robots: null, themeColor: p.themeColor, preconnectFonts: p.preconnectFonts,
    preconnectSource: p.preconnectSource,
    nav: { dropdownToggle: p.dropdownToggle, dropdownCurrent: p.current,
           footerCurrent: { [p.footerKey || 'explore']: p.current } },
    footerCredit: 'Editorial photography via Pexels. Project imagery \u00a9 respective clients.',
    cta: {
      sectionClass: 'pc-cta', titleId: 'cta-title', title: "Let's Talk.", wrapper: true,
      lineClass: 'pc-cta__line',
      line: `Have a project in mind? Let's create something meaningful together.`,
      href: 'contact.html', strong: 'Start a project', sub: 'Portland, Oregon',
    },
  };
  if (p.headExtra) obj.headExtra = p.headExtra;
  return JSON.stringify(obj, null, 2);
}

for (const p of pages) {
  const html = readFileSync(join(root, p.src), 'utf8');
  const mainStart = html.indexOf('<main id="main">');
  const mainEnd = html.indexOf('</main>', mainStart);
  if (mainStart === -1 || mainEnd === -1) { console.log('NO MAIN:', p.src); continue; }
  let body = html.slice(mainStart + '<main id="main">'.length, mainEnd);

  // Replace the inline cta pc-cta section with the shared cta-banner include.
  const ctaStart = body.indexOf('<section class="cta pc-cta"');
  if (ctaStart === -1) { console.log('NO CTA SECTION:', p.src); continue; }
  const ctaEnd = body.indexOf('</section>', ctaStart);
  if (ctaEnd === -1) { console.log('NO CTA CLOSE:', p.src); continue; }
  body = body.slice(0, ctaStart) + '{% include "components/cta-banner.njk" %}' + body.slice(ctaEnd + '</section>'.length);

  // Normalize leading/trailing whitespace of the main content block.
  body = body.replace(/^\s+/, '').replace(/\s+$/, '');

  const njk = `---json\n${fm(p)}\n---\n\n<!DOCTYPE html>\n<html lang="en" data-page="{{ dataPage }}">\n<head>\n{%- include "components/head-meta.njk" %}\n</head>\n<body class="${p.bodyClass}">\n  <a class="skip-link" href="#main">Skip to main content</a>\n{%- include "components/site-header.njk" %}\n  <main id="main">\n${body}\n  </main>\n{%- include "components/site-footer.njk" %}\n${(p.scripts || ["main.js"]).map((s) => `<script src="{{ prefix }}assets/js/${s}" defer></script>`).join('\n')}\n</body>\n</html>\n`;

  writeFileSync(join(root, p.out), njk);
  console.log('WROTE', p.out, 'main content chars:', body.length);
}
