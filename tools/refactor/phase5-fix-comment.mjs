import fs from "node:fs";
const p = "src/_data/portfolio.json";
let d = JSON.parse(fs.readFileSync(p, "utf8"));
d.workCards[0].comment = "01 The Children's Institute";
fs.writeFileSync(p, JSON.stringify(d, null, 2) + "\n");
console.log("fixed:", JSON.stringify(d.workCards[0].comment));
