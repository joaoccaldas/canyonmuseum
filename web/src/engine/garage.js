import { readStorage, writeStorage } from './storage.js';
export const EQUIPMENT_RELATIONSHIPS=Object.freeze(['owned','dream','try']);
const valid=x=>x&&typeof x.id==='string'&&typeof x.productId==='string'&&EQUIPMENT_RELATIONSHIPS.includes(x.relationship);
export function readGarage(){try{const x=JSON.parse(readStorage('userEquipment')||'[]');return Array.isArray(x)?x.filter(valid):[];}catch(_){return[]}}
export function addToGarage(productId,{relationship='dream'}={}){
 if(!productId||!EQUIPMENT_RELATIONSHIPS.includes(relationship)) throw new Error('Invalid garage item');
 const items=readGarage(), existing=items.find(x=>x.productId===productId&&x.relationship===relationship);
 if(existing)return{items,item:existing,added:false};
 const item={schema:'user-equipment-v1',id:`equipment:${productId}:${relationship}`,productId,relationship,createdAt:new Date().toISOString()};
 const next=[...items,item];writeStorage('userEquipment',JSON.stringify(next));return{items:next,item,added:true};
}
export function removeFromGarage(id){const next=readGarage().filter(x=>x.id!==id);writeStorage('userEquipment',JSON.stringify(next));return next;}
export function groupGarage(items=readGarage()){const out={owned:[],dream:[],try:[]};for(const x of items)out[x.relationship].push(x);return out;}
