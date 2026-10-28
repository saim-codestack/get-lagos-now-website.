import fs from 'node:fs';
const html=fs.readFileSync('tools/source/portfolio-library.html','utf8');
const strip=s=>s.replace(/<[^>]+>/g,' ').replace(/&#038;|&amp;/g,'&').replace(/&#8217;|&rsquo;/g,'’').replace(/&#8211;/g,'–').replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim();
const projects=[];for(const m of html.matchAll(/<a href="(https:\/\/getlagosnow.com\/featured_item\/[^\"]+)"[\s\S]*?<\/a>/g)){const b=m[0];const title=b.match(/portfolio-box-title[^>]*>([\s\S]*?)<\/h6>/)?.[1];if(!title)continue;projects.push({title:strip(title),source:m[1],categories:strip(b.match(/portfolio-box-category[^>]*>([\s\S]*?)<\/p>/)?.[1]||'').split(',').map(x=>x.trim()),image:b.match(/<img[^>]+src="([^\"]+)"/)?.[1]||''});}
fs.writeFileSync('tools/source/portfolio-projects.json',JSON.stringify(projects,null,2));console.log('Projects',projects.length,projects.map(x=>x.title));
