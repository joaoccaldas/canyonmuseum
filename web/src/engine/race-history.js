// engine/race-history.js — user relationships to canonical Race Cards.
// Physical persistence stays in storage.js; catalog metadata is never duplicated here.
import { readStorage, writeStorage } from './storage.js';

export const RACE_RELATIONSHIPS=Object.freeze(['completed','registered','interested']);
const cleanRelation=r=>RACE_RELATIONSHIPS.includes(r)?r:'interested';

export function readRaceHistory(storage=globalThis.localStorage){
  try{
    const v=JSON.parse(readStorage('raceHistory',storage)||'[]');
    return Array.isArray(v)?v.filter(x=>x&&typeof x.race_id==='string').map(x=>({
      race_id:x.race_id,
      relationship:cleanRelation(x.relationship),
      selected_at:typeof x.selected_at==='string'?x.selected_at:null,
      result:x.result&&typeof x.result==='object'?{
        finish_time_seconds:Number.isFinite(+x.result.finish_time_seconds)?+x.result.finish_time_seconds:null,
        bib:x.result.bib==null?null:String(x.result.bib).slice(0,20)
      }:null
    })):[];
  }catch{return[]}
}
export function writeRaceHistory(rows,storage=globalThis.localStorage){
  const out=[]; const seen=new Set();
  for(const x of Array.isArray(rows)?rows:[]){
    if(!x?.race_id||seen.has(x.race_id)) continue;
    seen.add(x.race_id);
    out.push({race_id:String(x.race_id),relationship:cleanRelation(x.relationship),selected_at:x.selected_at||new Date().toISOString(),result:x.result||null});
  }
  writeStorage('raceHistory',JSON.stringify(out),storage);
  return out;
}
export function setRaceRelationship(raceId,relationship,storage=globalThis.localStorage){
  const rows=readRaceHistory(storage).filter(x=>x.race_id!==raceId);
  rows.push({race_id:raceId,relationship:cleanRelation(relationship),selected_at:new Date().toISOString(),result:null});
  return writeRaceHistory(rows,storage);
}
export function removeRace(raceId,storage=globalThis.localStorage){
  return writeRaceHistory(readRaceHistory(storage).filter(x=>x.race_id!==raceId),storage);
}
