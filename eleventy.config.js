/* Get Lagos Now — Eleventy configuration (build-time only).
   Input:  src/        (Nunjucks templates + JSON data)
   Output: _site/      (static HTML, Netlify-compatible; NOT deployed yet)
   Existing production HTML in the repo root is untouched and is never
   part of Eleventy's input. */
export default function (eleventyConfig) {
  // Copy runtime assets unchanged: CSS, JS, images (fonts load from Google CDN).
  eleventyConfig.addPassthroughCopy({ "assets": "assets" });

  // Sort an array of objects by a key (used to render archive cards/rows in
  // their documented archiveOrder from insights.html).
  eleventyConfig.addFilter('sortBy', (array, key) => {
    if (!Array.isArray(array)) return array;
    return [...array].sort((a, b) => {
      const av = a[key] == null ? '' : String(a[key]);
      const bv = b[key] == null ? '' : String(b[key]);
      return av.localeCompare(bv);
    });
  });

  return {
    pathPrefix: "/",
    templateFormats: ["njk"],
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
    dir: {
      input: "src",
      includes: "_includes",
      data: "_data",
      output: "_site",
    },
  };
}
