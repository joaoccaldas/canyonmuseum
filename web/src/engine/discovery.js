// engine/discovery.js — canonical "what is over the horizon?" projection.
// Teasers may hint at future content. They never grant inventory or currency by themselves.
export const DISCOVERY_HORIZON=Object.freeze([
  {id:'horizon:ocean-kit',level:2,kind:'customization',tease:'A new look for your Race Self',silhouette:'KIT',reveal:'Ocean training kit'},
  {id:'horizon:cfr',level:3,kind:'bike',tease:'Something very fast is hiding in the lava',silhouette:'BIKE',reveal:'Canyon Speedmax CFR · 2027'},
  {id:'horizon:trisuit',level:4,kind:'trisuit',tease:'A trisuit we are not showing you yet',silhouette:'SUIT',reveal:'Advanced trisuit customization'},
  {id:'horizon:credits',level:5,kind:'credits',tease:'There is something spendable up ahead',silhouette:'KC',reveal:'KONA Credits reward'},
  {id:'horizon:lava-night',level:6,kind:'place',tease:'One room is keeping the lights off',silhouette:'ROOM',reveal:'Lava Night'},
  {id:'horizon:gear',level:7,kind:'gear',tease:'A new equipment slot is coming into focus',silhouette:'GEAR',reveal:'Race gear collection'},
]);

export function discoveryHorizon(progression={},count=4){
  const level=Math.max(1,Number(progression.level)||1);
  return DISCOVERY_HORIZON
    .map(row=>Object.freeze({...row,unlocked:level>=row.level,levelsAway:Math.max(0,row.level-level)}))
    .filter(row=>row.level>=Math.max(2,level-1))
    .slice(0,count);
}
