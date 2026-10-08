// Règles communes aux imports Wikipédia et à la reprise des cartes existantes.
const rules: [string, RegExp][] = [
  ['cinema', /cinéma|film|réalisat|acteu|actric|télévision|série télévisée/i],
  ['astrologie', /astrolog|zodiaque|horoscope/i],
  ['astronomie', /\bastronomi|planète|étoile|galaxie|constellation|cosmolog/i],
  ['politique', /politique|président|ministre|député|élection|parti politique/i],
  ['histoire', /histoire|siècle|guerre|empire|archéolog|monarchie/i],
  ['nature', /animal|végétal|botani|écologi|espèce|géograph|montagne|fleuve|fruit|plante|arbre/i],
  ['sciences', /science|physique|chimie|mathémati|médecine|technolog|informatique/i],
  ['arts', /artiste|peintre|musique|littérature|écrivain|architecture|musée/i],
  ['gastronomie', /gastronom|cuisine|culinair|fromage|cépage|viticult|œnolog|pâtisser|boulanger/i],
];

export function classifyCardFamily(categories: string): string {
  return rules.find(([, pattern]) => pattern.test(categories))?.[0] || 'decouvertes';
}
