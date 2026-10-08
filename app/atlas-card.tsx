'use client';

import {useEffect,useRef} from 'react';
import type {CSSProperties,KeyboardEvent,PointerEvent} from 'react';

const LABELS=['Commune','Peu commune','Rare','Épique','Légendaire','Légendaire +'];
type CardArt={id:number;title:string;image:string;views:number;plus?:number};
type Props={card:CardArt;config:{thresholds:number[]};family:string;onTitle?:()=>void;size?:'normal'|'large'};
const clamp=(n:number,min:number,max:number)=>Math.max(min,Math.min(max,n));

export default function AtlasCard({card,config,onTitle,size='normal'}:Props){
 const root=useRef<HTMLDivElement>(null);
 const frame=useRef(0),reduced=useRef(false),moved=useRef(false);
 const base=useRef({x:0,y:0});
 const drag=useRef<{id:number;x:number;y:number;rx:number;ry:number}|null>(null);
 const target=useRef({x:50,y:50,rx:0,ry:0,light:0});
 const motion=useRef({rx:0,ry:0,light:0});
 const rarity=card.plus?5:Math.min(4,config.thresholds.filter(value=>card.views>=value).length);

 useEffect(()=>{
  const media=window.matchMedia('(prefers-reduced-motion: reduce)');
  const update=()=>{reduced.current=media.matches};
  update();media.addEventListener('change',update);
  return()=>{media.removeEventListener('change',update);cancelAnimationFrame(frame.current)};
 },[]);

 function animate(){
  const el=root.current;if(!el){frame.current=0;return}
  const t=target.current,m=motion.current,speed=reduced.current?1:(drag.current?0.45:0.17);
  m.rx+=(t.rx-m.rx)*speed;m.ry+=(t.ry-m.ry)*speed;m.light+=(t.light-m.light)*.2;
  el.style.setProperty('--rx',m.rx.toFixed(3)+'deg');
  el.style.setProperty('--ry',m.ry.toFixed(3)+'deg');
  el.style.setProperty('--pointer-x',t.x.toFixed(2)+'%');
  el.style.setProperty('--pointer-y',t.y.toFixed(2)+'%');
  el.style.setProperty('--foil-x',(35+t.x*.3).toFixed(2)+'%');
  el.style.setProperty('--foil-y',(30+t.y*.4).toFixed(2)+'%');
  el.style.setProperty('--foil-x-inverse',(65-t.x*.3).toFixed(2)+'%');
  el.style.setProperty('--foil-y-inverse',(70-t.y*.4).toFixed(2)+'%');
  el.style.setProperty('--beam-x',(77.7778-t.x*.555556).toFixed(3)+'%');
  el.style.setProperty('--beam-y',(77.7778-t.y*.555556).toFixed(3)+'%');
  el.style.setProperty('--light-presence',m.light.toFixed(3));
  const distance=Math.abs(t.rx-m.rx)+Math.abs(t.ry-m.ry)+Math.abs(t.light-m.light);
  frame.current=distance>.006?requestAnimationFrame(animate):0;
 }
 function paint(){if(!frame.current)frame.current=requestAnimationFrame(animate)}
 function point(e:PointerEvent<HTMLDivElement>){
  const rect=e.currentTarget.getBoundingClientRect();if(!rect.width||!rect.height)return;
  const t=target.current;t.x=clamp((e.clientX-rect.left)/rect.width*100,0,100);t.y=clamp((e.clientY-rect.top)/rect.height*100,0,100);t.light=1;
  if(!drag.current){t.rx=base.current.x+(reduced.current?0:(50-t.y)*.12);t.ry=base.current.y+(reduced.current?0:(t.x-50)*.16)}
  paint();
 }
 function move(e:PointerEvent<HTMLDivElement>){
  if(drag.current&&drag.current.id!==e.pointerId)return;
  point(e);const d=drag.current;if(!d)return;
  const dx=e.clientX-d.x,dy=e.clientY-d.y;
  if(Math.abs(dx)+Math.abs(dy)>6)moved.current=true;
  target.current.rx=clamp(d.rx-dy*.45,-40,40);target.current.ry=d.ry+dx*.72;
 }
 function rest(){target.current.light=0;target.current.rx=base.current.x;target.current.ry=base.current.y;paint()}
 function end(e:PointerEvent<HTMLDivElement>){
  if(drag.current?.id!==e.pointerId)return;
  base.current={x:target.current.rx,y:target.current.ry};drag.current=null;
  if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);
  if(e.pointerType==='touch'||e.type==='pointercancel')rest();
 }
 function keyboard(e:KeyboardEvent<HTMLDivElement>){
  if(e.target!==e.currentTarget)return;
  const turns:Record<string,[number,number]>={ArrowLeft:[0,-20],ArrowRight:[0,20],ArrowUp:[-10,0],ArrowDown:[10,0],' ':[0,180]};
  if(e.key==='Home')base.current={x:0,y:0};
  else if(turns[e.key]){base.current.x=clamp(base.current.x+turns[e.key][0],-40,40);base.current.y+=turns[e.key][1]}
  else return;
  e.preventDefault();target.current.rx=base.current.x;target.current.ry=base.current.y;target.current.light=1;paint();
 }
 return <div ref={root} className={`atlas-card ${size} rarity-${rarity}`} data-finish={rarity>=3?'holo':'satin'} tabIndex={0} role="group"
  style={{'--rx':'0deg','--ry':'0deg'} as CSSProperties}
  aria-label={`Carte ${card.title}, ${LABELS[rarity]}. Glisser pour tourner. Flèches au clavier, espace pour retourner.`}
  onPointerEnter={point} onPointerMove={move} onPointerLeave={()=>{if(!drag.current)rest()}}
  onPointerDown={e=>{if(e.button!==0||(e.target as HTMLElement).closest('button,a'))return;moved.current=false;point(e);drag.current={id:e.pointerId,x:e.clientX,y:e.clientY,rx:motion.current.rx,ry:motion.current.ry};e.currentTarget.setPointerCapture(e.pointerId)}}
  onPointerUp={end} onPointerCancel={end} onLostPointerCapture={()=>{drag.current=null}}
  onClickCapture={e=>{if(moved.current){e.preventDefault();e.stopPropagation();moved.current=false}}}
  onKeyDown={keyboard} onFocus={e=>{if(e.target===e.currentTarget){target.current.light=1;paint()}}} onBlur={()=>{if(!drag.current)rest()}}>
  <div className="card-turn">
   <div className="card-face card-front">
    <img src={card.image} alt={card.title} loading={size==='large'?'eager':'lazy'} draggable={false}/>
    <div className="card-shine" aria-hidden="true"/>
    <div className="card-diffraction" aria-hidden="true"/>
    <div className="card-sparkles" aria-hidden="true"/>
    <div className="card-glare" aria-hidden="true"/>
    <div className="card-corner"><span className="rarity-badge">{LABELS[rarity]}</span><span className="card-id">#{String(card.id).slice(-5)}</span></div>
    <button className="card-title" onClick={e=>{e.stopPropagation();onTitle?.()}} title="Voir les informations">{card.title}</button>
   </div>
   <div className="card-face card-back"><div className="back-pattern"/><div className="back-emblem">W</div><span>WIKICARTES</span><div className="card-glare" aria-hidden="true"/></div>
  </div>
 </div>;
}
