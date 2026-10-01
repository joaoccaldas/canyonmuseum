import test from 'node:test';import assert from 'node:assert/strict';
import {safeURL,escapeHTML,sourceState,filterFeed} from '../src/ui/companion-data.js';
import {subscriptions,saveSubscriptions,personalRSS,saveTravelPlaces,travelPlaces} from '../src/ui/companion-subscriptions.js';
const store=()=>{const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)}};
test('untrusted feed markup and credential URLs do not become executable links',()=>{
 assert.equal(safeURL('javascript:alert(1)'),'');assert.equal(safeURL('https://user:secret@example.com'), '');assert.equal(escapeHTML('<img onerror="x">'),'&lt;img onerror=&quot;x&quot;&gt;');
});
test('freshness is based on last success, not the latest attempted refresh',()=>{
 const now=Date.parse('2026-10-01T12:00:00Z');assert.equal(sourceState({status:'ok',last_success_at:'2026-10-01T01:00:00Z',checked_at:new Date(now).toISOString()},now),'stale');assert.equal(sourceState({},now),'unavailable');
});
test('filters combine source, type and search without mutating snapshot',()=>{
 const data={sources:[{id:'sam',name:'Sam Long'}],items:[{id:'a',source_id:'sam',kind:'video',title:'Kona',url:'https://example.com/a',published_at:'2026-09-30'},{id:'b',source_id:'sam',kind:'video',title:'Training',url:'javascript:x',published_at:'2026-10-01'}]};
 assert.equal(filterFeed(data,{kind:'video',query:'sam',source:'sam'}).length,1);assert.equal(filterFeed(data,{kind:'news'}).length,0);assert.equal(data.items.length,2);
});
test('feed and travel subscriptions persist independently and generate matching RSS URLs',t=>{
 const old=globalThis.localStorage;globalThis.localStorage=store();t.after(()=>globalThis.localStorage=old);
 const sources=[{url:'https://example.com/feed',enabled:true,kind:'news',name:'Test'}];
 assert.equal(saveSubscriptions('feed',sources),true);assert.deepEqual(subscriptions('feed',[]),sources);assert.deepEqual(subscriptions('travel',[]),[]);
 const rss=new URL(personalRSS(sources));assert.deepEqual(JSON.parse(rss.searchParams.get('sources')),[{url:sources[0].url,kind:'news'}]);assert.equal(personalRSS([{...sources[0],enabled:false}]),'');
 saveTravelPlaces([{name:'Coffee',url:'https://example.com/'}]);assert.equal(travelPlaces().length,1);assert.deepEqual(subscriptions('feed',[]),sources);
});
