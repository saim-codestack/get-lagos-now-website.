/* Get Lagos Now — Eleventy configuration (build-time only).
   Input:  src/        (Nunjucks templates + JSON data)
   Output: _site/      (static HTML, Netlify-compatible; NOT deployed yet)
   Existing production HTML in the repo root is untouched and is never
   part of Eleventy's input. */
export default function (eleventyConfig) {
  // Copy runtime assets unchanged: CSS, JS, images (fonts load from Google CDN).
  eleventyConfig.addPassthroughCopy({ "assets": "assets" });

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
