export function levelFor(xp:number){let level=1,used=0;while(level<100){const cost=100+25*(level-1);if(xp<used+cost)break;used+=cost;level++}return {level,progress:xp-used,next:level===100?0:100+25*(level-1),total:xp}}
export function minimumBid(current:number){return Math.max(1,Math.ceil(current*.05))}
export function stock(packs:number,next:number,now:number,max:number,cooldown:number){max=Math.max(1,max);const ms=Math.max(0,cooldown)*60000;if(!ms)return {packs:max,next:0};if(packs>=max)return {packs:max,next:0};if(!next)return {packs,next:now+ms};if(now<next)return {packs,next};const earned=1+Math.floor((now-next)/ms),value=Math.min(max,packs+earned);return {packs:value,next:value===max?0:next+earned*ms}}
export function parisDay(now:number){return new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Paris',year:'numeric',month:'2-digit',day:'2-digit'}).format(now)}
export function dayNumber(day:string){return Math.floor(Date.parse(day+'T12:00:00Z')/86400000)}
export type Achievement={key:string,title:string,target:number,value:number};
export function achievements(p:{opened_count:number,pack_count:number,legendary_opened:number,peak_balance:number},trades:number,owned:number,familyComplete:number):Achievement[]{return [
 {key:'pack_1',title:'Premier paquet',target:1,value:p.pack_count},{key:'pack_10',title:'Dix paquets',target:10,value:p.pack_count},{key:'pack_100',title:'Cent paquets',target:100,value:p.pack_count},
 {key:'cards_100',title:'Cent cartes ouvertes',target:100,value:p.opened_count},{key:'cards_1000',title:'Mille cartes ouvertes',target:1000,value:p.opened_count},
 {key:'legend_1',title:'Première légendaire',target:1,value:p.legendary_opened},{key:'legend_10',title:'Dix légendaires',target:10,value:p.legendary_opened},
 {key:'collection_50',title:'Album de 50 cartes',target:50,value:owned},{key:'trades_5',title:'Cinq échanges',target:5,value:trades},
 {key:'fortune_100',title:'Cent pièces atteintes',target:100,value:p.peak_balance},{key:'family_1',title:'Une famille complète',target:1,value:familyComplete}
]}
