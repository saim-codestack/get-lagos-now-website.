/* Detailed diff: print every unexpected DOM difference between root original and _site output for given files. */
import * as parse5 from "parse5";
import fs from "node:fs";
const root = process.cwd();
function attrs(n) { const m = {}; (n.attrs || []).forEach((x) => { m[x.name] = x.value; }); return m; }
function tagpath(path) { return path.map((p) => p.tag).join(' > '); }
function walk(na, nb, path, curAttrs) {
  const disp = tagpath([...path, { tag: na.nodeName === '#text' ? '#text' : na.nodeName, attrs: {} }]);
  if (na.nodeName !== nb.nodeName) { console.log(disp, 'NODE', na.nodeName, '=>', nb.nodeName); return; }
  if (na.nodeName === '#text') { const t = na.value.replace(/\s+/g, ' ').trim(), u = nb.value.replace(/\s+/g, ' ').trim(); if (t !== u) console.log(disp, 'TEXT', JSON.stringify(t), '=>', JSON.stringify(u)); return; }
  if (na.nodeName === '#comment') { if ((na.data || '').replace(/\s+/g, '') !== (nb.data || '').replace(/\s+/g, '')) console.log(disp, 'COMMENT', JSON.stringify(na.data), '=>', JSON.stringify(nb.data)); return; }
  const aa = attrs(na), bb = attrs(nb); const keys = new Set([...Object.keys(aa), ...Object.keys(bb)]);
  for (const k of keys) { if (aa[k] !== bb[k]) console.log(disp, 'ATTR', k, JSON.stringify(aa[k]), '=>', JSON.stringify(bb[k])); }
  const ca = (na.childNodes || []).filter((n) => n.nodeName !== '#text' || n.value.trim());
  const cb = (nb.childNodes || []).filter((n) => n.nodeName !== '#text' || n.value.trim());
  if (ca.length !== cb.length) console.log(disp, 'CHILDREN', ca.length, '=>', cb.length);
  const L = Math.min(ca.length, cb.length);
  const nextPath = [...path, { tag: na.tagName, attrs: aa }];
  for (let i = 0; i < L; i++) walk(ca[i], cb[i], nextPath, aa);
}
for (const file of process.argv.slice(2)) {
  const a = parse5.parse(fs.readFileSync(root + '/' + file, 'utf8'));
  const b = parse5.parse(fs.readFileSync(root + '/_site/' + file, 'utf8'));
  console.log('##### ' + file);
  walk(a, b, [], {});
}
