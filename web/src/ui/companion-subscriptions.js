import policy from '../../../supabase/functions/companion/source-policy.json' with {type:'json'};
export const supportedPublishers=policy.publishers;
import config from '../../../supabase/functions/companion/public-config.json' with {type:'json'};
import {readStorage,writeStorage} from '../engine/storage.js';
import {safeURL} from './companion-data.js';
const endpoint=config.url+'/functions/v1/companion';
const read=()=>{try{return JSON.parse(readStorage('companion')||'{}');}catch{return {};}};
export function subscriptions(scope,defaults){return read()[scope]?.sources||defaults.map(s=>({url:s.feed_url,kind:s.kind,name:s.name,enabled:true}));}
export function saveSubscriptions(scope,sources){const state=read();state[scope]={...state[scope],sources};return writeStorage('companion',JSON.stringify(state));}
export function travelPlaces(){return read().travel?.places||[];}
export function saveTravelPlaces(places){const state=read();state.travel={...state.travel,places};return writeStorage('companion',JSON.stringify(state));}
export function personalRSS(sources){const list=sources.filter(s=>s.enabled).map(s=>({url:s.url,kind:s.kind}));return list.length?endpoint+'?format=rss&key='+encodeURIComponent(config.publishable_key)+'&sources='+encodeURIComponent(JSON.stringify(list)):'';}
export async function fetchSources(sources,signal){
 const list=sources.filter(s=>s.enabled!==false).map(s=>({url:s.url,kind:s.kind}));
 if(!list.length)return {schema_version:1,checked_at:new Date().toISOString(),sources:[],items:[],errors:[]};
 if(list.some(s=>!safeURL(s.url)))throw new Error('Use public HTTPS URLs.');
 const local=new AbortController(),timer=setTimeout(()=>local.abort(),50000),abort=()=>local.abort();signal?.addEventListener('abort',abort,{once:true});
 if(signal?.aborted)local.abort();
 try{
  const response=await fetch(endpoint,{method:'POST',headers:{apikey:config.publishable_key,'Content-Type':'application/json'},body:JSON.stringify({sources:list}),signal:local.signal,credentials:'omit'});
  const data=await response.json();if(!response.ok)throw new Error(data.error||'Feed service unavailable.');return data;
 }finally{clearTimeout(timer);signal?.removeEventListener('abort',abort);}
}
export async function liveSubscriptions(scope,selected,fallback,signal){
 let cache={};try{cache=JSON.parse(readStorage('companionCache')||'{}');}catch{}
 const prior=cache[scope]||fallback,active=new Set(selected.filter(s=>s.enabled).map(s=>s.url));
 try{
  const live=await fetchSources(selected,signal);
  const failed=new Set((live.errors||[]).map(e=>e.requested_url));
  for(const old of prior.sources||[])if(failed.has(old.feed_url)&&active.has(old.feed_url)){
   live.sources.push({...old,status:'stale'});live.items.push(...prior.items.filter(i=>i.source_id===old.id));
  }
  // Resolve user-friendly curated names without changing source identity or dates.
  for(const s of live.sources){const custom=selected.find(x=>x.url===s.feed_url);if(custom?.name)s.name=custom.name;}
  cache[scope]=live;writeStorage('companionCache',JSON.stringify(cache));return live;
 }catch(error){
  if(signal?.aborted)throw error;
  const sources=(prior.sources||[]).filter(s=>active.has(s.feed_url)).map(s=>({...s,status:'stale'})),ids=new Set(sources.map(s=>s.id));
  return {...prior,sources,items:(prior.items||[]).filter(i=>ids.has(i.source_id)),offline:true};
 }
}
