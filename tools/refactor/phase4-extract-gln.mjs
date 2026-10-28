/* Extract 39 GLN project entries from portfolio-gln-projects.html into glnProjects.json.
   One-off verification script; read-only on the source HTML. */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const html = readFileSync(join(root, 'portfolio-gln-projects.html'), 'utf8');

const projects = [];
let count = 0;
for (const m of html.matchAll(
  /<article class="pc-project" id="project-([^"]+)" data-project-categories="([^"]*)">[\s\S]*?<img src="([^"]+)" alt="([^"]*)"[\s\S]*?<h3><a href="([^"]+)"[^>]*>([^<]+)<span class="pc-arrow"[\s\S]*?<\/h3>([\s\S]*?)<\/article>/g
)) {
  const [, id, cats, image, alt, sourceUrl, title, rest] = m;
  // description is the <p> after </h3>
  const descM = rest.match(/<p>([\s\S]*?)<\/p>/);
  const description = descM ? descM[1] : '';
  projects.push({
    id, title: title.trim(), categories: cats.split(' ').filter(Boolean),
    image, alt: alt.trim(), description: description.trim(),
    sourceUrl: sourceUrl.replace('data-original-source="true"', '').replace(/ data-original-source="true"/, ''),
  });
  count++;
}
// The regex above strips data-original-source awkwardly; fix sourceUrl properly:
for (const p of projects) {
  const m = html.match(new RegExp('id="project-' + p.id + '"[\\s\\S]*?href="([^"]+)"[\\s\\S]*?>' + p.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  if (m) p.sourceUrl = m[1];
}
writeFileSync(join(root, 'src/_data/glnProjects.json'), JSON.stringify(projects, null, 2) + '\n');
console.log('GLN projects extracted:', projects.length);
projects.forEach((p) => console.log(' ', p.id, '|', p.categories.join(','), '|', p.title));
