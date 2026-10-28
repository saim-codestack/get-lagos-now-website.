import fs from "node:fs";
const root = process.cwd();
// Extract the inline <style>...</style> block (lines 18-85) from the nonprofit source.
const src = fs.readFileSync(root + "/portfolio-nonprofit.html", "utf8").split("\n");
const styleLines = src.slice(17, 85); // 0-based lines 18..85
const headClose = styleLines.join("\n") + "\n";

const p = root + "/src/portfolio-nonprofit.njk";
let njk = fs.readFileSync(p, "utf8");
const fmStart = njk.indexOf("---json\n") + 8;
const fmEnd = njk.indexOf("\n---", fmStart);
const fm = JSON.parse(njk.slice(fmStart, fmEnd));
fm.headClose = headClose;
const newFm = "---json\n" + JSON.stringify(fm, null, 2) + "\n---";
njk = newFm + njk.slice(fmEnd + 4); // skip "\n---"
fs.writeFileSync(p, njk);
console.log("Injected headClose into portfolio-nonprofit.njk; headClose length:", headClose.length);
