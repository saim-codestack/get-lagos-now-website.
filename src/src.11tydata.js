/* Global computed data for every template.
   1. Permalinks keep the legacy .html file URLs byte-identical
      (Eleventy's default would emit pretty /path/ directories).
      src/about.njk        -> /about.html
      src/articles/x.njk   -> /articles/x.html   (Phase 3)
   2. `prefix` gives the asset/link path prefix per output depth
      ("" at root, "../" per nesting level) so nested pages
      emit the same relative paths the hand-built site uses.
   3. `article` looks the current page up in src/_data/articles.json
      by slug (Phase 3 article templates); null for non-article pages.
   4. `report` looks the current page up in src/_data/reports.json
      by slug (Phase 4 report templates); null for non-report pages. */
export default {
  eleventyComputed: {
    permalink: (data) => `${data.page.filePathStem}.html`,
    prefix: (data) => {
      const depth = Math.max(0, (data.page.filePathStem.match(/\//g) || []).length - 1);
      return "../".repeat(depth);
    },
    article: (data) => {
      if (data.slug && Array.isArray(data.articles)) {
        return data.articles.find((a) => a.slug === data.slug) || null;
      }
      return null;
    },
    report: (data) => {
      if (data.slug && Array.isArray(data.reports)) {
        return data.reports.find((r) => r.slug === data.slug) || null;
      }
      return null;
    },
  },
};
