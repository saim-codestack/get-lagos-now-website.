import fs from 'node:fs';
fs.mkdirSync('tools/source',{recursive:true});
for (const [name,url] of [['types','https://getlagosnow.com/wp-json/wp/v2/types'],['medical','https://getlagosnow.com/wp-json/wp/v2/pages?slug=medical-dental'],['library','https://getlagosnow.com/my-portfolio/']]) {const r=await fetch(url);const text=await r.text();fs.writeFileSync('tools/source/portfolio-'+name+(name==='library'?'.html':'.json'),text);console.log(name,r.status,text.length)}
