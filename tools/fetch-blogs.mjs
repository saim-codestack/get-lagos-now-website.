import fs from 'node:fs';
const root='https://getlagosnow.com/wp-json/wp/v2/';
for (const type of ['posts','categories','users']) {let all=[],pages=1;for(let page=1;page<=pages;page++){const r=await fetch(root+type+'?per_page=100&page='+page+'&_embed=1');if(!r.ok)throw Error(type+' '+r.status);pages=Number(r.headers.get('x-wp-totalpages')||1);const records=await r.json();all.push(...records);console.log(type,page,pages,records.length)}fs.writeFileSync('tools/source/blog-'+type+'.json',JSON.stringify(all,null,2));}
