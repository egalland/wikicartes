import {classifyCardFamily} from './card-family';

async function wiki(params:Record<string,string>){
 const url=new URL('https://fr.wikipedia.org/w/api.php');
 for(const [key,value] of Object.entries({action:'query',format:'json',formatversion:'2',maxlag:'5',...params}))url.searchParams.set(key,value);
 for(let attempt=0;attempt<3;attempt++){
  const response=await fetch(url,{headers:{'User-Agent':'WikiCartes/0.6 (https://wikicartes.emmanuel-galland117.chatgpt.site; catalogue éducatif, crédits Wikimedia)'},signal:AbortSignal.timeout(18000)});
  if(response.status===429||response.status===503){await new Promise(resolve=>setTimeout(resolve,1200*(attempt+1)));continue}
  if(!response.ok)throw Error('Wikipédia : HTTP '+response.status);
  const data=await response.json() as any;
  if(data.error?.code==='maxlag'){await new Promise(resolve=>setTimeout(resolve,1200*(attempt+1)));continue}
  if(data.error)throw Error(data.error.info||'Erreur Wikipédia');
  return data;
 }
 throw Error('Wikipédia occupée : réessaie plus tard');
}

export async function importBatch(db:D1Database,minMonthlyViews=100){
 const minimum=Math.max(0,Math.min(1000000,Math.floor(minMonthlyViews)));
 const cursor=(await db.prepare('SELECT value FROM config WHERE key=?').bind('wiki_cursor').first<{value:string}>())?.value||'';
 const list=await wiki({list:'allpages',apnamespace:'0',apfilterredir:'nonredirects',aplimit:'50',...(cursor?{apcontinue:cursor}:{})});
 const members=(list.query?.allpages||[]) as {pageid:number,title:string}[];
 if(!members.length)return {scanned:0,imported:0,updated:0,rejected:0,more:false,cursor,events:['Fin du catalogue Wikipédia.']};
 let imported=0,updated=0,rejected=0;
 const events:string[]=[`Lecture de ${members.length} articles sur Wikipédia en français…`];
 await db.prepare('INSERT OR IGNORE INTO families(slug,name,category,enabled) VALUES (?,?,?,1)').bind('decouvertes','Découvertes',null).run();
 for(let i=0;i<members.length;i+=25){
  const subset=members.slice(i,i+25);
  const details=await wiki({prop:'pageimages|pageviews|extracts|categories',piprop:'thumbnail|name',pithumbsize:'900',pilicense:'free',pvipdays:'30',exintro:'1',explaintext:'1',exchars:'700',cllimit:'20',pageids:subset.map(x=>x.pageid).join('|')});
  const pages=(details.query?.pages||[]) as any[];
  const files=pages.filter(p=>p.thumbnail?.source&&p.pageimage).map(p=>'Fichier:'+p.pageimage);
  const images=files.length?await wiki({prop:'imageinfo',iiprop:'extmetadata|url',titles:files.join('|')}):{query:{pages:[]}};
  const filesMap=new Map<string,any>();
  for(const file of (images.query?.pages||[]) as any[])if(file.imageinfo?.[0])filesMap.set(file.title.replace(/^(Fichier|File):/,''),file.imageinfo[0]);
  const statements:D1PreparedStatement[]=[];
  const stamp=Date.now();
  for(const page of pages){
   if(!page.pageid)continue;
   const category=(page.categories||[]).map((x:any)=>String(x.title||'').replace(/^Catégorie:/,'')).join(' · ').slice(0,240);
   const family=classifyCardFamily(category);
   const info=filesMap.get(String(page.pageimage||'').replaceAll('_',' '));
   const meta=info?.extmetadata||{},license=String(meta.LicenseShortName?.value||''),licenseUrl=String(meta.LicenseUrl?.value||'');
   const isFree=/CC[ -](?:BY|0)|public domain|domaine public|PD-/i.test(license)||/creativecommons.org\/(?:licenses|publicdomain)\//i.test(licenseUrl);
   const observations=Object.values(page.pageviews||{}).filter((value):value is number=>typeof value==='number');
   const views=observations.reduce((sum,value)=>sum+value,0);
   const existing=await db.prepare('SELECT id,retired,views FROM cards WHERE id=?').bind(page.pageid).first<{id:number,retired:number,views:number}>();
   const reason=!page.thumbnail?.source?'sans image':!info?'image inaccessible':!isFree?'licence non libre':/logo|wordmark|affiche|poster/i.test(String(page.pageimage))?'image non adaptée':!existing&&!observations.length?'vues indisponibles':!existing&&views<minimum?`moins de ${minimum} vues sur 30 jours (${views})`:'';
   const valid=!reason;
   if(!valid)rejected++;else if(existing)updated++;else imported++;
   const label=String(page.title).slice(0,80);
   events.push(valid?`${existing?'Actualisée':'Ajoutée'} · ${label} · ${views} vues`:`Écartée · ${label} · ${reason}`);
   statements.push(db.prepare('INSERT INTO import_records(page_id,title,category,family,status,reason,checked_at) VALUES (?,?,?,?,?,?,?) ON CONFLICT(page_id) DO UPDATE SET title=excluded.title,category=excluded.category,family=excluded.family,status=excluded.status,reason=excluded.reason,checked_at=excluded.checked_at').bind(page.pageid,page.title,category,family,valid?'eligible':'rejected',reason,stamp));
   if(valid&&!existing?.retired){
    const author=String(meta.Artist?.value||'').replace(/<[^>]*>/g,'').slice(0,160);
    statements.push(db.prepare('INSERT INTO cards(id,title,family,category,image,excerpt,views,url,author,license,license_url,file_url) VALUES (?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET title=excluded.title,family=excluded.family,category=excluded.category,image=excluded.image,excerpt=excluded.excerpt,views=excluded.views,url=excluded.url,author=excluded.author,license=excluded.license,license_url=excluded.license_url,file_url=excluded.file_url').bind(page.pageid,page.title,family,category,page.thumbnail.source,page.extract||'',observations.length?views:existing?.views??0,'https://fr.wikipedia.org/wiki/'+encodeURIComponent(page.title.replaceAll(' ','_')),author,license,licenseUrl,info.descriptionurl||''));
   }
  }
  if(statements.length)await db.batch(statements);
 }
 const next=list.continue?.apcontinue||'';
 await db.prepare('INSERT INTO config(key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').bind('wiki_cursor',next).run();
 events.push(`Lot terminé · ${imported} ajoutée(s), ${updated} actualisée(s), ${rejected} écartée(s).`);
 return {scanned:members.length,imported,updated,rejected,more:!!next,cursor:next,events};
}
