import json, urllib.request, urllib.parse, time, re
from pathlib import Path
API='https://fr.wikipedia.org/w/api.php'; source=json.load(open('../atlas-cards/dist/cards.json'))
def get(params):
 u=API+'?'+urllib.parse.urlencode({'action':'query','format':'json',**params});req=urllib.request.Request(u,headers={'User-Agent':'AtlasCards/0.2 (contact: cards-demo@example.org)'})
 for a in range(4):
  try:
   with urllib.request.urlopen(req,timeout=30) as r:return json.load(r)
  except Exception as e:
   if a==3: print('ERR',str(e)[:100]);return {}
   time.sleep(1+a)
byid={str(c['id']):c for c in source};names={}
for i in range(0,len(source),25):
 pages=get({'prop':'pageimages|extracts','piprop':'name','exintro':1,'explaintext':1,'exchars':280,'pageids':'|'.join(str(c['id']) for c in source[i:i+25])}).get('query',{}).get('pages',{})
 for id,p in pages.items():
  if id in byid and p.get('pageimage'):
   byid[id]['file']='Fichier:'+p['pageimage'].replace('_',' ')
   byid[id]['excerpt']=p.get('extract','')
files=list(dict.fromkeys(c['file'] for c in source if c.get('file')))
for i in range(0,len(files),25):
 pages=get({'prop':'imageinfo','iiprop':'extmetadata|url','titles':'|'.join(files[i:i+25])}).get('query',{}).get('pages',{})
 for p in pages.values():
  if p.get('imageinfo'): names[p['title'].replace('Fichier:','')]=p['imageinfo'][0]
allowed=[]
for c in source:
 info=names.get(c.get('file','').replace('Fichier:',''))
 if not info:continue
 m=info.get('extmetadata',{});lic=m.get('LicenseShortName',{}).get('value','');url=m.get('LicenseUrl',{}).get('value','');usage=m.get('UsageTerms',{}).get('value','')
 if not (re.search(r'CC[ -](?:BY|0)|public domain|domaine public|PD-',lic,re.I) or re.search(r'creativecommons.org/(?:licenses|publicdomain)/',url,re.I)):continue
 if 'noncommercial' in usage.lower() or 'nc'==lic.lower():continue
 c['license']=lic;c['licenseUrl']=url;c['author']=re.sub('<[^>]+>','',m.get('Artist',{}).get('value',''))[:160];c['fileUrl']=info.get('descriptionurl','');c['excerpt']=c.get('excerpt') or c['description'];allowed.append(c)
Path('public/catalog.json').write_text(json.dumps(allowed,ensure_ascii=False),encoding='utf8')
print('allowed',len(allowed),'families', {k:sum(c['family']==k for c in allowed) for k in sorted(set(c['family'] for c in source))})
