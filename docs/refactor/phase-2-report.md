# Phase 2 — Eleventy setup & shared template migration (COMPLETE)

Date: 28 October 2026 · Branch: `arena/6d524fe5-get-lagos-now-website` (refactor branch; `main` untouched) · Scope per approved `phase-1-audit.md` §8.

## Files created

**Build configuration (4):**
- `package.json` — `private`, `type: module`; devDependencies pinned exact: `@11ty/eleventy@3.1.7`, `parse5@8.0.1` (diff tool only); scripts: `build`, `serve`, `inventory`, `diff:phase2`
- `package-lock.json` — committed for build reproducibility
- `.gitignore` — `node_modules/`, `_site/`
- `eleventy.config.js` — input `src/`, output `_site/`, Nunjucks, passthrough `{ "assets": "assets" }` (430 files: 13 css, 3 js, 414 images)

**Data (`src/_data/`, 2):** `site.json` (identity, logo, fonts, footer copy), `navigation.json` (primary pill, Portfolio/Reports dropdowns, footer columns, legal row, social placeholders)

**Templates (`src/_includes/`, 7):** `layouts/base.njk`; components: `head-meta.njk`, `site-header.njk`, `mobile-menu.njk`, `site-footer.njk`, `newsletter-form.njk`, `cta-banner.njk`

**Pages (`src/`, 8):** `index.njk`, `about.njk`, `services.njk`, `work.njk`, `contact.njk`, `impact.njk`, `insights.njk`, `privacy-policy.njk` — each with `---json` front matter (parsed programmatically from the originals: title, description, css/js bundles, robots, theme-color, preconnects, baked nav active states, CTA variant) + **verbatim `<main>` content**. Insights carries the full static 49-article library (grid cards + list rows + filter chips); no placeholders.

**Shared config:** `src/src.11tydata.js` — global `permalink = filePathStem + ".html"` (preserves legacy URLs exactly; defeats Eleventy's pretty-URL default) and depth-aware `prefix` ("" root / `../` nested) for Phase 3–5 pages.

**Tooling (`tools/refactor/`, 2, dev-only):** `phase2-extract-pages.mjs` (generator, re-runnable; fails on any `{{`/`{%` collision in content), `phase2-dom-diff.mjs` (equivalence gate).

**Modified: none. Deleted: none.** All 73 production files byte-identical; `git status` shows only new files.

## Build result

```
npx @11ty/eleventy → Copied 430 assets · Wrote 8 files · ~0.6s (v3.1.7)
_site/: index.html about.html services.html work.html contact.html impact.html insights.html privacy-policy.html
        + assets/ (430 files, 1:1 with repo assets/)
```

All 8 URLs match the originals exactly (`/index.html` ≡ `/`, `/about.html`, … `/privacy-policy.html`). `_site/` is gitignored and **not deployed**.

## DOM comparison results — PASS 8/8

`node tools/refactor/phase2-dom-diff.mjs` (parse5 walk of original vs generated):
- **Full-document normalized text hash: identical for all 8 pages** (sha-256 over whitespace-collapsed text stream) — zero content drift.
- **Structure**: tag-by-tag + attribute-by-attribute comparison — zero unexpected differences.
- **Metadata gate vs Phase 1 inventory**: title, description, robots, data-page, CSS/JS bundles, single-h1 — all pass (incl. `noindex,follow` on privacy-policy and its intentionally absent theme-color/preconnects).
- **JS contract gate**: all ids/classes/data-attrs counted equal original vs output — `siteHeader`, `mobileMenu`, dropdown ids, `newsletterForm`/`nl*`; homepage `gaugeSvg`, `testi*`, `accordion`, `inquiryForm` fields; services `approachList`/`approachCursor*`/`data-cursor-img`; work `workFilters`/`workGrid`/`work-card`; insights `blogLibrary*` (24 card refs, 135 row refs, 8 topic buttons, 49 distinct article links — 49/49 match the articles directory); contact form field ids incl. `#ctRole` honeypot.
- **Insights library**: static cards/rows/filter markup byte-faithful (hashes equal), so `blog-library.js` behavior (filters, Load More 8→, focus move) is preserved; nothing was placeholdered.

### Whitelisted differences (approved Phase 1 normalization log — render-neutral, listed for review)
1. Header/footer logo `aria-label` hyphen variants → `Get Lagos Now — home/back to top` (screen-reader text; 1–2 hits on about/impact/insights/privacy).
2. Logo `width`/`height` attribute sets unified to 190×40 (rendered size is fixed by CSS `height:34px;width:auto`) — privacy only.
3. Footer nav landmark `aria-label="Footer - …"` hyphen variants → em-dash (about/impact/insights/privacy; invisible text).
4. Entity-encoding normalization (byte-level only, parsed DOM identical): `&copy;`/`©`, `·`/`&middot;`, `—`/`&mdash;`, apostrophes as `&#39;` in attribute values, and `&` → `&amp;` in the Google Fonts URL — the generated form is the HTML-valid spelling.
5. Section-marker comments (`01 NAVIGATION`, `FOOTER`…) reproduced verbatim per page where present; pages that lacked them (about/impact/insights/privacy) remain without.

## Functional verification

- No browser/CDP endpoint exists in this environment (no Chrome binary), so live interaction tests were **not run** — per repo policy these run only when explicitly available; deferred to Phase 6 QA (browser suites in `tools/qa-*.mjs` expect the full 73-page build).
- In place of it: full DOM equivalence (above), JS contract counts, and reference checks. All nav/footer/dropdown link targets and image paths verified to exist; links to blog/report/portfolio pages that Phases 3–5 will generate are reported as `pending (expected)` rather than failures.

## Known limitations / next phase notes
- `_site/` intentionally 404s on `/articles/*`, `/reports/*`, and the four portfolio pages **inside the build output only** — those files remain live at the repo root until Phase 6 cutover.
- `tools/preview.mjs` still serves the repo root (current live pages). Serving `_site/` is a Phase 6 step.

**Status: Phase 2 complete. Phase 3 (blog templates + `articles.json`) does not start until approved.**
