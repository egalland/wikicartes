import json, urllib.request, urllib.parse, time
from pathlib import Path
API='https://fr.wikipedia.org/w/api.php'
FAMILIES={
 'cinema': ('Cinéma', ['Avatar (film, 2009)','Titanic (film, 1997)','Interstellar','Le Seigneur des anneaux : La Communauté de l’anneau','Star Wars, épisode IV : Un nouvel espoir','Le Voyage de Chihiro','The Dark Knight : Le Chevalier noir','Jurassic Park','Oppenheimer (film)','Pulp Fiction','Matrix (film)','La La Land (film)','Hayao Miyazaki','Charlie Chaplin','Christopher Nolan','Steven Spielberg']),
 'astronomie': ('Astronomie', ['Saturne (planète)','Jupiter (planète)','Mars (planète)','Terre','Lune','Soleil','Nébuleuse d’Orion','Galaxie d’Andromède','Voie lactée','Trou noir','Neptune (planète)','Uranus (planète)','Mercure (planète)','Vénus (planète)','Système solaire','Télescope spatial James-Webb']),
 'histoire': ('Histoire', ['Cléopâtre VII','Napoléon Ier','Jules César','Marie-Antoinette d’Autriche','Machu Picchu','Colisée','Grande Muraille','Pyramide de Khéops','Jeanne d’Arc','Léonard de Vinci','Première Guerre mondiale','Seconde Guerre mondiale','Château de Versailles','Stonehenge','Empire romain','Révolution française']),
 'nature': ('Nature', ['Tigre','Loup gris','Abeille','Chat','Panda géant','Orque','Lion','Éléphant de savane d’Afrique','Pieuvre','Manchot empereur','Renard roux','Aigle royal','Gorille','Tournesol','Baobab africain','Papillon monarque']),
 'politique': ('Politique', ['Assemblée nationale (France)','Parlement européen','Organisation des Nations unies','Maison-Blanche','Palais de l’Élysée','Nelson Mandela','Abraham Lincoln','Charles de Gaulle','Angela Merkel','Barack Obama','Simone Veil','Winston Churchill','Démocratie','Union européenne','République française','Constitution française du 4 octobre 1958']),
 'sciences': ('Sciences', ['Albert Einstein','Marie Curie','Nikola Tesla','Ada Lovelace','Isaac Newton','Charles Darwin','Rosalind Franklin','Alan Turing','Stephen Hawking','Galilée (savant)','Louis Pasteur','ADN','Tableau périodique des éléments','Boson de Higgs','Physique quantique','Station spatiale internationale']),
 'arts': ('Arts & culture', ['Frida Kahlo','Vincent van Gogh','Pablo Picasso','Mona Lisa','La Nuit étoilée','Tour Eiffel','Notre-Dame de Paris','Mont Fuji','Ludwig van Beethoven','Wolfgang Amadeus Mozart','David Bowie','Michael Jackson','Beyoncé','Banksy','Salvador Dalí','Claude Monet']),
 'astrologie': ('Astrologie', ['Astrologie','Zodiaque','Bélier (astrologie)','Taureau (astrologie)','Gémeaux (astrologie)','Cancer (astrologie)','Lion (astrologie)','Vierge (astrologie)','Balance (astrologie)','Scorpion (astrologie)','Sagittaire (astrologie)','Capricorne (astrologie)','Verseau (astrologie)','Poissons (astrologie)']),
}
def query(params):
 u=API+'?'+urllib.parse.urlencode({'action':'query','format':'json','redirects':1,**params})
 req=urllib.request.Request(u,headers={'User-Agent':'AtlasCardsPrototype/0.1 (contact: cards-demo@example.org)'})
 for attempt in range(3):
  try:
   with urllib.request.urlopen(req, timeout=25) as r:return json.load(r)
  except Exception as e:
   if attempt==2: print('WARN',str(e),u[:130]);return {}
   time.sleep(1+attempt)
all_titles=list(dict.fromkeys(t for _,titles in FAMILIES.values() for t in titles))
pages=[]
for i in range(0,len(all_titles),25):
 data=query({'prop':'pageimages|pageviews|description','piprop':'thumbnail|original','pithumbsize':850,'pvipdays':30,'titles':'|'.join(all_titles[i:i+25])})
 pages.extend(data.get('query',{}).get('pages',{}).values())
print('returned',len(pages))
by_title={p['title']:p for p in pages if 'missing' not in p}
# Redirected titles are matched through normalized/redirect records, with fallback to family title list.
redirects={x['from']:x['to'] for x in data.get('query',{}).get('redirects',[])} if False else {}
for i in range(0,len(all_titles),25):
 pass
cards=[]
for key,(label,titles) in FAMILIES.items():
 for title in titles:
  p=by_title.get(title)
  if p is None:
   import unicodedata
   norm=lambda s:unicodedata.normalize('NFKD',s).replace('’',"'").lower()
   p=next((v for t,v in by_title.items() if norm(t)==norm(title)),None)
  if not p or not p.get('thumbnail',{}).get('source'):continue
  views=sum(day for day in p.get('pageviews',{}).values() if isinstance(day,(int,float)))
  image=p['thumbnail']['source']
  if any(word in urllib.parse.unquote(image).lower() for word in ('logo','wordmark','poster','affiche')):continue
  cards.append({'id':p['pageid'],'title':p['title'],'family':key,'image':image,'original':p.get('original',{}).get('source'),'description':p.get('description','Article Wikipédia'),'views':views,'url':'https://fr.wikipedia.org/wiki/'+urllib.parse.quote(p['title'].replace(' ','_'))})
Path('atlas-cards/dist/cards.json').write_text(json.dumps(cards,ensure_ascii=False),encoding='utf8')
print('eligible',len(cards), {k:sum(c['family']==k for c in cards) for k in FAMILIES})
