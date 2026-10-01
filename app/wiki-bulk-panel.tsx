'use client';

import {useEffect,useState} from 'react';
import type {Dispatch,SetStateAction} from 'react';

type Job={id:string;read_rows:number;total_rows:number;enrich_status:string;enrich_total:number;enrich_processed:number;enrich_created:number;enrich_skipped:number;enrich_errors:number;enrich_last_error?:string|null};

export default function WikiBulkPanel({job,setJob,request,refresh}:{job:Job|null;setJob:Dispatch<SetStateAction<any>>;request:(action:string,body:Record<string,unknown>)=>Promise<any>;refresh:()=>Promise<any>}){
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[waiting,setWaiting]=useState(false);
 const running=job?.enrich_status==='running';
 useEffect(()=>{
  if(!running||!job?.id)return;
  const controller=new AbortController();
  const sleep=(ms:number)=>new Promise<void>(resolve=>{const timer=setTimeout(resolve,ms);controller.signal.addEventListener('abort',()=>{clearTimeout(timer);resolve()},{once:true})});
  async function process(){
   let ticks=0;
   while(!controller.signal.aborted){
    try{
     const result=await request('wikiBulkStep',{jobId:job!.id});
     if(controller.signal.aborted)break;
     if(result.status==='completed'||result.status==='paused'){
      setJob((prev:Job)=>prev?.id===job!.id?{...prev,enrich_status:result.status}:prev);
      await refresh();break;
     }
     if(result.status==='running'){
      setWaiting(false);setError('');
      setJob((prev:Job)=>prev?.id===job!.id?{...prev,enrich_processed:(prev.enrich_processed||0)+result.processed,enrich_created:(prev.enrich_created||0)+result.created,enrich_skipped:(prev.enrich_skipped||0)+result.skipped,enrich_errors:(prev.enrich_errors||0)+result.errors}:prev);
      if(++ticks%25===0)await refresh();
     }else if(result.status==='waiting'){
      setWaiting(true);if(result.error)setError('Wikipédia demande une pause : '+result.error);
     }
     await sleep(result.status==='waiting'||result.status==='busy'?Math.min(300000,Math.max(1000,result.retryAfterMs||3000)):1200);
    }catch(cause){
     setWaiting(true);setError((cause as Error).message||'Traitement interrompu.');
     await sleep(15000);
    }
   }
  }
  process();
  return()=>controller.abort();
 },[job?.id,running,request,refresh,setJob]);

 if(!job||!job.total_rows||job.read_rows<job.total_rows)return null;
 const total=job.enrich_total||0,processed=job.enrich_processed||0,percent=total?Math.min(100,Math.round(processed/total*100)):0;
 const start=async()=>{setBusy(true);setError('');try{const result=await request('wikiBulkStart',{jobId:job.id});setJob((prev:Job)=>prev?.id===job.id?{...prev,enrich_status:result.status,enrich_total:result.total??prev.enrich_total}:prev)}catch(cause){setError((cause as Error).message)}finally{setBusy(false)}};
 const pause=async()=>{setBusy(true);try{await request('wikiBulkControl',{jobId:job.id,control:'paused'});setJob((prev:Job)=>prev?.id===job.id?{...prev,enrich_status:'paused'}:prev);await refresh()}catch(cause){setError((cause as Error).message)}finally{setBusy(false)}};
 return <div className="wiki-bulk-panel">
  <h3>Créer toutes les cartes avec image</h3>
  <p>WikiCartes vérifie les {total?total.toLocaleString('fr-FR'):'articles importés'} articles par lots. Seuls ceux avec une image deviennent des cartes. Garde cette page ouverte pendant le traitement ; si tu la fermes, WikiCartes reprendra à ta prochaine visite.</p>
  <div className="wiki-import-summary" aria-live="polite"><span><b>{processed.toLocaleString('fr-FR')} / {total.toLocaleString('fr-FR')}</b><small>articles vérifiés</small></span><span><b>{(job.enrich_created||0).toLocaleString('fr-FR')}</b><small>cartes créées</small></span><span><b>{(job.enrich_skipped||0).toLocaleString('fr-FR')}</b><small>sans image</small></span><span><b>{(job.enrich_errors||0).toLocaleString('fr-FR')}</b><small>erreurs</small></span></div>
  <div className="wiki-progress" role="progressbar" aria-valuenow={processed} aria-valuemin={0} aria-valuemax={total||1} aria-label="Enrichissement Wikipédia"><div style={{width:percent+'%'}}/><span>{percent}% · {job.enrich_status==='completed'?'terminé':waiting?'pause demandée par Wikipédia':running?'en cours':job.enrich_status==='paused'?'en pause':'prêt'}</span></div>
  {error&&<p className="small" role="alert">{error}</p>}
  {job.enrich_status!=='completed'&&<div className="wiki-actions">{running?<button className="outline-button" disabled={busy} onClick={pause}>Mettre en pause</button>:<button className="gold-button" disabled={busy} onClick={start}>{job.enrich_status==='paused'?'Reprendre la création':'Créer toutes les cartes avec image'}</button>}</div>}
 </div>;
}
