export const EQUIPMENT_RELATIONSHIPS=Object.freeze(['owned','dream','try']);
export function userEquipment({id,productId,relationship='owned',nickname=null,customization=null,createdAt=new Date().toISOString()}={}){
 if(!id||!productId) throw new Error('UserEquipment requires id and productId');
 if(!EQUIPMENT_RELATIONSHIPS.includes(relationship)) throw new Error('Invalid equipment relationship');
 return {schema:'user-equipment-v1',id,productId,relationship,nickname:nickname||null,customization:customization&&typeof customization==='object'?customization:null,createdAt};
}
export function garageView(items=[],products=[]){
 const byId=new Map(products.map(p=>[p.id,p]));
 return items.filter(x=>byId.has(x.productId)).map(x=>({equipment:x,product:byId.get(x.productId)}));
}
export function groupGarage(items=[],products=[]){
 const view=garageView(items,products), out={owned:[],dream:[],try:[]};
 for(const row of view) out[row.equipment.relationship]?.push(row);
 return out;
}
export function raceSetup({id,eventId,equipmentIds=[],goal=null}={}){
 if(!id||!eventId) throw new Error('RaceSetup requires id and eventId');
 return {schema:'race-setup-v1',id,eventId,equipmentIds:[...new Set(equipmentIds.filter(Boolean))],goal:goal||null};
}
