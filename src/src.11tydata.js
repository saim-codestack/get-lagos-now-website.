/* Global computed data for every template.
   1. Permalinks keep the legacy .html file URLs byte-identical
      (Eleventy's default would emit pretty /path/ directories).
      src/about.njk        -> /about.html
      src/articles/x.njk   -> /articles/x.html   (Phase 3)
   2. `prefix` gives the asset/link path prefix per output depth
      ("" at root, "../" inside articles/ or reports/) so nested pages
      emit the same relative paths the hand-built site uses. */
export default {
  eleventyComputed: {
    permalink: (data) => `${data.page.filePathStem}.html`,
    prefix: (data) => {
      const depth = Math.max(0, (data.page.filePathStem.match(/\//g) || []).length - 1);
      return "../".repeat(depth);
    },
  },
};
