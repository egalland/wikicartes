'use client';

import {useRef,useState} from 'react';

export default function CardFamilyPanel({refresh}:{refresh:()=>Promise<void>}){
 const [running,setRunning]=useState(false);
 const [scanned,setScanned]=useState(0);
 const [updated,setUpdated]=useState(0);
 const [message,setMessage]=useState('');
 const stop=useRef(false);

 async function reclassify(){
  if(running)return;
  stop.current=false;
  setRunning(true);
  setScanned(0);
  setUpdated(0);
  setMessage('');
  let after=0,read=0,changed=0;
  try{
   while(!stop.current){
    const response=await fetch('/api/atlas',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'reclassifyCards',after})});
    const result=await response.json() as {processed:number,updated:number,after:number,hasMore:boolean,error?:string};
    if(!response.ok)throw Error(result.error||'Classement interrompu.');
    read+=result.processed;
    changed+=result.updated;
    after=result.after;
    setScanned(read);
    setUpdated(changed);
    if(!result.hasMore)break;
    await new Promise(resolve=>setTimeout(resolve,150));
   }
   setMessage(stop.current?'Classement en pause. Relance le bouton pour reprendre.':'Classement terminé. Les cartes sans catégorie reconnue restent dans Découvertes.');
   await refresh();
  }catch(error){setMessage((error as Error).message+' Relance le bouton pour reprendre.');}
  finally{setRunning(false);}
 }

 return <section className="admin-panel"><h2>Familles des cartes</h2><p>Les nouvelles cartes sont réparties selon leurs catégories Wikipédia. Reclasse aussi les cartes déjà importées, y compris celles rangées dans la mauvaise famille.</p><div className="wiki-actions"><button className="outline-button" disabled={running} onClick={reclassify}>Reclasser toutes les cartes</button>{running&&<button className="ghost" onClick={()=>{stop.current=true}}>Mettre en pause</button>}</div>{(running||scanned>0)&&<p role="status">{scanned.toLocaleString('fr-FR')} cartes examinées · {updated.toLocaleString('fr-FR')} reclassées</p>}{message&&<p role="status">{message}</p>}</section>;
}
